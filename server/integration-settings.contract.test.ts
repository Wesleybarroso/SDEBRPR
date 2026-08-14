import { describe, expect, it } from "vitest";
import { encryptSecret } from "./integrationSecrets";
import { maskIntegrationRecord } from "../shared/integrationSettings";

describe("integration settings response contract", () => {
  it("returns updated secret fields masked for the frontend", () => {
    const response = maskIntegrationRecord({ userId: 7, openrouterApiKey: encryptSecret("sk-live-123456789"), n8nWebhookUrl: "https://n8n.example/webhook" });
    expect(response.openrouterApiKey).toBe("sk-l••••••••6789");
    expect(response.openrouterApiKey).not.toContain("123456789");
    expect(response.n8nWebhookUrl).toBe("https://n8n.example/webhook");
    expect(response.userId).toBeUndefined();
  });
});
