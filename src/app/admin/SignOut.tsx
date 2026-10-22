"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function SignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/admin/login"); router.refresh();
    } catch { setError("Unable to sign out. Please try again."); }
    finally { setPending(false); }
  }
  return <div className="relative"><button type="button" onClick={signOut} disabled={pending} className="min-h-11 cursor-pointer rounded-lg border border-(--line) px-4 text-sm hover:bg-(--hover) disabled:opacity-50">{pending ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="mt-3 text-sm text-(--tag-ink)">{error}</p>}</div>;
}
