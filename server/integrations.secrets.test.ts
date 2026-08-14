import { describe, expect, it } from "vitest";

describe("integration secrets", () => {
  it("accepts the configured OpenRouter credential", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    expect(apiKey, "OPENROUTER_API_KEY must be configured").toBeTruthy();

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.ok, `OpenRouter returned ${response.status}`).toBe(true);
    const payload = (await response.json()) as { data?: unknown[] };
    expect(Array.isArray(payload.data)).toBe(true);
  }, 15000);
});
