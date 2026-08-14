export function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isReadyToSend(input: { status: "qualified" | "discarded"; score: number; whatsappValid: boolean | null | undefined }) {
  return input.status === "qualified" && input.score >= 70 && input.whatsappValid === true;
}

export function matchesLeadFilters(input: { region?: string | null; score?: number | null }, filters: { region?: string; minScore?: number }) {
  const regionMatches = !filters.region || (input.region ?? "").toLowerCase().includes(filters.region.toLowerCase());
  const scoreMatches = filters.minScore === undefined || (input.score ?? 0) >= filters.minScore;
  return regionMatches && scoreMatches;
}
