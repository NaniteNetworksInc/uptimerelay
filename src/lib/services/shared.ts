export const componentStatuses = ["operational", "degraded", "partial_outage", "major_outage", "maintenance", "unknown"] as const;
export const componentStatusLabels: Record<string, string> = { operational: "Operational", degraded: "Degraded performance", partial_outage: "Partial outage", major_outage: "Major outage", maintenance: "Maintenance", unknown: "No data" };
import type { MonitorConfig } from "@/lib/monitoring/config";
export type ManagedMonitor = MonitorConfig & { status: string; checkedAt: string | null; latencyMs: number | null; error: string | null };
export type HistoryDay = { date: string; status: string; checks: number; successful: number };
export type ManagedGroup = { id: string; name: string; description: string; components: { id: string; groupId: string; name: string; status: string; manualStatus: string; statusUrl: string | null; enabled: boolean; showUptime: boolean; history: HistoryDay[]; monitor: ManagedMonitor | null }[] };
export function statusLink(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) throw new Error("Invalid external status URL.");
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Use an HTTP or HTTPS status-page link without credentials.");
  return url.href;
}
export function requiredName(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 120) throw new Error("Use a name between 1 and 120 characters.");
  return value.trim();
}
