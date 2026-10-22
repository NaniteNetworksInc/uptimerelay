import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import { statusLabels, severityLabels, type IncidentRecord } from "@/lib/incidents/shared";
export default function Dashboard({ incidents }: { incidents: IncidentRecord[] }) {
  return <div className="w-full max-w-4xl">
    <div className="flex flex-wrap items-center justify-between gap-5"><div><h1 className="text-2xl font-semibold tracking-tight">Incidents</h1><p className="mt-2 text-sm text-(--muted)">Draft, publish, and track service disruptions.</p></div><Link href="/admin/incidents/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover)"><Plus size={16} />Create incident</Link></div>
    <div className="mt-8 border-t border-(--line)">
      {!incidents.length && <div className="py-12"><h2 className="font-medium">No incidents yet</h2><p className="mt-3 text-sm text-(--muted)">Create your first draft when you’re ready to prepare an announcement.</p></div>}
      {incidents.map(incident => <Link key={incident.id} href={`/admin/incidents/${incident.id}`} className="flex items-center justify-between gap-4 border-b border-(--line) py-5 hover:bg-(--hover)"><span className="min-w-0"><span className="block text-sm font-semibold">{incident.title}</span><span className="mt-2 block text-xs text-(--muted)">{incident.published ? "Public" : "Draft"} · {statusLabels[incident.status]} · {severityLabels[incident.severity]}</span></span><ArrowUpRight size={16} className="shrink-0 text-(--accent)" /></Link>)}
    </div>
  </div>;
}
