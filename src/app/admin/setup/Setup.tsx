"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
const input = "mt-2 min-h-11 w-full rounded-lg border border-(--line) bg-(--panel-bg) px-3 text-sm outline-none focus:border-(--accent) disabled:opacity-60";
export default function Setup() {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setPending(true); setError("");
    try {
      const response = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await response.json(); if (!response.ok) { setError(result.error || "Unable to finish setup."); return; } router.replace("/admin/settings"); router.refresh();
    } catch { setError("Unable to reach the server. Try again."); } finally { setPending(false); }
  }
  return <div className="w-full max-w-md"><h1 className="text-3xl font-semibold tracking-tight">Your status page starts here</h1><p className="mt-3 text-sm leading-6 text-(--muted)">Create the owner account for this installation. You can invite staff and customize branding afterward.</p>
    <form onSubmit={submit} className="mt-8"><fieldset disabled={pending} className="space-y-5">
      <label className="block text-sm">Setup token<input name="token" type="password" autoComplete="off" required minLength={32} maxLength={256} className={input} /><span className="mt-2 block text-xs text-(--muted)">Use the SETUP_TOKEN configured by your server administrator.</span></label>
      <label className="block text-sm">Site name<input name="siteName" required maxLength={100} className={input} /></label>
      <label className="block text-sm">Your name<input name="name" autoComplete="name" required maxLength={100} className={input} /></label>
      <label className="block text-sm">Email address<input name="email" type="email" autoComplete="username" autoCapitalize="none" required maxLength={254} className={input} /></label>
      <label className="block text-sm">Password<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={256} className={input} /></label>
      <label className="block text-sm">Confirm password<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={256} className={input} /></label>
      <button className="min-h-12 w-full cursor-pointer rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover) disabled:opacity-60">{pending ? "Creating your installation…" : "Create owner account"}</button>
    </fieldset>{error && <p role="alert" className="mt-4 text-sm text-(--tag-ink)">{error}</p>}</form>
  </div>;
}
