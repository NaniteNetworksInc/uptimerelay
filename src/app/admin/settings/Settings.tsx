"use client";
import Image from "next/image";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/site/shared";
const input = "mt-2 min-h-11 w-full rounded-lg border border-(--line) bg-(--panel-bg) px-3 py-2 text-sm outline-none placeholder:text-(--muted) focus:border-(--accent)";
export default function Settings({ settings, publicUrl }: { settings: SiteSettings; publicUrl: string }) {
  const router = useRouter();
  const [logo, setLogo] = useState(settings.logo); const [favicon, setFavicon] = useState(settings.favicon);
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  async function image(event: ChangeEvent<HTMLInputElement>, target: "logo" | "favicon") {
    const file = event.target.files?.[0]; if (!file) return;
    setError(""); setSaved(false);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 500 * 1024) { setError("Choose a PNG, JPEG, or WebP image under 500 KB."); return; }
    const reader = new FileReader(); reader.onload = () => { if (target === "logo") setLogo(String(reader.result)); else setFavicon(String(reader.result)); }; reader.onerror = () => setError("Unable to read that image. Try another file."); reader.readAsDataURL(file);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setPending(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), description: data.get("description"), copyright: data.get("copyright"), accent: data.get("accent"), buttonColor: data.get("buttonColor"), logo, favicon }) });
      const result = await response.json(); if (!response.ok) { setError(result.error || "Unable to save settings."); return; } setSaved(true); router.refresh();
    } catch { setError("Unable to reach the server. Try again."); } finally { setPending(false); }
  }
  return <div className="w-full max-w-3xl"><h1 className="text-2xl font-semibold tracking-tight">Site settings</h1><p className="mt-3 text-sm leading-6 text-(--muted)">Make this status page your own. Changes apply to the public page and staff area.</p>
    <form onSubmit={save} className="mt-8"><fieldset disabled={pending} className="space-y-6">
      <label className="block text-sm">Site name<input name="name" required maxLength={100} defaultValue={settings.name} className={input} /></label>
      <label className="block text-sm">Description<textarea name="description" required maxLength={300} defaultValue={settings.description} className={`${input} min-h-24`} /></label>
      <label className="block text-sm">Copyright holder<input name="copyright" required maxLength={120} defaultValue={settings.copyright} className={input} /><span className="mt-2 block text-xs text-(--muted)">The current year is added automatically.</span></label>
      <div className="grid gap-6 sm:grid-cols-2">{(["logo", "favicon"] as const).map(target => { const value = target === "logo" ? logo : favicon; return <section key={target} className="border-t border-(--line) pt-5"><label className="block text-sm">{target === "logo" ? "Logo" : "Browser icon"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => image(event, target)} className="mt-3 block w-full text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-(--line) file:bg-(--panel-bg) file:px-3 file:py-2 file:text-(--ink)" /></label><p className="mt-2 text-xs text-(--muted)">PNG, JPEG, or WebP · up to 500 KB</p>{value && <div className="mt-4 flex items-center gap-4"><Image src={value} alt={`${target} preview`} width={64} height={64} unoptimized className="size-16 object-contain" /><button type="button" onClick={() => target === "logo" ? setLogo(null) : setFavicon(null)} className="min-h-11 cursor-pointer text-xs text-(--tag-ink)">Remove image</button></div>}</section>; })}</div>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm">Accent color<input type="color" name="accent" defaultValue={settings.accent} className={`${input} cursor-pointer`} /></label><label className="block text-sm">Button color<input type="color" name="buttonColor" defaultValue={settings.buttonColor} className={`${input} cursor-pointer`} /></label></div>
      <p className="text-xs leading-6 text-(--muted)">Accent colors are used for links, icons, and focus indicators. Choose a color visible in both themes. Button text switches between black and white for contrast.</p>
      <label className="block text-sm">Public URL<input readOnly value={publicUrl} className={`${input} text-(--muted)`} /><span className="mt-2 block text-xs leading-6 text-(--muted)">Configured using APP_URL on your server. This also protects sign-in and admin requests.</span></label>
      <button className="min-h-11 cursor-pointer rounded-lg bg-(--button) px-5 text-sm font-semibold text-(--button-ink) hover:bg-(--button-hover) disabled:opacity-60">{pending ? "Saving…" : "Save settings"}</button>
    </fieldset>{error && <p role="alert" className="mt-4 text-sm text-(--tag-ink)">{error}</p>}{saved && <p role="status" className="mt-4 text-sm text-(--healthy)">Site settings saved.</p>}</form>
  </div>;
}
