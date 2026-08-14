import { describe, expect, it, vi } from "vitest";

const listLeads = vi.hoisted(() => vi.fn());

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, listLeads };
});

const { appRouter } = await import("./routers");

const caller = () => appRouter.createCaller({ user: { id: 1, openId: "export-test", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as any, res: {} as any });

describe("leads export router", () => {
  it("exports only valid WhatsApp leads above the selected score with spreadsheet-friendly CSV", async () => {
    listLeads.mockResolvedValue([{ name: "Clínica Alfa", phone: "5511999999999", category: "Saúde", city: "São Paulo", state: "SP", qualificationScore: 84, qualificationStatus: "qualified", website: "https://clinica.test", address: "Rua A; 10" }]);
    const result = await caller().leads.exportCsv({ minScore: 80 });
    expect(listLeads).toHaveBeenCalledWith({ minScore: 80, whatsapp: "valid" });
    expect(result.count).toBe(1);
    expect(result.filename).toContain("sdebr-melhores-leads-score-80");
    expect(result.csv.startsWith("\ufeffnome;telefone")).toBe(true);
    expect(result.csv).toContain('"Rua A; 10"');
  });

  it("forwards a configurable WhatsApp status filter", async () => {
    listLeads.mockResolvedValue([]);
    await caller().leads.exportCsv({ minScore: 90, whatsapp: "pending" });
    expect(listLeads).toHaveBeenCalledWith({ minScore: 90, whatsapp: "pending" });
  });
});
