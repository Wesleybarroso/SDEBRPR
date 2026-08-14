import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./integrationSecrets";

describe("internal integration settings", () => {
  it("encrypts values and masks them for the UI", () => {
    const encrypted = encryptSecret("sk-live-123456789");
    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain("sk-live");
    expect(decryptSecret(encrypted)).toBe("sk-live-123456789");
    expect(maskSecret(encrypted)).toBe("sk-l••••••••6789");
  });
});
