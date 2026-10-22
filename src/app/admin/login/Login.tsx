"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";

const inputClass = "mt-2 min-h-12 w-full rounded-lg border border-(--line) bg-(--panel-bg) px-3 text-sm text-(--ink) outline-none transition-colors placeholder:text-(--muted) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) disabled:opacity-60";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError(result.error || "Unable to complete your request.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch { setError("Unable to reach the server. Check your connection and try again."); }
    finally { setPending(false); }
  }
  const [visible, setVisible] = useState(false);
  return (
    <div className="w-full max-w-96">
      <LockKeyhole size={25} strokeWidth={1.6} className="mb-6 text-(--accent)" aria-hidden="true" />
      <h1 className="text-3xl font-semibold tracking-tight">Staff sign in</h1>
      <p className="mt-3 text-sm leading-6 text-(--muted)">Manage service health, incidents, and maintenance.</p>
      <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={pending}>
        <label htmlFor="email" className="block text-sm font-medium">Email address
          <input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} disabled={pending} placeholder="you@example.com" className={`${inputClass} read-only:text-(--muted)`} />
        </label>
<label htmlFor="password" className="block text-sm font-medium">Password
          <div className="relative">
            <input id="password" name="password" type={visible ? "text" : "password"} required  maxLength={256} autoComplete="current-password" disabled={pending} className={`${inputClass} pr-12`} />
            <button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} password`} className="absolute right-1 bottom-0.5 flex size-11 cursor-pointer items-center justify-center rounded-md text-(--muted) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--accent)">
              {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </label>
<label htmlFor="code" className="block text-sm font-medium">2FA or recovery code <span className="font-normal text-(--muted)">(if enabled)</span><input id="code" name="code" autoComplete="one-time-code" maxLength={32} disabled={pending} className={inputClass} /></label>
        {error && <p role="alert" className="rounded-lg border border-(--accent)/30 bg-(--accent)/5 px-3 py-3 text-sm leading-6 text-(--tag-ink)">{error}</p>}
        <button disabled={pending} type="submit" className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) transition-colors hover:bg-(--button-hover) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--accent) disabled:cursor-wait disabled:opacity-60">
          {pending && <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {pending ? "Signing in…" : "Sign in"}
          {!pending && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>
      <div className="mt-7 border-t border-(--line) pt-6 text-xs leading-6 text-(--muted)">
        <p>Staff access is by invitation only. Contact your administrator if you need access or a password reset.</p>
        <Link href="/" className="mt-4 inline-block underline decoration-(--line) underline-offset-4 hover:text-(--ink)">Back to public status</Link>
      </div>
    </div>
  );
}
