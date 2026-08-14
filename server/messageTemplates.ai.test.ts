import { beforeEach, describe, expect, it, vi } from "vitest";

const getIntegrationSecrets = vi.hoisted(() => vi.fn());

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getIntegrationSecrets };
});

const { appRouter } = await import("./routers");

function caller() {
  return appRouter.createCaller({ user: { id: 7, openId: "ai-test", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as any, res: {} as any });
}

describe("message template AI generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getIntegrationSecrets.mockResolvedValue({ openrouterApiKey: "openrouter-test", n8nWebhookUrl: "", n8nWebhookToken: "", evolutionApiUrl: "", evolutionApiKey: "" });
  });

  it("generates a reviewable template from product context", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ name: "Clínicas em crescimento", category: "prospeccao", body: "Olá, {nome}! Posso mostrar como ajudamos sua clínica?", variables: "nome, empresa, cidade" }) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await caller().messageTemplates.generate({ productDescription: "Criação de sites para clínicas", audience: "Donos de clínicas", offer: "Diagnóstico inicial", tone: "consultivo", channel: "whatsapp" });
    expect(result).toMatchObject({ name: "Clínicas em crescimento", body: expect.stringContaining("{nome}"), variables: "nome, empresa, cidade" });
    const payload = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(payload.model).toBe("openai/gpt-4o-mini");
    expect(payload.response_format).toEqual({ type: "json_object" });
    expect(payload.messages[1].content).toContain("Criação de sites para clínicas");
    vi.unstubAllGlobals();
  });

  it("requires the OpenRouter key before generating", async () => {
    getIntegrationSecrets.mockResolvedValue({ openrouterApiKey: "", n8nWebhookUrl: "", n8nWebhookToken: "", evolutionApiUrl: "", evolutionApiKey: "" });
    await expect(caller().messageTemplates.generate({ productDescription: "Serviço de automação comercial" })).rejects.toThrow("Configure a API key do OpenRouter");
  });
});
