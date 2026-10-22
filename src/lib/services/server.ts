import "server-only";
import { authDb } from "@/lib/auth/server";
import { monitorStatus } from "@/lib/monitoring/config";
import type { ManagedMonitor } from "@/lib/services/shared";
import { readDailyHistory } from "@/lib/services/history-query";
import { buildHistory } from "@/lib/services/history";
export async function getServiceGroups() {
  const db = await authDb();
  const groups = await db.orm.status_page.ServiceGroup.orderBy(row => row.createdAt.asc()).all();
  const components = await db.orm.status_page.ServiceComponent.orderBy(row => row.createdAt.asc()).all();
  const monitors = await db.orm.status_page.ServiceMonitor.all();
  const history = components.some(component => component.showUptime) ? await readDailyHistory(db) : [];
  const ranks: Record<string, number> = { operational: 0, unknown: 1, degraded: 2, maintenance: 3, partial_outage: 4, major_outage: 5 };
  return groups.map(group => ({ ...group, components: components.filter(component => component.groupId === group.id).map(component => {
    const stored = monitors.find(row => row.componentId === component.id);
    const monitor: ManagedMonitor | null = stored && (stored.kind === "http" || stored.kind === "tcp" || stored.kind === "statuspage") ? { ...stored, kind: stored.kind } : null;
    const automatic = monitor?.enabled ? monitorStatus(monitor) : component.status;
    const status = component.status !== "unknown" && ranks[component.status] > ranks[automatic] ? component.status : automatic;
    return { ...component, manualStatus: component.status, status, monitor, history: component.showUptime ? buildHistory(history.filter(row => row.componentId === component.id)) : buildHistory([]) };
  }) }));
}
