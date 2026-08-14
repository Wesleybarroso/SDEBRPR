import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  preferences: text("preferences"),
  avatarUrl: text("avatarUrl"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const searchRuns = mysqlTable("search_runs", {
  id: int("id").autoincrement().primaryKey(),
  niche: varchar("niche", { length: 160 }).notNull(),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 80 }),
  region: varchar("region", { length: 120 }),
  status: mysqlEnum("status", ["draft", "queued", "running", "completed", "failed"]).default("queued").notNull(),
  source: varchar("source", { length: 40 }).default("apify"),
  n8nExecutionId: varchar("n8nExecutionId", { length: 120 }),
  leadsCount: int("leadsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 180 }),
  searchRunId: int("searchRunId"),
  category: varchar("categoria", { length: 160 }),
  name: varchar("nome", { length: 220 }).notNull(),
  phone: varchar("telefone", { length: 40 }).notNull().unique(),
  whatsappValid: boolean("whatsapp_valido"),
  whatsappJid: varchar("whatsapp_jid", { length: 100 }),
  stars: decimal("estrelas", { precision: 3, scale: 1 }).default("0"),
  reviews: int("avaliacoes").default(0),
  address: text("endereco"),
  city: varchar("cidade", { length: 120 }),
  state: varchar("estado", { length: 80 }),
  region: varchar("regiao", { length: 120 }),
  status: varchar("status", { length: 60 }).default("Novo").notNull(),
  campaign: varchar("campanhas", { length: 180 }),
  hasWebsite: varchar("tem_site", { length: 10 }),
  website: text("site"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  qualificationStatus: mysqlEnum("qualificationStatus", ["pending", "qualified", "discarded"]).default("pending").notNull(),
  qualificationScore: int("qualificationScore"),
  qualificationReason: text("qualificationReason"),
  readyToSend: boolean("readyToSend").default(false).notNull(),
  rawData: text("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const whatsappChecks = mysqlTable("whatsapp_checks", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  isValid: boolean("isValid"),
  jid: varchar("jid", { length: 100 }),
  source: varchar("source", { length: 40 }).default("evolution-go"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const leadQualifications = mysqlTable("lead_qualifications", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  score: int("score").notNull(),
  status: mysqlEnum("status", ["qualified", "discarded"]).notNull(),
  reason: text("reason"),
  model: varchar("model", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const integrationEvents = mysqlTable("integration_events", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 40 }).notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  externalId: varchar("externalId", { length: 180 }),
  payload: text("payload").notNull(),
  status: varchar("status", { length: 30 }).default("received").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userIntegrations = mysqlTable("user_integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  apifyApiKey: text("apifyApiKey"),
  n8nWebhookUrl: text("n8nWebhookUrl"),
  n8nWebhookToken: text("n8nWebhookToken"),
  openrouterApiKey: text("openrouterApiKey"),
  evolutionApiUrl: text("evolutionApiUrl"),
  evolutionApiKey: text("evolutionApiKey"),
  postgresUrl: text("postgresUrl"),
  hasuraEndpoint: text("hasuraEndpoint"),
  hasuraAdminSecret: text("hasuraAdminSecret"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SearchRun = typeof searchRuns.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().unique(),
  stage: mysqlEnum("stage", ["new", "contacted", "waiting", "interested", "in_progress", "not_interested", "rescue", "closed"]).default("new").notNull(),
  serviceOrder: int("serviceOrder").default(0).notNull(),
  unreadCount: int("unreadCount").default(0).notNull(),
  lastMessagePreview: text("lastMessagePreview"),
  lastMessageAt: timestamp("lastMessageAt"),
  rescueAvailableAt: timestamp("rescueAvailableAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversationMessages = mysqlTable("conversation_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  externalId: varchar("externalId", { length: 180 }).unique(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  author: mysqlEnum("author", ["lead", "ai", "manual", "system"]).notNull(),
  body: text("body").notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "delivered", "read", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserIntegration = typeof userIntegrations.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
