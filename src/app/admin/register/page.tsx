import { Suspense } from "react";
import Link from "next/link";
import { Link2Off } from "lucide-react";
import { findInvite } from "@/lib/auth/server";
import Register from "./Register";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Accept staff invitation" };

async function Registration({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let invite = null;
  let unavailable = false;
  try { invite = token ? await findInvite(token) : null; } catch { unavailable = true; }
  if (!invite) return (
    <div className="w-full max-w-96">
      <Link2Off size={27} className="mb-6 text-(--accent)" aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-tight">{unavailable ? "Unable to check invitation" : "An invitation is required"}</h1>
      <p className="mt-4 text-sm leading-7 text-(--muted)">{unavailable ? "Please try again later or contact your administrator." : "Open the invitation link from your administrator to create your staff account. If your link has expired or was already used, ask for a new one."}</p>
      <Link href="/admin/login" className="mt-7 inline-flex min-h-11 items-center text-sm text-(--tag-ink) underline underline-offset-4">Return to sign in</Link>
    </div>
  );
  return <Register email={invite.email} token={token!} />;
}
export default function RegisterPage(props: { searchParams: Promise<{ token?: string }> }) {
  return <Suspense fallback={<p className="text-sm text-(--muted)">Checking invitation…</p>}><Registration {...props} /></Suspense>;
}
