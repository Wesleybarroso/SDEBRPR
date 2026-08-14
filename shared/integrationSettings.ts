import { maskSecret } from "../server/integrationSecrets";

const secretNames = new Set(["apifyApiKey", "n8nWebhookToken", "openrouterApiKey", "evolutionApiKey", "postgresUrl", "hasuraAdminSecret"]);

export function maskIntegrationRecord(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !["id", "userId", "createdAt", "updatedAt"].includes(key)).map(([key, value]) => [key, secretNames.has(key) ? maskSecret(value as string) : value || ""]));
}
