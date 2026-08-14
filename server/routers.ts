import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createSearchRun, getDashboardMetrics, listLeads, upsertLead, updateLeadQualification } from "./db";
import { leadQualifications, leads } from "../drizzle/schema";
import { z } from "zod";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

const OPENROUTER_MODEL = "openai/gpt-4o-mini";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    metrics: protectedProcedure.query(() => getDashboardMetrics()),
  }),
  leads: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional(), city: z.string().optional(), state: z.string().optional(), region: z.string().optional(), niche: z.string().optional(), whatsapp: z.enum(["valid", "invalid", "pending"]).optional(), minScore: z.number().optional() }).default({})).query(({ input }) => listLeads(input)),
    ingest: publicProcedure.input(z.object({ token: z.string().optional(), lead: z.record(z.string(), z.unknown()) })).mutation(async ({ input }) => {
      if (process.env.N8N_WEBHOOK_TOKEN && input.token !== process.env.N8N_WEBHOOK_TOKEN) throw new Error("Webhook token inválido");
      const row = await upsertLead(input.lead);
      return { success: true, lead: row };
    }),
    qualify: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      const [lead] = db ? await db.select().from(leads).where(eq(leads.id, input.id)).limit(1) : [];
      if (!lead) throw new Error("Lead não encontrado");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://leadflow-ops.manus.space", "X-Title": "LeadFlow Ops" },
        body: JSON.stringify({ model: OPENROUTER_MODEL, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Você qualifica leads B2B. Retorne JSON com score inteiro de 0 a 100, status qualified ou discarded, e reason curta em português. Considere presença de WhatsApp, categoria, avaliações, site e contexto local." }, { role: "user", content: JSON.stringify(lead) }] }),
      });
      if (!response.ok) throw new Error(`OpenRouter retornou ${response.status}`);
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = payload.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as { score?: number; status?: "qualified" | "discarded"; reason?: string };
      const score = Math.max(0, Math.min(100, Number(parsed.score ?? 0)));
      const status = parsed.status === "qualified" ? "qualified" : "discarded";
      const reason = parsed.reason ?? "Sem justificativa retornada.";
      const result = await updateLeadQualification(input.id, score, status, reason);
      if (db) await db.insert(leadQualifications).values({ leadId: input.id, score, status, reason, model: OPENROUTER_MODEL });
      return result;
    }),
    exportCsv: protectedProcedure.input(z.object({ minScore: z.number().default(70) })).query(async ({ input }) => {
      const rows = await listLeads({ minScore: input.minScore, whatsapp: "valid" });
      const header = ["nome", "telefone", "categoria", "cidade", "estado", "score", "status", "site", "endereco"];
      const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const csv = [header.join(","), ...rows.map(row => [row.name, row.phone, row.category, row.city, row.state, row.qualificationScore, row.qualificationStatus, row.website, row.address].map(escape).join(","))].join("\n");
      return { filename: `leadflow-melhores-leads-${new Date().toISOString().slice(0, 10)}.csv`, csv };
    }),
  }),
  searches: router({
    create: protectedProcedure.input(z.object({ niche: z.string().min(2), city: z.string().optional(), state: z.string().optional(), region: z.string().optional() })).mutation(async ({ input }) => {
      const runId = await createSearchRun(input);
      if (!process.env.N8N_WEBHOOK_URL) return { runId, dispatched: false, message: "Busca salva, mas N8N_WEBHOOK_URL não está configurada." };
      const response = await fetch(process.env.N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.N8N_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ searchRunId: runId, niche: input.niche, city: input.city, state: input.state, region: input.region, locationQuery: [input.city, input.state, input.region].filter(Boolean).join(", "), searchStringsArray: [input.niche] }) });
      return { runId, dispatched: response.ok, message: response.ok ? "Coleta enviada ao workflow do n8n." : `n8n retornou ${response.status}.` };
    }),
  }),
});

export type AppRouter = typeof appRouter;
