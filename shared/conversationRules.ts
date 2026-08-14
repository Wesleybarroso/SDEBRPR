export type ConversationStage = "new" | "contacted" | "waiting" | "interested" | "in_progress" | "not_interested" | "rescue" | "closed";

export const conversationStageLabels: Record<ConversationStage, string> = {
  new: "Novos",
  contacted: "Contato iniciado",
  waiting: "Aguardando resposta",
  interested: "Interessados",
  in_progress: "Em atendimento",
  not_interested: "Não interessados",
  rescue: "Resgate",
  closed: "Encerrados",
};

export function orderForStage(stage: ConversationStage) {
  return stage === "in_progress" ? 1 : 0;
}

export function nextQueueOrder(existingOrders: number[]) {
  return Math.max(0, ...existingOrders) + 1;
}

export function evolutionStatusUpdate(payload: Record<string, any>) {
  const data = payload.data ?? {};
  const event = String(payload.event ?? "");
  if (event !== "MESSAGES_UPDATE" && event !== "SEND_MESSAGE_UPDATE") return null;
  const externalId = String(data.key?.id ?? data.id ?? data.messageId ?? "");
  return { externalId, deliveryStatus: deliveryStatusFromEvolution(data.status ?? data.update?.status) };
}

export function deliveryStatusFromEvolution(value: unknown): "pending" | "sent" | "delivered" | "read" | "failed" {
  const status = String(value ?? "").toUpperCase();
  if (status.includes("READ")) return "read";
  if (status.includes("DELIVER") || status.includes("ACK")) return "delivered";
  if (status.includes("ERROR") || status.includes("FAIL")) return "failed";
  if (status.includes("SENT")) return "sent";
  return "pending";
}

export function reactivationStage() {
  return "contacted" as const;
}

export function isRescueCandidate(stage: ConversationStage) {
  return stage === "not_interested" || stage === "rescue";
}

export function extractEvolutionMessage(payload: Record<string, any>) {
  const data = payload.data ?? {};
  const phone = String(data.key?.remoteJid ?? payload.sender ?? "").split("@")[0].replace(/\D/g, "");
  const body = String(data.message?.conversation ?? data.message?.extendedTextMessage?.text ?? data.message?.imageMessage?.caption ?? "").trim();
  return { event: String(payload.event ?? ""), externalId: data.key?.id ? String(data.key.id) : undefined, phone, body, inbound: !Boolean(data.key?.fromMe) };
}
