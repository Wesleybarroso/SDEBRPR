import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, leads, searchRuns, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { isReadyToSend, normalizePhone } from "../shared/leadRules";

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

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
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
