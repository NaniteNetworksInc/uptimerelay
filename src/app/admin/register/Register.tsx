"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, MailCheck } from "lucide-react";

const inputClass = "mt-2 min-h-12 w-full rounded-lg border border-(--line) bg-(--panel-bg) px-3 text-sm text-(--ink) outline-none transition-colors placeholder:text-(--muted) focus:border-(--accent) focus:ring-1 focus:ring-(--accent) disabled:opacity-60";

export default function Register({ email, token }: { email: string; token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST", body: data });
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
  const [confirmVisible, setConfirmVisible] = useState(false);
  return (
    <div className="w-full max-w-96">
      <MailCheck size={27} strokeWidth={1.6} className="mb-6 text-(--accent)" aria-hidden="true" />
      <h1 className="text-3xl font-semibold tracking-tight">You’re invited.</h1>
      <p className="mt-3 text-sm leading-6 text-(--muted)">Create your staff account.</p>
      <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={pending}>
        <input type="hidden" name="token" value={token} />
        <label htmlFor="name" className="block text-sm font-medium">Your name<input id="name" name="name" autoComplete="name" required maxLength={100} disabled={pending} className={inputClass} /></label>
<label htmlFor="email" className="block text-sm font-medium">Email address
          <input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} disabled={pending} defaultValue={email} readOnly className={`${inputClass} read-only:text-(--muted)`} />
        </label>
<p className="-mt-2 text-xs leading-5 text-(--muted)">This invitation is tied to the email address above.</p>
<label htmlFor="password" className="block text-sm font-medium">Password
          <div className="relative">
            <input id="password" name="password" type={visible ? "text" : "password"} required minLength={12} maxLength={256} autoComplete="new-password" disabled={pending} className={`${inputClass} pr-12`} />
            <button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} password`} className="absolute right-1 bottom-0.5 flex size-11 cursor-pointer items-center justify-center rounded-md text-(--muted) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--accent)">
              {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </label>
<p className="-mt-2 text-xs text-(--muted)">At least 12 characters. A unique passphrase works well.</p>
<label htmlFor="confirmation" className="block text-sm font-medium">Confirm password
          <div className="relative">
            <input id="confirmation" name="confirmation" type={confirmVisible ? "text" : "password"} required minLength={12} maxLength={256} autoComplete="new-password" disabled={pending} className={`${inputClass} pr-12`} />
            <button type="button" onClick={() => setConfirmVisible(!confirmVisible)} aria-label={`${confirmVisible ? "Hide" : "Show"} confirmation password`} className="absolute right-1 bottom-0.5 flex size-11 cursor-pointer items-center justify-center rounded-md text-(--muted) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--accent)">
              {confirmVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </label>
{error && <p role="alert" className="rounded-lg border border-(--accent)/30 bg-(--accent)/5 px-3 py-3 text-sm leading-6 text-(--tag-ink)">{error}</p>}
        <button disabled={pending} type="submit" className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-(--button) px-4 text-sm font-semibold text-(--button-ink) transition-colors hover:bg-(--button-hover) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--accent) disabled:cursor-wait disabled:opacity-60">
          {pending && <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {pending ? "Creating your account…" : "Create staff account"}
        </button>
      </form>
      <p className="mt-6 text-xs leading-6 text-(--muted)">Your invitation can be accepted once. Keep the link private.</p>
    </div>
  );
}
