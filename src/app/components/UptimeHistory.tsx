import type { HistoryDay } from "@/lib/services/shared";
import { componentStatusLabels } from "@/lib/services/shared";
export default function UptimeHistory({ days }: { days: HistoryDay[] }) {
  const colors: Record<string, string> = { operational: "bg-(--healthy)", degraded: "bg-amber-400", maintenance: "bg-blue-400", partial_outage: "bg-orange-500", major_outage: "bg-red-500", unknown: "bg-(--line)" };
  const checks = days.reduce((sum, day) => sum + day.checks, 0);
  const successes = days.reduce((sum, day) => sum + day.successful, 0);
  return <div className="my-5 min-w-0"><div className="flex h-8 gap-0.5" role="img" aria-label={`90-day check history. ${checks ? `${(successes / checks * 100).toFixed(2)} percent of recorded checks successful.` : "No recorded checks."} Gray days have no data.`}>{days.map(day => <span key={day.date} title={`${day.date}: ${componentStatusLabels[day.status] ?? "No data"} · ${day.checks} recorded checks`} className={`min-w-0 flex-1 rounded-xs ${colors[day.status] ?? colors.unknown}`} />)}</div><div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-(--muted)"><span>90 days ago</span><span>{checks ? `${(successes / checks * 100).toFixed(2)}% recorded check success` : "No recorded data"}</span><span>Today</span></div><p className="mt-2 text-[11px] text-(--muted)">Gray days have no data. Check success reflects recorded samples, not guaranteed uptime.</p></div>;
}
