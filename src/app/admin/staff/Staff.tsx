"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, UserPlus } from "lucide-react";
type Invitation = { id: string; email: string; state: string; expiresAt: string };
export default function Staff({ accounts, invites }: { accounts: { id: string; name: string; email: string }[]; invites: Invitation[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    setPending(true); setError(""); setLink(""); setCopied(false);
    try {
      const response = await fetch("/api/admin/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email") }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Unable to create invitation."); return; }
      setLink(result.url); form.reset(); router.refresh();
    } catch { setError("Unable to reach the server. Please try again."); }
    finally { setPending(false); }
  }
  async function revoke(id: string) {
    setBusy(id); setError("");
    try {
      const response = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Unable to revoke invitation."); return; }
      setLink(""); router.refresh();
    } catch { setError("Unable to revoke invitation. Please try again."); }
    finally { setBusy(null); }
  }
  return <div className="w-full max-w-4xl">
    <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
    <p className="mt-3 text-sm leading-6 text-(--muted)">Invite your team to manage service updates.</p>
    <section className="mt-8 border-y border-(--line) py-7" aria-labelledby="invite-heading">
      <h2 id="invite-heading" className="text-base font-semibold">Invite a staff member</h2>
      <p className="mt-2 text-xs leading-6 text-(--muted)">Create a private registration link for their email. Invitations expire after 24 hours and can be used once.</p>
      <form onSubmit={invite} className="mt-5 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium">Email address<input type="email" name="email" required maxLength={254} disabled={pending} autoComplete="off" placeholder="teammate@example.com" className="mt-2 min-h-11 w-full min-w-52 rounded-lg border border-(--line) bg-(--panel-bg) px-3 text-sm outline-none focus:border-(--accent)" /></label>
        <button disabled={pending} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover) disabled:opacity-50"><UserPlus size={16} aria-hidden="true" />{pending ? "Creating…" : "Create invitation"}</button>
      </form>
      {link && <div role="status" className="mt-5 rounded-lg border border-(--line) bg-(--group-bg) p-4">
        <p className="text-sm font-medium">Invitation ready</p><p className="mt-2 text-xs leading-6 text-(--muted)">Copy this link now and share it privately. It won’t be shown again after leaving this page. No email has been sent.</p>
        <div className="mt-3 flex items-center gap-2"><input aria-label="Registration invitation link" value={link} readOnly onFocus={event => event.target.select()} className="min-h-11 min-w-0 flex-1 rounded-md border border-(--line) bg-(--panel-bg) px-3 text-xs" /><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError("Copy the invitation link manually from the field above."); } }} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-(--line) px-3 text-xs">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}</button></div>
      </div>}
      {error && <p role="alert" className="mt-4 text-sm text-(--tag-ink)">{error}</p>}
    </section>
    <section className="mt-8" aria-labelledby="staff-heading"><h2 id="staff-heading" className="text-base font-semibold">Staff accounts <span className="ml-2 text-xs font-normal text-(--muted)">{accounts.length}</span></h2><ul className="mt-4 divide-y divide-(--line)">{accounts.map(account => <li key={account.id} className="py-4"><p className="text-sm font-medium">{account.name}</p><p className="mt-1 text-xs text-(--muted)">{account.email}</p></li>)}</ul></section>
    <section className="mt-8" aria-labelledby="invitations-heading"><h2 id="invitations-heading" className="text-base font-semibold">Invitation history</h2>{!invites.length && <p className="mt-4 text-sm text-(--muted)">No invitations yet.</p>}<ul className="mt-4 divide-y divide-(--line)">{invites.map(invitation => <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="text-sm">{invitation.email}</p><p className="mt-2 text-xs text-(--muted)">{invitation.state} · Expires {new Date(invitation.expiresAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</p></div>{invitation.state === "Pending" && <button type="button" disabled={busy !== null} onClick={() => revoke(invitation.id)} className="min-h-11 cursor-pointer rounded-lg border border-(--line) px-3 text-xs text-(--tag-ink) hover:bg-(--hover) disabled:opacity-50">{busy === invitation.id ? "Revoking…" : "Revoke"}</button>}</li>)}</ul></section>
  </div>;
}
