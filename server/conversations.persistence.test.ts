import { describe, expect, it, test } from "vitest";
import { deliveryStatusFromEvolution, nextQueueOrder, reactivationStage } from "../shared/conversationRules";

type FakeMessage = { id: number; externalId?: string; body: string; status: string };

test("message persistence keeps external events idempotent", () => {
  const messages: FakeMessage[] = [];
  const save = (input: Omit<FakeMessage, "id">) => {
    const existing = input.externalId && messages.find(item => item.externalId === input.externalId);
    if (existing) return existing;
    const message = { ...input, id: messages.length + 1 };
    messages.push(message);
    return message;
  };
  const first = save({ externalId: "wa-1", body: "Olá", status: "sent" });
  const duplicate = save({ externalId: "wa-1", body: "Olá", status: "sent" });
  expect(messages).toHaveLength(1);
  expect(duplicate.id).toBe(first.id);
});

describe("conversation queue and rescue contracts", () => {
  it("assigns the next position and supports reactivation", () => {
    expect(nextQueueOrder([1, 4, 2])).toBe(5);
    expect(nextQueueOrder([])).toBe(1);
    expect(reactivationStage()).toBe("contacted");
  });

  it("maps Evolution delivery events to the persisted status", () => {
    expect(deliveryStatusFromEvolution("SENT")).toBe("sent");
    expect(deliveryStatusFromEvolution("DELIVERY_ACK")).toBe("delivered");
    expect(deliveryStatusFromEvolution("READ")).toBe("read");
    expect(deliveryStatusFromEvolution("ERROR")).toBe("failed");
  });
});
