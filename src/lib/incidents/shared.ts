export const incidentStatuses = ["investigating", "identified", "monitoring", "resolved"] as const;
export const incidentSeverities = ["degraded", "partial_outage", "major_outage"] as const;
export const statusLabels: Record<string, string> = { investigating: "Investigating", identified: "Identified", monitoring: "Monitoring", resolved: "Resolved" };
export const severityLabels: Record<string, string> = { degraded: "Degraded performance", partial_outage: "Partial outage", major_outage: "Major outage" };
export type IncidentInput = { title: string; severity: string; status: string; affectedServices: string[]; published: boolean; message: string };
export function parseIncident(value: unknown): IncidentInput {
  if (!value || typeof value !== "object") throw new Error("Invalid incident details.");
  const data = value as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  if (!title || title.length > 160) throw new Error("Use an incident title between 1 and 160 characters.");
  if (message.length > 5000) throw new Error("Keep the update under 5,000 characters.");
  if (!incidentStatuses.includes(data.status as typeof incidentStatuses[number])) throw new Error("Select a valid incident status.");
  if (!incidentSeverities.includes(data.severity as typeof incidentSeverities[number])) throw new Error("Select a valid severity.");
  if (typeof data.published !== "boolean") throw new Error("Select whether this incident is public.");
  if (!Array.isArray(data.affectedServices) || !data.affectedServices.length || data.affectedServices.some(name => typeof name !== "string" || !name.trim() || name.length > 120)) throw new Error("Select at least one valid affected service group.");
  return { title, message, severity: String(data.severity), status: String(data.status), published: data.published, affectedServices: [...new Set(data.affectedServices as string[])] };
}
export type IncidentRecord = { id: string; title: string; severity: string; status: string; affectedServices: readonly string[]; published: boolean; createdAt: string; updatedAt: string };
export type IncidentUpdateRecord = { id: string; message: string; status: string; createdAt: string };
