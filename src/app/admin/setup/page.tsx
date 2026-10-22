import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { installationHasAccounts } from "@/lib/site/server";
import Setup from "./Setup";
export const metadata: Metadata = { title: "Set up your status page" };
async function SetupRoute() {
  if (await installationHasAccounts()) redirect("/admin/login");
  if (!process.env.SETUP_TOKEN || process.env.SETUP_TOKEN.length < 32) return <div className="max-w-md"><h1 className="text-2xl font-semibold">Setup is not enabled</h1><p className="mt-4 text-sm leading-6 text-(--muted)">Ask your server administrator to configure a random SETUP_TOKEN of at least 32 characters, then restart the app.</p></div>;
  return <Setup />;
}
export default function SetupPage() { return <Suspense fallback={<p>Checking installation…</p>}><SetupRoute /></Suspense>; }
