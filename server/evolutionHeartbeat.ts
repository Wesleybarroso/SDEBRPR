import type { Request, Response } from "express";
import { getWhatsappNumberByTaskUid, getWhatsappNumberSecret, updateWhatsappConnection } from "./db";
import { sdk } from "./_core/sdk";

type EvolutionStatePayload = { instance?: { state?: string; status?: string }; state?: string; status?: string; instanceState?: string };

export async function evolutionHeartbeatHandler(req: Request, res: Response) {
  const context = { url: req.originalUrl, timestamp: new Date().toISOString() };
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const row = await getWhatsappNumberByTaskUid(user.taskUid);
    if (!row) return res.status(200).json({ ok: true, skipped: "orphan" });
    const number = await getWhatsappNumberSecret(row.userId, row.id);
    if (!number) return res.status(200).json({ ok: true, skipped: "missing-number" });

    const endpoint = `${number.apiUrl.replace(/\/$/, "")}/instance/connectionState/${encodeURIComponent(number.instanceName)}`;
    const response = await fetch(endpoint, { method: "GET", headers: { apikey: number.apiKey, Authorization: `Bearer ${number.apiKey}`, Accept: "application/json" } });
    const raw = await response.text();
    if (!response.ok) {
      await updateWhatsappConnection(row.userId, row.id, "error", `Evolution Go retornou ${response.status}`);
      return res.status(200).json({ ok: false, status: "error", httpStatus: response.status });
    }
    let payload: EvolutionStatePayload = {};
    try { payload = raw ? JSON.parse(raw) as EvolutionStatePayload : {}; } catch { /* resposta sem JSON ainda pode representar instância online */ }
    const state = String(payload.instance?.state ?? payload.instance?.status ?? payload.instanceState ?? payload.state ?? payload.status ?? "open").toLowerCase();
    const connected = state.includes("open") || state.includes("connected") || state.includes("online");
    await updateWhatsappConnection(row.userId, row.id, connected ? "connected" : "offline", connected ? null : `Estado Evolution Go: ${state}`);
    return res.status(200).json({ ok: true, status: connected ? "connected" : "offline", state });
  } catch (error) {
    console.error("[Evolution] heartbeat failed", error);
    return res.status(500).json({ error: String(error), stack: error instanceof Error ? error.stack : undefined, context });
  }
}
