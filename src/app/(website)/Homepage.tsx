import { Activity, ExternalLink, ArrowDownRight, CalendarClock, ChevronRight, Info, TriangleAlert, CircleAlert, CircleX, CircleHelp } from "lucide-react";

import { listIncidents, incidentDetail } from "@/lib/incidents/server";
import { severityLabels, statusLabels, type IncidentRecord } from "@/lib/incidents/shared";
import StatusRefresh from "./StatusRefresh";
import UptimeHistory from "@/app/components/UptimeHistory";
import { getServiceGroups } from "@/lib/services/server";
import { componentStatusLabels, type ManagedGroup } from "@/lib/services/shared";

function HealthLabel({ severity = "operational" }: { severity?: string }) {
  const color = severity === "operational" ? "text-(--healthy)" : severity === "degraded" ? "text-(--preview-ink)" : "text-(--tag-ink)";
  return <span className={`inline-flex shrink-0 items-center gap-2 text-xs ${color}`}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{severity === "unknown" ? "Status unavailable" : componentStatusLabels[severity] ?? "Operational"}</span>;
}

export default async function Homepage() {
  let incidents: IncidentRecord[] = [];
  let serviceGroups: ManagedGroup[] = [];
  let available = true;
  try { incidents = await listIncidents(true); serviceGroups = (await getServiceGroups()).map(group => ({ ...group, components: group.components.filter(component => component.enabled) })); } catch { available = false; }
  const active = incidents.filter(incident => incident.status !== "resolved");
  const ranks: Record<string, number> = { operational: 0, degraded: 1, partial_outage: 2, major_outage: 5, maintenance: 2, unknown: 1 };
  const worst = (items: IncidentRecord[]) => items.reduce((severity, incident) => ranks[incident.severity] > ranks[severity] ? incident.severity : severity, "operational");
  const groupSeverity = (group: ManagedGroup) => group.components.reduce((state, component) => (ranks[component.status] ?? 1) > ranks[state] ? component.status : state, worst(active.filter(incident => incident.affectedServices.includes(group.name))));
  const severity = serviceGroups.reduce((state, group) => ranks[groupSeverity(group)] > ranks[state] ? groupSeverity(group) : state, worst(active));
  const headings: Record<string, string> = { operational: "All systems operational", degraded: "Some services are experiencing issues", partial_outage: "Some services are unavailable", major_outage: "Major service disruption", maintenance: "Maintenance in progress", unknown: "Some services have no reported status" };
  const SummaryIcon = !available ? CircleHelp : severity === "operational" ? Activity : severity === "degraded" ? TriangleAlert : severity === "partial_outage" ? CircleAlert : CircleX;
  const recent = await Promise.all(incidents.slice(0, 10).map(async incident => {
    const detail = await incidentDetail(incident.id);
    return { incident, updates: detail?.updates ?? [] };
  }));
  return (
    <>
      <StatusRefresh />
      <section aria-labelledby="health-heading" className="flex flex-wrap items-center justify-between gap-6 border-y border-(--line) py-7">
        <div className="flex items-center gap-4">
          <SummaryIcon size={26} className="text-(--accent)" strokeWidth={1.6} aria-hidden="true" />
          <div>
            <h1 id="health-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">{available ? headings[severity] : "Status unavailable"}</h1>
            <p className="mt-2 text-xs leading-relaxed text-(--muted)">{!available ? "Unable to load service updates. Please check back shortly." : active.length ? "See affected services and incident updates below." : "No active incidents have been reported."}</p>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
        <section id="components" aria-labelledby="components-heading" className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="components-heading" className="text-base font-semibold">Our network</h2>
            <span className="text-xs text-(--muted)">{serviceGroups.length} service groups</span>
          </div>
          <div className="border-t border-(--line)">
            {serviceGroups.map((group) => (
              <details key={group.name} className="group border-b border-(--line)">
                <summary className="flex cursor-pointer list-none items-center gap-3 py-6 transition-colors hover:bg-(--hover) [&::-webkit-details-marker]:hidden">
                  <ChevronRight size={16} className="shrink-0 text-(--accent) transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{group.name}</span>
                    <span className="mt-1.5 block text-xs text-(--muted)">{group.description} <span aria-hidden="true">/</span> {group.components.length} components</span>
                  </span>
                  <HealthLabel severity={available ? groupSeverity(group) : "unknown"} />
                </summary>
                <ul className="ml-7 pb-5">
                  {group.components.map((component) => (
                    <li key={component.id} className="py-3 text-xs"><div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 text-(--secondary)">{component.name}{component.statusUrl && <a href={component.statusUrl} target="_blank" rel="noopener noreferrer" aria-label={`${component.name}: provider status page (opens in a new tab)`} className="rounded p-1 text-(--muted) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--accent)"><ExternalLink size={13} aria-hidden="true" /></a>}</span>
                      <HealthLabel severity={available ? (ranks[component.status] > ranks[worst(active.filter(incident => incident.affectedServices.includes(group.name)))] ? component.status : worst(active.filter(incident => incident.affectedServices.includes(group.name)))) : "unknown"} />
                    </div>{component.showUptime && <UptimeHistory days={component.history} />}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>

        <aside aria-labelledby="updates-heading">
          <div className="mb-5 flex items-center justify-between border-b border-(--line) pb-5">
            <h2 id="updates-heading" className="text-base font-semibold">Updates</h2>
            <ArrowDownRight size={18} className="text-(--accent)" aria-hidden="true" />
          </div>
          <div className="relative ml-2 border-l border-(--line) pl-6">
            <section id="incidents" aria-labelledby="incidents-heading" className="relative pb-10">
              <span className="absolute -left-7.25 top-1 size-2.25 rounded-full border-2 border-(--accent) bg-(--page)" aria-hidden="true" />
              <h3 id="incidents-heading" className="text-sm font-semibold">Incidents</h3>
              {!available ? <p className="mt-3 text-sm text-(--muted)">Updates are temporarily unavailable.</p> : !recent.length ? <p className="mt-3 text-sm text-(--secondary)">No incidents reported.</p> : <div className="mt-4 space-y-7">{recent.map(({ incident, updates }) => (
                <article key={incident.id}>
                  <h4 className="text-sm font-semibold leading-6">{incident.title}</h4>
                  <p className="mt-2 text-xs text-(--muted)">{statusLabels[incident.status]} · {severityLabels[incident.severity]}</p>
                  <p className="mt-2 text-xs leading-6 text-(--secondary)">{incident.affectedServices.join(", ")}</p>
                  {updates[0] && <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{updates[0].message}</p>}
                  <time dateTime={new Date(incident.updatedAt).toISOString()} className="mt-2 block text-[11px] text-(--muted)">{new Date(incident.updatedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</time>
                  {updates.length > 1 && <details className="mt-3"><summary className="cursor-pointer text-xs text-(--tag-ink)">Previous updates</summary><ol className="mt-3 space-y-4">{updates.slice(1).map(update => <li key={update.id}><p className="text-[11px] text-(--muted)">{statusLabels[update.status]} · {new Date(update.createdAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</p><p className="mt-1 text-xs leading-6 whitespace-pre-wrap">{update.message}</p></li>)}</ol></details>}
                </article>
              ))}</div>}

            </section>
            <section id="maintenance" aria-labelledby="maintenance-heading" className="relative pb-2">
              <CalendarClock size={16} className="absolute -left-8 top-0.5 bg-(--page) text-(--muted)" aria-hidden="true" />
              <h3 id="maintenance-heading" className="text-sm font-semibold">Maintenance</h3>
              <p className="mt-3 text-sm text-(--secondary)">No maintenance to display.</p>
              <p className="mt-2 text-xs leading-6 text-(--muted)">Planned work and upcoming maintenance windows will be listed here.</p>
            </section>
          </div>
        </aside>
      </div>
      <p className="mt-10 flex items-start gap-2 text-[11px] leading-5 text-(--muted)"><Info size={13} className="mt-1 shrink-0" aria-hidden="true" />Configured checks and provider feeds update service health automatically. Services without a monitor are maintained by staff. This page refreshes every minute.</p>
    </>
  );
}
