import { describe, expect, it } from "vitest";
import { conversationStageLabels, extractEvolutionMessage, isRescueCandidate, orderForStage } from "../shared/conversationRules";

describe("conversation rules", () => {
  it("extracts inbound Evolution messages and normalizes the WhatsApp phone", () => {
    const result = extractEvolutionMessage({ event: "MESSAGES_UPSERT", sender: "5511999999999@s.whatsapp.net", data: { key: { id: "evt-1", remoteJid: "5511999999999@s.whatsapp.net", fromMe: false }, message: { conversation: "Olá, quero saber mais" } } });
    expect(result).toEqual({ event: "MESSAGES_UPSERT", externalId: "evt-1", phone: "5511999999999", body: "Olá, quero saber mais", inbound: true });
  });

  it("prioritizes active service and keeps rescue stages explicit", () => {
    expect(orderForStage("in_progress")).toBe(1);
    expect(orderForStage("waiting")).toBe(0);
    expect(isRescueCandidate("not_interested")).toBe(true);
    expect(isRescueCandidate("rescue")).toBe(true);
    expect(isRescueCandidate("interested")).toBe(false);
    expect(conversationStageLabels.rescue).toBe("Resgate");
  });
});
