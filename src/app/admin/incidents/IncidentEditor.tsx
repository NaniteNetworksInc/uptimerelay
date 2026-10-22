"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, ArrowLeft } from "lucide-react";

import { incidentSeverities, incidentStatuses, severityLabels, statusLabels, type IncidentRecord, type IncidentUpdateRecord } from "@/lib/incidents/shared";
const input = "mt-2 min-h-11 w-full rounded-lg border border-(--line) bg-(--panel-bg) px-3 py-2 text-sm text-(--ink) outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)";
export default function IncidentEditor({ incident, updates = [], groups }: { incident?: IncidentRecord; updates?: IncidentUpdateRecord[]; groups: { name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true); setError(""); setSaved(false);
    try {
      const response = await fetch(incident ? `/api/admin/incidents/${incident.id}` : "/api/admin/incidents", {
        method: incident ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.get("title"), severity: data.get("severity"), status: data.get("status"), affectedServices: data.getAll("services"), published: data.get("published") === "on", message: data.get("message") }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Unable to save incident."); return; }
      if (!incident) router.replace(`/admin/incidents/${result.id}`);
      else { (form.elements.namedItem("message") as HTMLTextAreaElement).value = ""; setSaved(true); }
      router.refresh();
    } catch { setError("Unable to reach the server. Please try again."); }
    finally { setPending(false); }
  }
  return <div className="w-full max-w-4xl">
    <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs text-(--muted) hover:text-(--ink)"><ArrowLeft size={14} />All incidents</Link>
    <h1 className="text-2xl font-semibold tracking-tight">{incident ? "Manage incident" : "Create an incident"}</h1>
    <p className="mt-3 text-sm leading-6 text-(--muted)">{incident ? "Keep customers informed as the investigation progresses." : "Start with a draft, or publish an update to the public status page."}</p>
    <form onSubmit={submit} className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_240px]">
      <fieldset disabled={pending} className="min-w-0 space-y-5 disabled:opacity-60">
        <label className="block text-sm font-medium">Incident title<input name="title" defaultValue={incident?.title} required maxLength={160} className={input} placeholder="e.g. Network connectivity issues in Chicago" /></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">Severity<select name="severity" defaultValue={incident?.severity ?? "degraded"} className={input}>{incidentSeverities.map(value => <option key={value} value={value}>{severityLabels[value]}</option>)}</select></label>
          <label className="block text-sm font-medium">Status<select name="status" defaultValue={incident?.status ?? "investigating"} className={input}>{incidentStatuses.map(value => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></label>
        </div>
        <label className="block text-sm font-medium">{incident ? "Post an update" : "Initial update"}<textarea name="message" required={!incident} maxLength={5000} rows={6} className={`${input} resize-y leading-6`} placeholder="What is happening, who is affected, and what are you doing about it?" /></label>
        <p className="text-xs leading-6 text-(--muted)">Updates are stored in the incident history. Add a message whenever you change its status.</p>
        <label className="flex items-start gap-3 text-sm"><input name="published" type="checkbox" defaultChecked={incident?.published ?? false} className="mt-1 size-4 accent-(--button)" /><span>Publish on the status page<span className="mt-1 block text-xs leading-6 text-(--muted)">When unchecked, this incident is a staff-only draft.</span></span></label>
      </fieldset>
      <fieldset disabled={pending} className="min-w-0 border-t border-(--line) pt-5 md:border-t-0 md:pt-0">
        <legend className="mb-4 text-sm font-semibold">Affected service groups</legend>
        <div className="space-y-4">{groups.map(group => <label key={group.name} className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="services" value={group.name} defaultChecked={incident?.affectedServices.includes(group.name)} className="mt-1 size-4 shrink-0 accent-(--button)" />{group.name}</label>)}</div>
      </fieldset>
      <div className="md:col-span-2">
        {error && <p role="alert" className="mb-4 text-sm text-(--tag-ink)">{error}</p>}
        {saved && <p role="status" className="mb-4 text-sm text-(--healthy)">Incident saved.</p>}
        <button disabled={pending} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-(--button) px-5 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover) disabled:cursor-wait disabled:opacity-50">{pending && <LoaderCircle size={16} className="animate-spin" />}{pending ? "Saving…" : incident ? "Save incident" : "Create incident"}</button>
      </div>
    </form>
    {updates.length > 0 && <section className="mt-12 border-t border-(--line) pt-7"><h2 className="text-base font-semibold">Update history</h2><ol className="mt-5 space-y-6">{updates.map(update => <li key={update.id} className="border-l border-(--line) pl-4"><p className="text-xs text-(--muted)">{statusLabels[update.status]} · {new Date(update.createdAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</p><p className="mt-2 text-sm leading-7 whitespace-pre-wrap">{update.message}</p></li>)}</ol></section>}
  </div>;
}
