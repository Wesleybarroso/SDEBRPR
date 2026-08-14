import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  listMessageTemplates: vi.fn(),
  saveMessageTemplate: vi.fn(),
  removeMessageTemplate: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...dbMocks };
});

const { appRouter } = await import("./routers");

describe("message templates router", () => {
  const caller = () => appRouter.createCaller({ user: { id: 42, openId: "templates-test", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as any, res: {} as any });

  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.listMessageTemplates.mockResolvedValue([{ id: 3, userId: 42, name: "Primeiro contato", category: "prospeccao", body: "Olá, {nome}!", variables: "nome", isActive: true }]);
    dbMocks.saveMessageTemplate.mockResolvedValue({ success: true, id: 3 });
    dbMocks.removeMessageTemplate.mockResolvedValue({ success: true });
  });

  it("lists templates scoped to the authenticated user", async () => {
    await expect(caller().messageTemplates.list()).resolves.toHaveLength(1);
    expect(dbMocks.listMessageTemplates).toHaveBeenCalledWith(42);
  });

  it("saves and edits a template with variables", async () => {
    await caller().messageTemplates.save({ name: "Primeiro contato", category: "prospeccao", body: "Olá, {nome}!", variables: "nome", isActive: true });
    await caller().messageTemplates.save({ id: 3, name: "Contato atualizado", category: "follow-up", body: "Podemos conversar?", variables: "nome, cidade", isActive: true });
    expect(dbMocks.saveMessageTemplate).toHaveBeenNthCalledWith(1, 42, expect.objectContaining({ name: "Primeiro contato", variables: "nome" }));
    expect(dbMocks.saveMessageTemplate).toHaveBeenNthCalledWith(2, 42, expect.objectContaining({ id: 3, name: "Contato atualizado" }));
  });

  it("removes a template by id for the authenticated user", async () => {
    await expect(caller().messageTemplates.remove({ id: 3 })).resolves.toEqual({ success: true });
    expect(dbMocks.removeMessageTemplate).toHaveBeenCalledWith(42, 3);
  });
});
