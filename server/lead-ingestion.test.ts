import { describe, expect, it } from "vitest";
import { normalizePhone } from "../shared/leadRules";

function leadUpsertKey(payload: { phone?: string; telefone?: string }) {
  return normalizePhone(payload.phone ?? payload.telefone);
}

describe("n8n lead ingestion contract", () => {
  it("maps the legacy telefone payload to the same idempotent key as phone", () => {
    const legacy = { nome: "Clínica Horizonte", telefone: "+55 (11) 99876-5432" };
    const canonical = { name: "Clínica Horizonte", phone: "5511998765432" };
    expect(leadUpsertKey(legacy)).toBe(leadUpsertKey(canonical));
    expect(leadUpsertKey(legacy)).toBe("5511998765432");
  });
});
