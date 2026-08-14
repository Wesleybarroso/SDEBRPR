import { beforeEach, describe, expect, it, vi } from "vitest";

const state = new Map<number, string>();
const getIntegrationSettings = vi.fn(async (userId: number) => ({ configured: state.has(userId), values: state.has(userId) ? { openrouterApiKey: state.get(userId) } : {} }));
const saveIntegrationSettings = vi.fn(async (userId: number, input: { openrouterApiKey?: string }) => { if (input.openrouterApiKey) state.set(userId, input.openrouterApiKey === "sk-live-updated" ? "sk-u••••••••ated" : "sk-l••••••••6789"); return { success: true }; });

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getIntegrationSettings, saveIntegrationSettings };
});

const { appRouter } = await import("./routers");

describe("settings router contract", () => {
  beforeEach(() => { state.clear(); getIntegrationSettings.mockClear(); saveIntegrationSettings.mockClear(); });

  it("persists an update and returns the latest value masked", async () => {
    const user = { id: 42, openId: "settings-test", role: "admin", name: "Admin", email: "admin@example.com", loginMethod: "test", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), preferences: null } as const;
    const caller = appRouter.createCaller({ user, req: {} as any, res: {} as any });
    await expect(caller.settings.saveIntegrations({ openrouterApiKey: "sk-live-123456789" })).resolves.toEqual({ success: true });
    await expect(caller.settings.integrations()).resolves.toEqual({ configured: true, values: { openrouterApiKey: "sk-l••••••••6789" } });
    await expect(caller.settings.saveIntegrations({ openrouterApiKey: "sk-live-updated" })).resolves.toEqual({ success: true });
    await expect(caller.settings.integrations()).resolves.toEqual({ configured: true, values: { openrouterApiKey: "sk-u••••••••ated" } });
    expect(saveIntegrationSettings).toHaveBeenCalledTimes(2);
  });
});
