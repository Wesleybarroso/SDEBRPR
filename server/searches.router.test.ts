import { beforeEach, describe, expect, it, vi } from "vitest";

const createSearchRun = vi.fn(async () => 17);
const getIntegrationSecrets = vi.fn(async () => ({ n8nWebhookUrl: "https://n8n.test/search", n8nWebhookToken: "token", openrouterApiKey: "", evolutionApiUrl: "", evolutionApiKey: "" }));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, createSearchRun, getIntegrationSecrets };
});

const { appRouter } = await import("./routers");

describe("searches router contract", () => {
  const user = { id: 42, openId: "search-test", role: "user", name: "Test", email: "test@example.com", loginMethod: "test", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), preferences: null } as const;
  const caller = () => appRouter.createCaller({ user, req: { headers: {} } as any, res: {} as any });

  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))); });

  it("persists and dispatches CEP and lead limit", async () => {
    const result = await caller().searches.create({ niche: "dentista", city: "São Paulo", state: "SP", cep: "01311-000", leadLimit: 120 });
    expect(result).toMatchObject({ runId: 17, dispatched: true });
    expect(createSearchRun).toHaveBeenCalledWith(expect.objectContaining({ cep: "01311-000", leadLimit: 120 }));
    const payload = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.body as string);
    expect(payload).toMatchObject({ cep: "01311-000", leadLimit: 120, maxResults: 120, locationQuery: "CEP 01311-000, São Paulo, SP" });
  });

  it("rejects invalid CEP and limits above 500", async () => {
    await expect(caller().searches.create({ niche: "dentista", cep: "123", leadLimit: 50 })).rejects.toThrow();
    await expect(caller().searches.create({ niche: "dentista", leadLimit: 501 })).rejects.toThrow();
  });
});
