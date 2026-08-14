import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { ConversationStage, createSearchRun, getConversationMessages, getDashboardMetrics, getIntegrationSecrets, getIntegrationSettings, getLeadQualityMetrics, getMessageTemplate, getWhatsappNumberSecret, listConversations, listLeads, listMessageTemplates, listWhatsappNumbers, markConversationMessage, moveConversation, reorderConversation, removeIntegrationSetting, removeMessageTemplate, removeWhatsappNumber, saveConversationMessage, saveIntegrationSettings, saveMessageTemplate, saveUserAvatar, saveWhatsappNumber, setWhatsappActive, setWhatsappDefault, setWhatsappScheduleTaskUid, upsertLead, updateLeadQualification } from "./db";
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
  profile: router({
    avatar: protectedProcedure.input(z.object({ dataUrl: z.string().max(7_500_000) })).mutation(({ ctx, input }) => saveUserAvatar(ctx.user.id, input.dataUrl)),
    update: protectedProcedure.input(z.object({ name: z.string().min(2).optional(), email: z.string().email().optional(), preferences: z.object({ defaultNiche: z.string().optional(), minScore: z.number().min(0).max(100).optional(), compactMode: z.boolean().optional() }).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco indisponível");
      const { users } = await import("../drizzle/schema");
      await db.update(users).set({ name: input.name, email: input.email, preferences: input.preferences ? JSON.stringify(input.preferences) : undefined }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
  }),
  dashboard: router({
    metrics: protectedProcedure.query(() => getDashboardMetrics()),
    quality: protectedProcedure.query(() => getLeadQualityMetrics()),
  }),
  leads: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional(), city: z.string().optional(), state: z.string().optional(), region: z.string().optional(), niche: z.string().optional(), whatsapp: z.enum(["valid", "invalid", "pending"]).optional(), minScore: z.number().optional() }).default({})).query(({ input }) => listLeads(input)),
    ingest: publicProcedure.input(z.object({ token: z.string().optional(), lead: z.record(z.string(), z.unknown()) })).mutation(async ({ input }) => {
      if (process.env.N8N_WEBHOOK_TOKEN && input.token !== process.env.N8N_WEBHOOK_TOKEN) throw new Error("Webhook token inválido");
      const row = await upsertLead(input.lead);
      return { success: true, lead: row };
    }),
    qualify: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [lead] = db ? await db.select().from(leads).where(eq(leads.id, input.id)).limit(1) : [];
      if (!lead) throw new Error("Lead não encontrado");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${(await getIntegrationSecrets(ctx.user.id)).openrouterApiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://leadflow-ops.manus.space", "X-Title": "LeadFlow Ops" },
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
  whatsapp: router({
    list: protectedProcedure.query(({ ctx }) => listWhatsappNumbers(ctx.user.id)),
    save: protectedProcedure.input(z.object({ id: z.number().optional(), label: z.string().min(2).max(120), phone: z.string().min(8).max(40), instanceName: z.string().min(1).max(160), apiUrl: z.string().url(), apiKey: z.string().max(500).optional(), isActive: z.boolean().optional(), isDefault: z.boolean().optional(), keepAlive: z.boolean().optional() })).mutation(({ ctx, input }) => saveWhatsappNumber(ctx.user.id, input)),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => removeWhatsappNumber(ctx.user.id, input.id)),
    setDefault: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => setWhatsappDefault(ctx.user.id, input.id)),
    setActive: protectedProcedure.input(z.object({ id: z.number(), isActive: z.boolean() })).mutation(({ ctx, input }) => setWhatsappActive(ctx.user.id, input.id, input.isActive)),
    persistent: protectedProcedure.input(z.object({ id: z.number(), enabled: z.boolean(), cron: z.string().regex(/^\S+ \S+ \S+ \S+ \S+ \S+$/).default("0 */5 * * * *") })).mutation(async ({ ctx, input }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const number = await getWhatsappNumberSecret(ctx.user.id, input.id);
      if (!number) throw new Error("Número WhatsApp não encontrado");
      const listed = (await listWhatsappNumbers(ctx.user.id)).find(row => row.id === input.id) as { scheduleCronTaskUid?: string | null } | undefined;
      if (!input.enabled) {
        if (listed?.scheduleCronTaskUid) await deleteHeartbeatJob(listed.scheduleCronTaskUid, sessionToken);
        await setWhatsappScheduleTaskUid(ctx.user.id, input.id, null);
        return { success: true, enabled: false };
      }
      const job = listed?.scheduleCronTaskUid
        ? await updateHeartbeatJob(listed.scheduleCronTaskUid, { cron: input.cron, enable: true }, sessionToken).then(() => ({ taskUid: listed.scheduleCronTaskUid! }))
        : await createHeartbeatJob({ name: `sdebr-evolution-${number.id}`, cron: input.cron, path: "/api/scheduled/evolutionHeartbeat", description: `Verificação persistente da instância ${number.instanceName}` }, sessionToken);
      await setWhatsappScheduleTaskUid(ctx.user.id, input.id, job.taskUid);
      return { success: true, enabled: true, taskUid: job.taskUid };
    }),
  }),
  conversations: router({
    list: protectedProcedure.input(z.object({ stage: z.enum(["new", "contacted", "waiting", "interested", "in_progress", "not_interested", "rescue", "closed"]).optional() }).default({})).query(({ input }) => listConversations(input.stage as ConversationStage | undefined)),
    messages: protectedProcedure.input(z.object({ conversationId: z.number() })).query(({ input }) => getConversationMessages(input.conversationId)),
    move: protectedProcedure.input(z.object({ conversationId: z.number(), stage: z.enum(["new", "contacted", "waiting", "interested", "in_progress", "not_interested", "rescue", "closed"]), serviceOrder: z.number().optional() })).mutation(({ input }) => moveConversation(input.conversationId, input.stage as ConversationStage, input.serviceOrder)),
    reorder: protectedProcedure.input(z.object({ conversationId: z.number(), direction: z.enum(["up", "down"]) })).mutation(({ input }) => reorderConversation(input.conversationId, input.direction)),
    rescue: protectedProcedure.input(z.object({ conversationId: z.number() })).mutation(({ input }) => moveConversation(input.conversationId, "rescue")),
    reactivate: protectedProcedure.input(z.object({ conversationId: z.number(), body: z.string().max(4000).optional(), whatsappNumberId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { conversations, leads } = await import("../drizzle/schema");
      const [row] = db ? await db.select({ conversation: conversations, lead: leads }).from(conversations).leftJoin(leads, eq(conversations.leadId, leads.id)).where(eq(conversations.id, input.conversationId)).limit(1) : [];
      if (!row?.lead) throw new Error("Conversa ou lead não encontrado");
      const body = input.body?.trim() || "Olá! Passando para saber se este é um bom momento para retomarmos a conversa. Posso ajudar em algo?";
      const pending = await saveConversationMessage({ conversationId: input.conversationId, direction: "outbound", author: "manual", body, deliveryStatus: "pending" });
      const integration = await getIntegrationSecrets(ctx.user.id);
      const sender = await getWhatsappNumberSecret(ctx.user.id, input.whatsappNumberId);
      if (!integration.n8nWebhookUrl) throw new Error("Configure o webhook do n8n antes de reativar leads");
      const response = await fetch(integration.n8nWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json", ...(integration.n8nWebhookToken ? { Authorization: `Bearer ${integration.n8nWebhookToken}` } : {}) }, body: JSON.stringify({ type: "conversation.reactivate", conversationId: input.conversationId, messageId: pending?.id, leadId: row.lead.id, to: row.lead.phone, text: body, evolution: sender ? { numberId: sender.id, phone: sender.phone, instanceName: sender.instanceName, apiUrl: sender.apiUrl, apiKey: sender.apiKey, keepAlive: sender.keepAlive } : { apiUrl: integration.evolutionApiUrl, apiKey: integration.evolutionApiKey } }) });
      const result = pending ? await markConversationMessage(pending.id, response.ok ? "sent" : "failed") : undefined;
      if (!response.ok) throw new Error(`n8n retornou ${response.status}`);
      await moveConversation(input.conversationId, "contacted");
      return result;
    }),
    send: protectedProcedure.input(z.object({ conversationId: z.number(), body: z.string().min(1).max(4000), author: z.enum(["ai", "manual"]).default("manual"), whatsappNumberId: z.number().optional(), templateId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { conversations, leads } = await import("../drizzle/schema");
      const [row] = db ? await db.select({ conversation: conversations, lead: leads }).from(conversations).leftJoin(leads, eq(conversations.leadId, leads.id)).where(eq(conversations.id, input.conversationId)).limit(1) : [];
      if (!row?.lead) throw new Error("Conversa ou lead não encontrado");
      const pending = await saveConversationMessage({ conversationId: input.conversationId, direction: "outbound", author: input.author, body: input.body, deliveryStatus: "pending" });
      const integration = await getIntegrationSecrets(ctx.user.id);
      const sender = await getWhatsappNumberSecret(ctx.user.id, input.whatsappNumberId);
      const template = input.templateId ? await getMessageTemplate(ctx.user.id, input.templateId) : undefined;
      if (!integration.n8nWebhookUrl) throw new Error("Configure o webhook do n8n antes de enviar mensagens");
      const response = await fetch(integration.n8nWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json", ...(integration.n8nWebhookToken ? { Authorization: `Bearer ${integration.n8nWebhookToken}` } : {}) }, body: JSON.stringify({ type: "conversation.message", conversationId: input.conversationId, messageId: pending?.id, leadId: row.lead.id, to: row.lead.phone, text: input.body, author: input.author, templateId: template?.id, templateName: template?.name, evolution: sender ? { numberId: sender.id, phone: sender.phone, instanceName: sender.instanceName, apiUrl: sender.apiUrl, apiKey: sender.apiKey, keepAlive: sender.keepAlive } : { apiUrl: integration.evolutionApiUrl, apiKey: integration.evolutionApiKey } }) });
      const result = pending ? await markConversationMessage(pending.id, response.ok ? "sent" : "failed") : undefined;
      if (!response.ok) throw new Error(`n8n retornou ${response.status}`);
      return result;
    }),
  }),
  settings: router({
    integrations: protectedProcedure.query(({ ctx }) => getIntegrationSettings(ctx.user.id)),
    saveIntegrations: protectedProcedure.input(z.object({ apifyApiKey: z.string().optional(), n8nWebhookUrl: z.string().optional(), n8nWebhookToken: z.string().optional(), openrouterApiKey: z.string().optional(), evolutionApiUrl: z.string().optional(), evolutionApiKey: z.string().optional(), postgresUrl: z.string().optional(), hasuraEndpoint: z.string().optional(), hasuraAdminSecret: z.string().optional() })).mutation(({ ctx, input }) => saveIntegrationSettings(ctx.user.id, input)),
    removeIntegration: protectedProcedure.input(z.object({ field: z.enum(["apifyApiKey", "n8nWebhookUrl", "n8nWebhookToken", "openrouterApiKey", "evolutionApiUrl", "evolutionApiKey", "postgresUrl", "hasuraEndpoint", "hasuraAdminSecret"]) })).mutation(({ ctx, input }) => removeIntegrationSetting(ctx.user.id, input.field)),
  }),
  messageTemplates: router({
    generate: protectedProcedure.input(z.object({ productDescription: z.string().min(10).max(2000), audience: z.string().max(500).optional(), tone: z.enum(["consultivo", "direto", "cordial", "premium"]).default("consultivo"), channel: z.enum(["whatsapp", "email", "instagram"]).default("whatsapp"), offer: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
      const integration = await getIntegrationSecrets(ctx.user.id);
      if (!integration.openrouterApiKey) throw new Error("Configure a API key do OpenRouter antes de gerar modelos com IA");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${integration.openrouterApiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://sdebr.manus.space", "X-Title": "SDEBR" },
        body: JSON.stringify({ model: OPENROUTER_MODEL, temperature: 0.75, response_format: { type: "json_object" }, messages: [
          { role: "system", content: "Você é um copywriter brasileiro especializado em prospecção B2B responsável. Gere uma mensagem curta, humana e personalizada, sem promessas enganosas, spam, pressão indevida ou afirmações não fornecidas. Retorne somente JSON válido com os campos name, category, body e variables. Use variáveis no formato {nome}, {empresa} e {cidade} quando fizer sentido." },
          { role: "user", content: JSON.stringify({ productDescription: input.productDescription, audience: input.audience || "Não informado", tone: input.tone, channel: input.channel, offer: input.offer || "Não informado", instructions: "Crie um primeiro contato com CTA leve e uma categoria apropriada. O texto deve ser pronto para revisão antes do envio." }) },
        ] }),
      });
      if (!response.ok) throw new Error(`OpenRouter retornou ${response.status}`);
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = payload.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim() || "{}";
      const generated = JSON.parse(raw) as { name?: string; category?: string; body?: string; variables?: string };
      if (!generated.body) throw new Error("A IA não retornou um texto de mensagem válido");
      return { name: generated.name || "Modelo gerado por IA", category: generated.category || "prospeccao", body: generated.body.slice(0, 4000), variables: generated.variables || "nome, empresa, cidade" };
    }),
    list: protectedProcedure.query(({ ctx }) => listMessageTemplates(ctx.user.id)),
    save: protectedProcedure.input(z.object({ id: z.number().optional(), name: z.string().min(2).max(120), category: z.string().max(60).default("prospeccao"), body: z.string().min(1).max(4000), variables: z.string().max(500).optional(), isActive: z.boolean().default(true) })).mutation(({ ctx, input }) => saveMessageTemplate(ctx.user.id, input)),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => removeMessageTemplate(ctx.user.id, input.id)),
  }),
  searches: router({
    create: protectedProcedure.input(z.object({ niche: z.string().min(2), city: z.string().optional(), state: z.string().optional(), region: z.string().optional(), cep: z.string().regex(/^\d{5}-?\d{3}$/).optional(), leadLimit: z.number().int().min(1).max(500).default(50) })).mutation(async ({ ctx, input }) => {
      const runId = await createSearchRun(input);
      const integration = await getIntegrationSecrets(ctx.user.id);
      if (!integration.n8nWebhookUrl) return { runId, dispatched: false, message: "Busca salva, mas o webhook do n8n não está configurado." };
      const response = await fetch(integration.n8nWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json", ...(integration.n8nWebhookToken ? { Authorization: `Bearer ${integration.n8nWebhookToken}` } : {}) }, body: JSON.stringify({ searchRunId: runId, niche: input.niche, city: input.city, state: input.state, region: input.region, cep: input.cep, leadLimit: input.leadLimit, maxResults: input.leadLimit, locationQuery: [input.cep ? `CEP ${input.cep}` : undefined, input.city, input.state, input.region].filter(Boolean).join(", "), searchStringsArray: [input.niche] }) });
      return { runId, dispatched: response.ok, message: response.ok ? "Coleta enviada ao workflow do n8n." : `n8n retornou ${response.status}.` };
    }),
  }),
});

export type AppRouter = typeof appRouter;
