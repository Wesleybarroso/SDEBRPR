import { describe, expect, it, vi } from "vitest";
import { ingestEvolutionMessage } from "./db";

describe("Evolution message status webhook", () => {
  it.each([
    ["MESSAGES_UPDATE", { key: { id: "msg-1" }, status: "READ" }, "read"],
    ["SEND_MESSAGE_UPDATE", { id: "msg-2", update: { status: "DELIVERY_ACK" } }, "delivered"],
  ])("ingestEvolutionMessage updates %s by externalId", async (event, data, expectedStatus) => {
    const updater = vi.fn().mockResolvedValue({ id: 1, deliveryStatus: expectedStatus });
    const result = await ingestEvolutionMessage({ event, data }, updater);
    expect(updater).toHaveBeenCalledWith(data.key?.id ?? data.id, expectedStatus);
    expect(result).toMatchObject({ success: true, updated: true, deliveryStatus: expectedStatus });
  });
});
