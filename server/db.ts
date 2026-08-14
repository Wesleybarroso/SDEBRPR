import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, conversationMessages, conversations, leads, searchRuns, userIntegrations, userWhatsappNumbers, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { isReadyToSend, normalizePhone } from "../shared/leadRules";
import { deliveryStatusFromEvolution, evolutionStatusUpdate, nextQueueOrder } from "../shared/conversationRules";
import { decryptSecret, encryptSecret, maskSecret } from "./integrationSecrets";
import { maskIntegrationRecord } from "../shared/integrationSettings";
import { storagePut } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function saveUserAvatar(userId: number, dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Formato de imagem inválido. Use PNG, JPG ou WEBP.");
  const buffer = Buffer.from(match[3], "base64");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("A foto deve ter no máximo 5 MB.");
  const uploaded = await storagePut(`users/${userId}/avatar`, buffer, match[1]);
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  await db.update(users).set({ avatarUrl: uploaded.url }).where(eq(users.id, userId));
  return { success: true, avatarUrl: uploaded.url };
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

const integrationSecretFields = ["apifyApiKey", "n8nWebhookToken", "openrouterApiKey", "evolutionApiKey", "postgresUrl", "hasuraAdminSecret"] as const;

type IntegrationInput = Partial<Record<typeof integrationSecretFields[number], string>> & { n8nWebhookUrl?: string; evolutionApiUrl?: string; hasuraEndpoint?: string };

export async function getIntegrationSettings(userId: number) {
  const db = await getDb();
  if (!db) return { configured: false, values: {} };
  const [row] = await db.select().from(userIntegrations).where(eq(userIntegrations.userId, userId)).limit(1);
  if (!row) return { configured: false, values: {} };
  const values = maskIntegrationRecord(row as Record<string, unknown>);
  return { configured: true, values };
}

export async function getIntegrationSecrets(userId: number) {
  const db = await getDb();
  if (!db) return { n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || "", n8nWebhookToken: process.env.N8N_WEBHOOK_TOKEN || "", openrouterApiKey: process.env.OPENROUTER_API_KEY || "", evolutionApiUrl: process.env.EVOLUTION_API_URL || "", evolutionApiKey: process.env.EVOLUTION_API_KEY || "" };
  const [row] = await db.select().from(userIntegrations).where(eq(userIntegrations.userId, userId)).limit(1);
  if (!row) return { n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || "", n8nWebhookToken: process.env.N8N_WEBHOOK_TOKEN || "", openrouterApiKey: process.env.OPENROUTER_API_KEY || "", evolutionApiUrl: process.env.EVOLUTION_API_URL || "", evolutionApiKey: process.env.EVOLUTION_API_KEY || "" };
  return {
    n8nWebhookUrl: row.n8nWebhookUrl || process.env.N8N_WEBHOOK_URL || "",
    n8nWebhookToken: decryptSecret(row.n8nWebhookToken) || process.env.N8N_WEBHOOK_TOKEN || "",
    openrouterApiKey: decryptSecret(row.openrouterApiKey) || process.env.OPENROUTER_API_KEY || "",
    evolutionApiUrl: row.evolutionApiUrl || process.env.EVOLUTION_API_URL || "",
    evolutionApiKey: decryptSecret(row.evolutionApiKey) || process.env.EVOLUTION_API_KEY || "",
  };
}

export async function removeIntegrationSetting(userId: number, field: keyof IntegrationInput) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.update(userIntegrations).set({ [field]: null }).where(eq(userIntegrations.userId, userId));
  return { success: true };
}

export async function saveIntegrationSettings(userId: number, input: IntegrationInput) {
  const db = await getDb();
  if (!db) return { success: false };
  const encrypted: Record<string, string> = {};
  for (const field of integrationSecretFields) if (input[field]) encrypted[field] = encryptSecret(input[field]!);
  const plainFields = ["n8nWebhookUrl", "evolutionApiUrl", "hasuraEndpoint"] as const;
  for (const field of plainFields) if (input[field] !== undefined) encrypted[field] = input[field] || "";
  await db.insert(userIntegrations).values({ userId, ...encrypted }).onDuplicateKeyUpdate({ set: encrypted });
  return { success: true };
}

export async function listWhatsappNumbers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(userWhatsappNumbers).where(eq(userWhatsappNumbers.userId, userId)).orderBy(desc(userWhatsappNumbers.isDefault), desc(userWhatsappNumbers.updatedAt));
  return rows.map(row => ({ ...row, apiKey: maskSecret(decryptSecret(row.apiKey)) }));
}

type WhatsappNumberInput = { id?: number; label: string; phone: string; instanceName: string; apiUrl: string; apiKey?: string; isActive?: boolean; isDefault?: boolean; keepAlive?: boolean };

export async function saveWhatsappNumber(userId: number, input: WhatsappNumberInput) {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const values: Record<string, unknown> = { userId, label: input.label.trim(), phone: input.phone.trim(), instanceName: input.instanceName.trim(), apiUrl: input.apiUrl.trim(), isActive: input.isActive ?? true, keepAlive: input.keepAlive ?? false, isDefault: input.isDefault ?? false };
  if (input.apiKey?.trim()) values.apiKey = encryptSecret(input.apiKey.trim());
  if (input.id) {
    if (!input.apiKey?.trim()) {
      const [existing] = await db.select({ apiKey: userWhatsappNumbers.apiKey }).from(userWhatsappNumbers).where(and(eq(userWhatsappNumbers.id, input.id), eq(userWhatsappNumbers.userId, userId))).limit(1);
      if (existing) values.apiKey = existing.apiKey;
    }
    await db.update(userWhatsappNumbers).set(values).where(and(eq(userWhatsappNumbers.id, input.id), eq(userWhatsappNumbers.userId, userId)));
  } else {
    if (!values.apiKey) throw new Error("A chave Evolution Go é obrigatória no primeiro cadastro");
    const existing = await db.select({ id: userWhatsappNumbers.id }).from(userWhatsappNumbers).where(eq(userWhatsappNumbers.userId, userId)).limit(1);
    if (!existing.length) values.isDefault = true;
    await db.insert(userWhatsappNumbers).values(values as never);
  }
  const saved = input.id ? input.id : (await db.select({ id: userWhatsappNumbers.id }).from(userWhatsappNumbers).where(eq(userWhatsappNumbers.userId, userId)).orderBy(desc(userWhatsappNumbers.id)).limit(1))[0]?.id;
  if (values.isDefault && saved) await db.update(userWhatsappNumbers).set({ isDefault: false }).where(and(eq(userWhatsappNumbers.userId, userId), sql`${userWhatsappNumbers.id} <> ${saved}`));
  return { success: true, id: saved };
}

export async function removeWhatsappNumber(userId: number, id: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.delete(userWhatsappNumbers).where(and(eq(userWhatsappNumbers.id, id), eq(userWhatsappNumbers.userId, userId)));
  return { success: true };
}

export async function setWhatsappDefault(userId: number, id: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.update(userWhatsappNumbers).set({ isDefault: false }).where(eq(userWhatsappNumbers.userId, userId));
  await db.update(userWhatsappNumbers).set({ isDefault: true }).where(and(eq(userWhatsappNumbers.id, id), eq(userWhatsappNumbers.userId, userId)));
  return { success: true };
}

export async function setWhatsappActive(userId: number, id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.update(userWhatsappNumbers).set({ isActive, connectionStatus: isActive ? "connecting" : "offline" }).where(and(eq(userWhatsappNumbers.id, id), eq(userWhatsappNumbers.userId, userId)));
  return { success: true };
}

export async function getWhatsappNumberSecret(userId: number, id?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const where = id ? and(eq(userWhatsappNumbers.userId, userId), eq(userWhatsappNumbers.id, id)) : and(eq(userWhatsappNumbers.userId, userId), eq(userWhatsappNumbers.isActive, true));
  const rows = await db.select().from(userWhatsappNumbers).where(where).orderBy(desc(userWhatsappNumbers.isDefault), desc(userWhatsappNumbers.updatedAt)).limit(1);
  const row = rows[0];
  return row ? { ...row, apiKey: decryptSecret(row.apiKey) } : undefined;
}

export async function updateWhatsappConnection(userId: number, id: number, status: "offline" | "connecting" | "connected" | "error", error?: string | null) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.update(userWhatsappNumbers).set({ connectionStatus: status, lastHeartbeatAt: new Date(), lastError: error ?? null }).where(and(eq(userWhatsappNumbers.id, id), eq(userWhatsappNumbers.userId, userId)));
  return { success: true };
}

export async function setWhatsappScheduleTaskUid(userId: number, id: number, taskUid: string | null) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.update(userWhatsappNumbers).set({ scheduleCronTaskUid: taskUid }).where(and(eq(userWhatsappNumbers.id, id), eq(userWhatsappNumbers.userId, userId)));
  return { success: true };
}

export async function getWhatsappNumberByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(userWhatsappNumbers).where(eq(userWhatsappNumbers.scheduleCronTaskUid, taskUid)).limit(1);
  return row;
}

export async function listLeads(filters: { search?: string; city?: string; state?: string; region?: string; niche?: string; whatsapp?: "valid" | "invalid" | "pending"; minScore?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.search) conditions.push(or(like(leads.name, `%${filters.search}%`), like(leads.phone, `%${filters.search}%`), like(leads.category, `%${filters.search}%`)));
  if (filters.city) conditions.push(eq(leads.city, filters.city));
  if (filters.state) conditions.push(eq(leads.state, filters.state));
  if (filters.region) conditions.push(like(leads.region, `%${filters.region}%`));
  if (filters.niche) conditions.push(like(leads.category, `%${filters.niche}%`));
  if (filters.whatsapp === "valid") conditions.push(eq(leads.whatsappValid, true));
  if (filters.whatsapp === "invalid") conditions.push(eq(leads.whatsappValid, false));
  if (filters.whatsapp === "pending") conditions.push(sql`${leads.whatsappValid} IS NULL`);
  if (filters.minScore !== undefined) conditions.push(sql`COALESCE(${leads.qualificationScore}, 0) >= ${filters.minScore}`);
  return db.select().from(leads).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(leads.qualificationScore), desc(leads.createdAt)).limit(200);
}

export async function getLeadQualityMetrics() {
  const db = await getDb();
  if (!db) return { total: 0, averageScore: 0, bands: { excellent: 0, good: 0, attention: 0, unscored: 0 }, qualification: { qualified: 0, discarded: 0, pending: 0 }, whatsapp: { valid: 0, invalid: 0, pending: 0 }, ready: 0 };
  const rows = await db.select({ score: leads.qualificationScore, qualificationStatus: leads.qualificationStatus, whatsappValid: leads.whatsappValid, readyToSend: leads.readyToSend }).from(leads);
  const total = rows.length;
  const scored = rows.filter(row => row.score !== null && row.score !== undefined);
  const averageScore = scored.length ? Math.round(scored.reduce((sum, row) => sum + Number(row.score), 0) / scored.length) : 0;
  return {
    total,
    averageScore,
    bands: {
      excellent: rows.filter(row => Number(row.score ?? -1) >= 80).length,
      good: rows.filter(row => Number(row.score ?? -1) >= 60 && Number(row.score ?? -1) < 80).length,
      attention: rows.filter(row => Number(row.score ?? -1) >= 1 && Number(row.score ?? -1) < 60).length,
      unscored: rows.filter(row => row.score === null || row.score === undefined).length,
    },
    qualification: {
      qualified: rows.filter(row => row.qualificationStatus === "qualified").length,
      discarded: rows.filter(row => row.qualificationStatus === "discarded").length,
      pending: rows.filter(row => !row.qualificationStatus).length,
    },
    whatsapp: {
      valid: rows.filter(row => row.whatsappValid === true).length,
      invalid: rows.filter(row => row.whatsappValid === false).length,
      pending: rows.filter(row => row.whatsappValid === null || row.whatsappValid === undefined).length,
    },
    ready: rows.filter(row => row.readyToSend === true).length,
  };
}

export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) return { total: 0, whatsappValid: 0, qualified: 0, ready: 0, validRate: 0 };
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const [valid] = await db.select({ count: sql<number>`sum(case when ${leads.whatsappValid} = true then 1 else 0 end)` }).from(leads);
  const [qualified] = await db.select({ count: sql<number>`sum(case when ${leads.qualificationStatus} = 'qualified' then 1 else 0 end)` }).from(leads);
  const [ready] = await db.select({ count: sql<number>`sum(case when ${leads.readyToSend} = true then 1 else 0 end)` }).from(leads);
  const totalCount = Number(total?.count ?? 0);
  const validCount = Number(valid?.count ?? 0);
  return { total: totalCount, whatsappValid: validCount, qualified: Number(qualified?.count ?? 0), ready: Number(ready?.count ?? 0), validRate: totalCount ? Math.round((validCount / totalCount) * 100) : 0 };
}

export async function createSearchRun(input: { niche: string; city?: string; state?: string; region?: string }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(searchRuns).values(input).$returningId();
  return result[0]?.id;
}

export async function upsertLead(input: Record<string, unknown>) {
  const db = await getDb();
  const rawPhone = input.phone ?? input.telefone;
  if (!db || !rawPhone) return undefined;
  const normalized = {
    externalId: String(input.externalId ?? input.placeId ?? ""),
    name: String(input.name ?? input.nome ?? "Sem nome"),
    phone: normalizePhone(rawPhone),
    category: String(input.category ?? input.categoria ?? ""),
    address: String(input.address ?? input.endereco ?? ""),
    city: input.city ? String(input.city) : undefined,
    state: input.state ? String(input.state) : undefined,
    region: input.region ? String(input.region) : undefined,
    website: input.website ? String(input.website) : undefined,
    instagram: input.instagram ? String(input.instagram) : undefined,
    facebook: input.facebook ? String(input.facebook) : undefined,
    stars: input.stars ? String(input.stars) : undefined,
    reviews: input.reviews ? Number(input.reviews) : undefined,
    whatsappValid: typeof input.whatsappValid === "boolean" ? input.whatsappValid : undefined,
    rawData: JSON.stringify(input),
  };
  await db.insert(leads).values(normalized).onDuplicateKeyUpdate({ set: normalized });
  const [row] = await db.select().from(leads).where(eq(leads.phone, normalized.phone)).limit(1);
  return row;
}

export async function updateLeadQualification(id: number, score: number, status: "qualified" | "discarded", reason: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [current] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  await db.update(leads).set({ qualificationScore: score, qualificationStatus: status, qualificationReason: reason, readyToSend: isReadyToSend({ status, score, whatsappValid: current?.whatsappValid }) }).where(eq(leads.id, id));
  const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return row;
}

export type ConversationStage = "new" | "contacted" | "waiting" | "interested" | "in_progress" | "not_interested" | "rescue" | "closed";

export async function listConversations(stage?: ConversationStage) {
  const db = await getDb();
  if (!db) return [];
  const missing = await db.select({ id: leads.id }).from(leads).leftJoin(conversations, eq(conversations.leadId, leads.id)).where(sql`${conversations.id} IS NULL`).limit(300);
  if (missing.length) {
    try { await db.insert(conversations).values(missing.map(row => ({ leadId: row.id }))); } catch { /* another request may have created the same cards */ }
  }
  const condition = stage ? eq(conversations.stage, stage) : undefined;
  return db.select({ conversation: conversations, lead: leads }).from(conversations).leftJoin(leads, eq(conversations.leadId, leads.id)).where(condition).orderBy(desc(conversations.serviceOrder), desc(conversations.lastMessageAt), desc(conversations.updatedAt)).limit(300);
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversationMessages).where(eq(conversationMessages.conversationId, conversationId)).orderBy(conversationMessages.createdAt);
}

export async function getOrCreateConversation(leadId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [existing] = await db.select().from(conversations).where(eq(conversations.leadId, leadId)).limit(1);
  if (existing) return existing;
  const created = await db.insert(conversations).values({ leadId }).$returningId();
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, created[0]?.id ?? 0)).limit(1);
  return conversation;
}

export async function moveConversation(conversationId: number, stage: ConversationStage, serviceOrder?: number) {
  const db = await getDb();
  if (!db) return undefined;
  let nextOrder = serviceOrder;
  if (stage === "in_progress" && nextOrder === undefined) {
    const activeRows = await db.select({ serviceOrder: conversations.serviceOrder }).from(conversations).where(eq(conversations.stage, "in_progress"));
    nextOrder = nextQueueOrder(activeRows.map(row => Number(row.serviceOrder)));
  }
  const values: { stage: ConversationStage; serviceOrder?: number; rescueAvailableAt?: Date | null } = { stage };
  if (nextOrder !== undefined) values.serviceOrder = nextOrder;
  if (stage === "rescue" || stage === "not_interested") values.rescueAvailableAt = new Date();
  if (stage !== "rescue" && stage !== "not_interested") values.rescueAvailableAt = null;
  await db.update(conversations).set(values).where(eq(conversations.id, conversationId));
  const [row] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  return row;
}

export async function reorderConversation(conversationId: number, direction: "up" | "down") {
  const db = await getDb();
  if (!db) return undefined;
  const [current] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  if (!current || current.stage !== "in_progress") return current;
  const queue = await db.select().from(conversations).where(eq(conversations.stage, "in_progress")).orderBy(desc(conversations.serviceOrder), desc(conversations.updatedAt));
  const index = queue.findIndex(item => item.id === conversationId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= queue.length) return current;
  const target = queue[targetIndex];
  await db.update(conversations).set({ serviceOrder: target.serviceOrder }).where(eq(conversations.id, current.id));
  await db.update(conversations).set({ serviceOrder: current.serviceOrder }).where(eq(conversations.id, target.id));
  const [updated] = await db.select().from(conversations).where(eq(conversations.id, current.id)).limit(1);
  return updated;
}

export async function saveConversationMessage(input: { conversationId: number; externalId?: string; direction: "inbound" | "outbound"; author: "lead" | "ai" | "manual" | "system"; body: string; deliveryStatus?: "pending" | "sent" | "delivered" | "read" | "failed" }) {
  const db = await getDb();
  if (!db) return undefined;
  if (input.externalId) {
    const [existing] = await db.select().from(conversationMessages).where(eq(conversationMessages.externalId, input.externalId)).limit(1);
    if (existing) return existing;
  }
  const created = await db.insert(conversationMessages).values(input).$returningId();
  await db.update(conversations).set({ lastMessagePreview: input.body.slice(0, 240), lastMessageAt: new Date(), unreadCount: input.direction === "inbound" ? sql`${conversations.unreadCount} + 1` : 0 }).where(eq(conversations.id, input.conversationId));
  const [message] = await db.select().from(conversationMessages).where(eq(conversationMessages.id, created[0]?.id ?? 0)).limit(1);
  return message;
}

export async function markConversationMessage(messageId: number, deliveryStatus: "pending" | "sent" | "delivered" | "read" | "failed") {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(conversationMessages).set({ deliveryStatus }).where(eq(conversationMessages.id, messageId));
  const [message] = await db.select().from(conversationMessages).where(eq(conversationMessages.id, messageId)).limit(1);
  return message;
}

export async function updateConversationMessageByExternalId(externalId: string, deliveryStatus: "pending" | "sent" | "delivered" | "read" | "failed") {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(conversationMessages).set({ deliveryStatus }).where(eq(conversationMessages.externalId, externalId));
  const [message] = await db.select().from(conversationMessages).where(eq(conversationMessages.externalId, externalId)).limit(1);
  return message;
}

function phoneFromJid(value: unknown) {
  return String(value ?? "").split("@")[0].replace(/\D/g, "");
}

export async function applyEvolutionStatusUpdate(payload: Record<string, any>, updater: (externalId: string, deliveryStatus: "pending" | "sent" | "delivered" | "read" | "failed") => Promise<unknown> = updateConversationMessageByExternalId) {
  const update = evolutionStatusUpdate(payload);
  if (!update) return { success: true, ignored: true };
  if (update.externalId) await updater(update.externalId, update.deliveryStatus);
  return { success: true, updated: Boolean(update.externalId), externalId: update.externalId, deliveryStatus: update.deliveryStatus };
}

export async function ingestEvolutionMessage(payload: Record<string, any>, statusUpdater: (externalId: string, deliveryStatus: "pending" | "sent" | "delivered" | "read" | "failed") => Promise<unknown> = updateConversationMessageByExternalId) {
  const event = String(payload.event ?? "");
  if (event === "MESSAGES_UPDATE" || event === "SEND_MESSAGE_UPDATE") {
    return applyEvolutionStatusUpdate(payload, statusUpdater);
  }
  if (event !== "MESSAGES_UPSERT") return { success: true, ignored: true };
  const data = payload.data ?? {};
  const phone = phoneFromJid(data.key?.remoteJid ?? payload.sender);
  if (!phone) return { success: false, ignored: true, reason: "Telefone ausente" };
  const db = await getDb();
  if (!db) return { success: false, ignored: true, reason: "Banco indisponível" };
  const [lead] = await db.select().from(leads).where(eq(leads.phone, phone)).limit(1);
  if (!lead) return { success: false, ignored: true, reason: "Lead não encontrado", phone };
  const conversation = await getOrCreateConversation(lead.id);
  if (!conversation) return { success: false, ignored: true, reason: "Conversa indisponível" };
  const body = String(data.message?.conversation ?? data.message?.extendedTextMessage?.text ?? data.message?.imageMessage?.caption ?? "").trim();
  if (!body) return { success: true, ignored: true, conversationId: conversation.id };
  const inbound = !Boolean(data.key?.fromMe);
  const message = await saveConversationMessage({ conversationId: conversation.id, externalId: data.key?.id ? String(data.key.id) : undefined, direction: inbound ? "inbound" : "outbound", author: inbound ? "lead" : "ai", body, deliveryStatus: "sent" });
  if (inbound && conversation.stage === "new") await moveConversation(conversation.id, "contacted", conversation.serviceOrder);
  return { success: true, conversationId: conversation.id, messageId: message?.id };
}
