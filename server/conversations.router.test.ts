import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  moveConversation: vi.fn(),
  reorderConversation: vi.fn(),
  getIntegrationSecrets: vi.fn(),
  getWhatsappNumberSecret: vi.fn(),
  getMessageTemplate: vi.fn(),
  saveConversationMessage: vi.fn(),
  markConversationMessage: vi.fn(),
}));

vi.mock("./db", () => ({
  createSearchRun: vi.fn(),
  getConversationMessages: vi.fn(),
  getDashboardMetrics: vi.fn(),
  getIntegrationSecrets: dbMocks.getIntegrationSecrets,
  getWhatsappNumberSecret: dbMocks.getWhatsappNumberSecret,
  getMessageTemplate: dbMocks.getMessageTemplate,
  getIntegrationSettings: vi.fn(),
  getLeadQualityMetrics: vi.fn(),
  listConversations: vi.fn(),
  listLeads: vi.fn(),
  markConversationMessage: dbMocks.markConversationMessage,
  moveConversation: dbMocks.moveConversation,
  reorderConversation: dbMocks.reorderConversation,
  removeIntegrationSetting: vi.fn(),
  saveConversationMessage: dbMocks.saveConversationMessage,
  saveIntegrationSettings: vi.fn(),
  saveUserAvatar: vi.fn(),
  upsertLead: vi.fn(),
  updateLeadQualification: vi.fn(),
  getDb: vi.fn(),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return { user: { id: 1, openId: "test", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("conversations router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getIntegrationSecrets.mockResolvedValue({ n8nWebhookUrl: "https://n8n.test/conversation", n8nWebhookToken: "n8n-token", evolutionApiUrl: "https://evolution.test", evolutionApiKey: "evo-token" });
    dbMocks.getWhatsappNumberSecret.mockResolvedValue(undefined);
    dbMocks.getMessageTemplate.mockResolvedValue(undefined);
    dbMocks.saveConversationMessage.mockResolvedValue({ id: 12 });
    dbMocks.markConversationMessage.mockResolvedValue({ id: 12, deliveryStatus: "sent" });
  });

  it("delegates stage changes and queue reordering to persistence", async () => {
    dbMocks.moveConversation.mockResolvedValue({ id: 7, stage: "interested" });
    dbMocks.reorderConversation.mockResolvedValue({ id: 7, serviceOrder: 2 });
    const caller = appRouter.createCaller(context());
    await caller.conversations.move({ conversationId: 7, stage: "interested" });
    await caller.conversations.reorder({ conversationId: 7, direction: "up" });
    expect(dbMocks.moveConversation).toHaveBeenCalledWith(7, "interested", undefined);
    expect(dbMocks.reorderConversation).toHaveBeenCalledWith(7, "up");
  });

  it("dispatches a manual message using the selected WhatsApp instance", async () => {
    const fakeDb = { select: () => ({ from: () => ({ leftJoin: () => ({ where: () => ({ limit: async () => [{ conversation: { id: 7 }, lead: { id: 11, phone: "5511999999999" } }] }) }) }) }) };
    const dbModule = await import("./db");
    vi.mocked(dbModule.getDb).mockResolvedValue(fakeDb as never);
    dbMocks.getWhatsappNumberSecret.mockResolvedValue({ id: 3, phone: "5511888888888", instanceName: "comercial-03", apiUrl: "https://evolution-03.test", apiKey: "instance-token", keepAlive: true });
    dbMocks.getMessageTemplate.mockResolvedValue({ id: 9, name: "Primeiro contato" });
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await appRouter.createCaller(context()).conversations.send({ conversationId: 7, body: "Mensagem pela instância 3", whatsappNumberId: 3, templateId: 9 });
    const payload = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(payload).toMatchObject({ templateId: 9, templateName: "Primeiro contato" });
    expect(payload.evolution).toMatchObject({ numberId: 3, instanceName: "comercial-03", apiKey: "instance-token", keepAlive: true });
    vi.unstubAllGlobals();
  });

  it("reactivates a rescue lead, persists the outbound message and returns it to contacted", async () => {
    const fakeDb = { select: () => ({ from: () => ({ leftJoin: () => ({ where: () => ({ limit: async () => [{ conversation: { id: 7 }, lead: { id: 11, phone: "5511999999999" } }] }) }) }) }) };
    const dbModule = await import("./db");
    vi.mocked(dbModule.getDb).mockResolvedValue(fakeDb as never);
    dbMocks.moveConversation.mockResolvedValue({ id: 7, stage: "contacted" });
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await appRouter.createCaller(context()).conversations.reactivate({ conversationId: 7, body: "Podemos retomar?" });
    expect(result).toEqual({ id: 12, deliveryStatus: "sent" });
    expect(dbMocks.saveConversationMessage).toHaveBeenCalledWith(expect.objectContaining({ conversationId: 7, direction: "outbound", body: "Podemos retomar?" }));
    expect(dbMocks.moveConversation).toHaveBeenCalledWith(7, "contacted");
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string).evolution.apiKey).toBe("evo-token");
    vi.unstubAllGlobals();
  });
});
