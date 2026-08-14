import { describe, expect, it } from "vitest";
import { isReadyToSend, matchesLeadFilters, normalizePhone } from "../shared/leadRules";

describe("lead rules", () => {
  it("normalizes legacy phone formats used by n8n", () => {
    expect(normalizePhone("+55 (11) 99876-5432")).toBe("5511998765432");
    expect(normalizePhone("telefone: 5511998765432")).toBe("5511998765432");
  });

  it("accepts legacy and canonical phone payloads as the same identity", () => {
    expect(normalizePhone({ telefone: "+55 (11) 99876-5432" }.telefone)).toBe(normalizePhone({ phone: "5511998765432" }.phone));
  });

  it("filters by region and minimum score", () => {
    expect(matchesLeadFilters({ region: "Vila Mariana", score: 82 }, { region: "vila", minScore: 80 })).toBe(true);
    expect(matchesLeadFilters({ region: "Centro", score: 82 }, { region: "vila", minScore: 80 })).toBe(false);
    expect(matchesLeadFilters({ region: "Vila Mariana", score: 72 }, { region: "vila", minScore: 80 })).toBe(false);
  });

  it("only releases qualified leads with validated WhatsApp", () => {
    expect(isReadyToSend({ status: "qualified", score: 70, whatsappValid: true })).toBe(true);
    expect(isReadyToSend({ status: "qualified", score: 69, whatsappValid: true })).toBe(false);
    expect(isReadyToSend({ status: "qualified", score: 90, whatsappValid: null })).toBe(false);
    expect(isReadyToSend({ status: "discarded", score: 90, whatsappValid: true })).toBe(false);
  });
});
