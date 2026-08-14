import { describe, expect, it, vi } from "vitest";

const getLeadQualityMetrics = vi.fn().mockResolvedValue({ total: 10, averageScore: 72, bands: { excellent: 3, good: 4, attention: 2, unscored: 1 }, qualification: { qualified: 4, discarded: 2, pending: 4 }, whatsapp: { valid: 6, invalid: 2, pending: 2 }, ready: 4 });
const removeIntegrationSetting = vi.fn().mockResolvedValue({ success: true });

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getLeadQualityMetrics, removeIntegrationSetting };
});

const { appRouter } = await import("./routers");

describe("quality dashboard and integration removal", () => {
  const user = { id: 8, openId: "quality-test", role: "admin", name: "Admin", email: "admin@example.com", loginMethod: "test", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), preferences: null } as const;
  const caller = () => appRouter.createCaller({ user, req: {} as any, res: {} as any });

  it("returns quality metrics for the authenticated operator", async () => {
    await expect(caller().dashboard.quality()).resolves.toMatchObject({ total: 10, averageScore: 72, ready: 4 });
  });

  it("removes only the selected integration field", async () => {
    await expect(caller().settings.removeIntegration({ field: "openrouterApiKey" })).resolves.toEqual({ success: true });
    expect(removeIntegrationSetting).toHaveBeenCalledWith(8, "openrouterApiKey");
  });
});
