"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, CircleHelp, Plus, TriangleAlert, X } from "lucide-react";
import UptimeHistory from "@/app/components/UptimeHistory";
import MonitorForm from "./MonitorForm";
import { componentStatuses, componentStatusLabels, type ManagedGroup } from "@/lib/services/shared";
const input = "mt-2 min-h-11 w-full rounded-lg border border-(--line) bg-(--panel-bg) px-3 py-2 text-sm outline-none focus:border-(--accent)";
function ComponentEditor({ component, groups, close }: { component: ManagedGroup["components"][number]; groups: ManagedGroup[]; close: () => void }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(false);
  const [showUptime, setShowUptime] = useState(component.showUptime);
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function remove() {
    setPending(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/components/${component.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setError(true); setMessage(result.error || "Unable to delete component."); return; }
      close(); router.refresh();
    } catch { setError(true); setMessage("Unable to reach the server."); } finally { setPending(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setPending(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/components/${component.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), status: data.get("status"), enabled: data.get("enabled") === "on", statusUrl: data.get("statusUrl"), groupId: data.get("groupId"), showUptime }) });
      const result = await response.json(); setError(!response.ok); setMessage(response.ok ? "Saved." : result.error || "Unable to update component."); if (response.ok) router.refresh();
    } catch { setError(true); setMessage("Unable to reach the server."); } finally { setPending(false); }
  }
  return <section aria-labelledby="component-editor-heading" className="max-w-3xl">
    <button type="button" onClick={close} className="mb-7 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-(--muted) hover:text-(--ink)"><ArrowLeft size={16} />All components</button>
    <h1 id="component-editor-heading" className="text-2xl font-semibold tracking-tight">{component.name}</h1>
    <p className="mt-2 text-sm text-(--muted)">Edit component details and monitoring.</p>
    <form onSubmit={save} className="mt-8"><fieldset disabled={pending} className="space-y-6">
      <label className="block text-sm">Name<input name="name" defaultValue={component.name} required maxLength={120} className={input} /></label>
      <label className="block text-sm">Group it under<select name="groupId" defaultValue={component.groupId} className={input}>{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
      <label className="block text-sm">Manual status<select name="status" defaultValue={component.manualStatus} className={input}>{componentStatuses.map(status => <option key={status} value={status}>{componentStatusLabels[status]}</option>)}</select></label>
      <p className="text-xs leading-6 text-(--muted)">Monitoring and published incidents can report a worse condition than the manual status.</p>
      <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showUptime} onChange={event => setShowUptime(event.target.checked)} className="size-4 accent-(--button)" />Show uptime history</label>{showUptime && <UptimeHistory days={component.history} />}{showUptime && !component.showUptime && <p className="mt-2 text-xs text-(--muted)">Save to load any recorded history for this component.</p>}</div>
      <details className="rounded-lg border border-(--line) p-4"><summary className="cursor-pointer text-sm font-medium">Advanced settings</summary><div className="mt-5 space-y-5"><label className="block text-sm">External status page<input name="statusUrl" type="url" defaultValue={component.statusUrl ?? ""} maxLength={2048} className={input} /></label><label className="flex items-center gap-2 text-sm"><input name="enabled" type="checkbox" defaultChecked={component.enabled} className="size-4 accent-(--button)" />Visible on the public page</label></div></details>
      <button className="min-h-12 w-full cursor-pointer rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover) disabled:opacity-60">{pending ? "Saving..." : "Save component"}</button>
    </fieldset></form>
    {message && <p role={error ? "alert" : "status"} className={`mt-4 text-sm ${error ? "text-(--tag-ink)" : "text-(--healthy)"}`}>{message}</p>}
    <div className="mt-7"><MonitorForm component={component} /></div>
    <div className="mt-6 flex items-center justify-between gap-4 border-t border-(--line) pt-5"><button type="button" onClick={close} disabled={pending} className="min-h-11 cursor-pointer text-sm text-(--muted)">Close</button><button type="button" onClick={() => setConfirmDelete(true)} disabled={pending} className="min-h-11 cursor-pointer text-sm text-(--tag-ink)">Delete component</button></div>
    {confirmDelete && <div role="alert" className="mt-4 rounded-lg border border-(--line) p-5"><p className="text-sm leading-6">Delete {component.name}? This permanently removes the component, its monitor, and recorded check history.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={pending} onClick={remove} className="min-h-11 cursor-pointer rounded-lg bg-(--button) px-4 text-sm text-(--button-ink) disabled:opacity-60">{pending ? "Deleting..." : "Yes, delete component"}</button><button type="button" disabled={pending} onClick={() => setConfirmDelete(false)} className="min-h-11 cursor-pointer rounded-lg border border-(--line) px-4 text-sm">Cancel</button></div></div>}
  </section>;

}
export default function Components({ groups }: { groups: ManagedGroup[] }) {
  const router = useRouter(); const [pending, setPending] = useState<string | null>(null); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("");
  const selectedComponent = groups.flatMap(group => group.components).find(component => component.id === selected);
  async function create(event: FormEvent<HTMLFormElement>, kind: "group" | "component") {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setPending(kind); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/components", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, name: data.get("name"), description: data.get("description") || "", groupId: data.get("groupId"), status: data.get("status") }) });
      const result = await response.json(); if (!response.ok) { setError(result.error || "Unable to save."); return; } form.reset(); setMessage(kind === "group" ? "Service group created." : "Component created."); router.refresh();
    } catch { setError("Unable to reach the server."); } finally { setPending(null); }
  }
  if (selectedComponent) return <div className="w-full max-w-4xl"><ComponentEditor key={selectedComponent.id} component={selectedComponent} groups={groups} close={() => setSelected(null)} /></div>;
  const query = filter.trim().toLowerCase();
  const visibleGroups = groups.filter(group => group.name.toLowerCase().includes(query) || group.components.some(component => component.name.toLowerCase().includes(query)));
  return <div className="w-full max-w-4xl"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Components</h1><p className="mt-2 text-sm text-(--muted)">{groups.length} groups  /  {groups.reduce((count, group) => count + group.components.length, 0)} components</p></div><button type="button" onClick={() => setShowCreate(!showCreate)} aria-expanded={showCreate} aria-controls="create-components" className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover)">{showCreate ? <X size={17} /> : <Plus size={17} />}{showCreate ? "Close" : "Add component"}</button></header>
    <div id="create-components" hidden={!showCreate} className={`${showCreate ? "grid" : "hidden"} mt-8 gap-8 border-y border-(--line) py-7 md:grid-cols-2`}>
      <form onSubmit={event => create(event, "group")}><h2 className="text-base font-semibold">Add a service group</h2><fieldset disabled={pending !== null} className="mt-4 space-y-4"><label className="block text-sm">Group name<input name="name" required maxLength={120} placeholder="e.g. Dallas Data Center" className={input} /></label><label className="block text-sm">Description<input name="description" maxLength={240} placeholder="e.g. Infrastructure" className={input} /></label><button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-(--line) px-4 text-sm hover:bg-(--hover)"><Plus size={15} />{pending === "group" ? "Creating…" : "Add group"}</button></fieldset></form>
      <form onSubmit={event => create(event, "component")}><h2 className="text-base font-semibold">Add a component</h2><fieldset disabled={pending !== null || !groups.length} className="mt-4 space-y-4"><label className="block text-sm">Service group<select name="groupId" required className={input}>{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label className="block text-sm">Component name<input name="name" required maxLength={120} placeholder="e.g. Game panel" className={input} /></label><label className="block text-sm">Initial status<select name="status" defaultValue="unknown" className={input}>{componentStatuses.map(status => <option key={status} value={status}>{componentStatusLabels[status]}</option>)}</select></label><button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover) disabled:opacity-50"><Plus size={15} />{pending === "component" ? "Creating…" : "Add component"}</button></fieldset>{!groups.length && <p className="mt-3 text-xs text-(--muted)">Create a service group first.</p>}</form>
    </div>{error && <p role="alert" className="mt-4 text-sm text-(--tag-ink)">{error}</p>}{message && <p role="status" className="mt-4 text-sm text-(--healthy)">{message}</p>}
    <label className="mt-8 block max-w-sm text-xs text-(--muted)">Find a component<input type="search" value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search groups or components" className={input} /></label>
    <div className="mt-6 border-t border-(--line)">{visibleGroups.map(group => {
      const components = query && !group.name.toLowerCase().includes(query) ? group.components.filter(component => component.name.toLowerCase().includes(query)) : group.components;
      return <details key={`${group.id}-${query ? "filtered" : "all"}`} open={query ? true : undefined} className="group/components border-b border-(--line)"><summary className="flex min-h-20 cursor-pointer list-none items-center gap-3 py-5 [&::-webkit-details-marker]:hidden"><ChevronRight size={18} className="shrink-0 text-(--muted) group-open/components:rotate-90" aria-hidden="true" /><span className="min-w-0 flex-1 text-sm font-medium">{group.name}</span><span className="text-xs text-(--muted)">{group.components.length} components</span></summary>
      <ul className="pb-5 pl-4 sm:pl-8">{components.map(component => <li key={component.id}><button type="button" onClick={() => setSelected(component.id)} className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-md px-2 py-4 text-left hover:bg-(--hover) focus-visible:outline-2 focus-visible:outline-(--accent)">
      <ComponentStatus status={component.status} /><span className="min-w-0 flex-1 break-words text-sm">{component.name}{!component.enabled && <span className="ml-2 text-xs text-(--muted)">Hidden</span>}</span><span className="hidden text-xs text-(--muted) sm:block">{componentStatusLabels[component.status] ?? "No data"}</span><ChevronRight size={18} className="shrink-0 text-(--muted)" aria-hidden="true" /></button></li>)}</ul>{!components.length && <p className="pb-6 pl-8 text-sm text-(--muted)">No components yet. Use Add component to create one.</p>}</details>;
    })}</div>{!visibleGroups.length && <p className="py-10 text-sm text-(--muted)">{query ? "No groups or components match your search." : "Create a service group to get started."}</p>}
  </div>;
}
function ComponentStatus({ status }: { status: string }) {
  const Icon = status === "operational" ? Check : status === "unknown" ? CircleHelp : TriangleAlert;
  return <span title={componentStatusLabels[status]} className={`flex size-5 shrink-0 items-center justify-center rounded-full ${status === "operational" ? "bg-(--healthy) text-(--page)" : status === "unknown" ? "text-(--muted)" : "text-(--tag-ink)"}`}><Icon size={14} aria-hidden="true" /><span className="sr-only">{componentStatusLabels[status] ?? "No data"}</span></span>;
}
