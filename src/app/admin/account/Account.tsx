"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
const input = "mt-2 min-h-11 w-full rounded-lg border border-(--line) bg-(--panel-bg) px-3 py-2 text-sm outline-none focus:border-(--accent)";
const button = "min-h-11 cursor-pointer rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover) disabled:cursor-wait disabled:opacity-50";
type Profile = { name: string; email: string; avatar: string | null; mfaEnabled: boolean };
export default function Account({ staff, mfaReady }: { staff: Profile; mfaReady: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null); const [codes, setCodes] = useState<string[]>([]);
  const [showDisable, setShowDisable] = useState(false);
  async function request(path: string, body: object, method = "POST") {
    const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to save changes."); return result;
  }
  async function profile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy("profile"); setError(""); setMessage("");
    try { await request("/api/admin/account", { name: data.get("name"), ...(avatar !== undefined ? { avatar } : {}) }, "PATCH"); setMessage("Profile saved."); router.refresh(); }
    catch(error) { setError(error instanceof Error ? error.message : "Unable to save profile."); } finally { setBusy(null); }
  }
  async function password(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy("password"); setError(""); setMessage("");
    try { await request("/api/admin/account/password", Object.fromEntries(data)); router.replace("/admin/login"); router.refresh(); }
    catch(error) { setError(error instanceof Error ? error.message : "Unable to change password."); } finally { setBusy(null); }
  }
  async function mfa(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy("mfa"); setError(""); setMessage("");
    try {
      const result = await request("/api/admin/account/mfa", { ...Object.fromEntries(data), action });
      if (action === "setup") { setSetup({ secret: result.secret, qr: result.qr }); setCodes([]); }
      else { setSetup(null); setShowDisable(false); setCodes(result.recoveryCodes || []); setMessage(action === "enable" ? "Two-factor authentication enabled. Save your recovery codes below." : "Two-factor authentication disabled."); form.reset(); router.refresh(); }
    } catch(error) { setError(error instanceof Error ? error.message : "Unable to update 2FA."); } finally { setBusy(null); }
  }
  const photo = avatar === undefined ? staff.avatar : avatar;
  return <div className="w-full max-w-3xl"><h1 className="text-2xl font-semibold tracking-tight">Account & security</h1><p className="mt-3 text-sm text-(--muted)">{staff.email}</p>
    {error && <p role="alert" className="mt-6 rounded-lg border border-(--tag-line) p-4 text-sm text-(--tag-ink)">{error}</p>}{message && <p role="status" className="mt-6 text-sm text-(--healthy)">{message}</p>}
    <section className="mt-8 border-t border-(--line) pt-7"><h2 className="text-base font-semibold">Profile</h2><form onSubmit={profile} className="mt-5 space-y-5"><fieldset disabled={busy !== null} className="space-y-5"><div className="flex flex-wrap items-center gap-4">{photo ? <Image src={photo} alt="Profile photo preview" width={64} height={64} unoptimized className="size-16 rounded-full object-cover" /> : <span className="flex size-16 items-center justify-center rounded-full bg-(--group-bg) text-lg text-(--tag-ink)">{staff.name.slice(0,1).toUpperCase()}</span>}<label className="text-xs text-(--muted)">Profile photo · PNG, JPEG, or WebP, up to 500 KB<input type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block max-w-full text-xs" onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 500 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Choose a PNG, JPEG, or WebP image smaller than 500 KB."); return; } const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result)); reader.readAsDataURL(file); }} /></label>{photo && <button type="button" onClick={() => setAvatar(null)} className="min-h-11 cursor-pointer text-xs text-(--tag-ink)">Remove photo</button>}</div><label className="block max-w-md text-sm">Display name<input name="name" defaultValue={staff.name} required maxLength={100} className={input} /></label><button className={button}>{busy === "profile" ? "Saving…" : "Save profile"}</button></fieldset></form></section>
    <section className="mt-10 border-t border-(--line) pt-7"><h2 className="text-base font-semibold">Change password</h2><p className="mt-2 text-xs leading-6 text-(--muted)">Changing your password signs you out on all devices.</p><form onSubmit={password} className="mt-5 max-w-md"><fieldset disabled={busy !== null} className="space-y-4"><label className="block text-sm">Current password<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={256} className={input} /></label><label className="block text-sm">New password<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={256} className={input} /></label><label className="block text-sm">Confirm new password<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={256} className={input} /></label>{staff.mfaEnabled && <label className="block text-sm">2FA or recovery code<input name="code" autoComplete="one-time-code" required maxLength={32} className={input} /></label>}<button className={button}>{busy === "password" ? "Updating…" : "Change password"}</button></fieldset></form></section>
    <section className="mt-10 border-t border-(--line) pt-7"><div className="flex items-center gap-3"><ShieldCheck size={20} className="text-(--accent)" /><h2 className="text-base font-semibold">Two-factor authentication</h2></div><p className="mt-3 text-sm text-(--muted)">{staff.mfaEnabled ? "Enabled. Your authenticator or a recovery code is required at sign in." : "Add an authenticator app to protect your staff account."}</p>
      {!mfaReady && <p className="mt-4 text-xs leading-6 text-(--preview-ink)">Server setup required: configure AUTH_ENCRYPTION_KEY before activating 2FA.</p>}
      {!staff.mfaEnabled && !setup && <form onSubmit={event => mfa(event, "setup")} className="mt-5 max-w-md"><fieldset disabled={busy !== null || !mfaReady} className="space-y-4"><label className="block text-sm">Current password<input name="password" type="password" autoComplete="current-password" required maxLength={256} className={input} /></label><button className={button}>{busy === "mfa" ? "Preparing…" : "Set up authenticator"}</button></fieldset></form>}
      {setup && <div className="mt-6"><p className="text-sm leading-7">Scan this QR code in your authenticator app, then enter its six-digit code. Setup expires after 10 minutes.</p><Image src={setup.qr} alt="Scan this QR code in your authenticator app" width={224} height={224} unoptimized className="mt-4 rounded-lg" /><details className="mt-4 text-xs"><summary className="cursor-pointer">Enter a setup key manually</summary><code className="mt-3 block break-all select-all">{setup.secret}</code></details><form onSubmit={event => mfa(event, "enable")} className="mt-5 max-w-md"><fieldset disabled={busy !== null} className="space-y-4"><label className="block text-sm">Current password<input name="password" type="password" autoComplete="current-password" required maxLength={256} className={input} /></label><label className="block text-sm">Authenticator code<input name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required className={input} /></label><div className="flex items-center gap-4"><button className={button}>{busy === "mfa" ? "Activating…" : "Activate 2FA"}</button><button type="button" onClick={() => setSetup(null)} className="min-h-11 cursor-pointer text-xs text-(--muted)">Cancel</button></div></fieldset></form></div>}
      {codes.length > 0 && <div className="mt-6 rounded-xl border border-(--line) p-5"><h3 className="text-sm font-semibold">Save your recovery codes</h3><p className="mt-2 text-xs leading-6 text-(--muted)">These are shown once. Keep them somewhere safe. Each code can be used once if you lose access to your authenticator.</p><pre className="mt-4 overflow-x-auto text-sm leading-7 select-all">{codes.join("\n")}</pre><button type="button" onClick={() => setCodes([])} className="mt-4 min-h-11 cursor-pointer text-xs text-(--tag-ink)">I have saved my recovery codes</button></div>}
      {staff.mfaEnabled && !showDisable && <button type="button" onClick={() => setShowDisable(true)} className="mt-4 min-h-11 cursor-pointer text-xs text-(--tag-ink)">Disable 2FA</button>}
      {showDisable && <form onSubmit={event => mfa(event, "disable")} className="mt-5 max-w-md"><fieldset disabled={busy !== null} className="space-y-4"><label className="block text-sm">Current password<input name="password" type="password" required autoComplete="current-password" maxLength={256} className={input} /></label><label className="block text-sm">Authenticator or recovery code<input name="code" required autoComplete="one-time-code" maxLength={32} className={input} /></label><button className={button}>Confirm disable 2FA</button></fieldset></form>}
    </section>
  </div>;
}
