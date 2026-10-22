import type { HistoryDay } from "./shared";
export type DailyCount = { componentId: string; day: string; status: string; checks: number };
export function buildHistory(rows: DailyCount[], now = Date.now()): HistoryDay[] {
  const ranks: Record<string, number> = { operational: 0, degraded: 1, maintenance: 2, partial_outage: 3, major_outage: 4 };
  const today = new Date(now); today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(today.getTime() - (89 - index) * 86_400_000).toISOString().slice(0, 10);
    const measured = rows.filter(row => row.day === date && row.status in ranks);
    return { date, checks: measured.reduce((sum, row) => sum + row.checks, 0), successful: measured.filter(row => row.status === "operational").reduce((sum, row) => sum + row.checks, 0), status: measured.length ? measured.reduce((state, row) => ranks[row.status] > ranks[state] ? row.status : state, "operational") : "unknown" };
  });
}
