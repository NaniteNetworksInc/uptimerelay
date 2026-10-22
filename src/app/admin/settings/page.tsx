import { Suspense } from "react";
import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth/server";
import { getSiteSettings } from "@/lib/site/server";
import Settings from "./Settings";
export const metadata: Metadata = { title: "Site settings" };
async function SettingsRoute() { await requireOwner(); return <Settings settings={await getSiteSettings()} publicUrl={process.env.APP_URL ?? ""} />; }
export default function SettingsPage() { return <Suspense fallback={<p>Loading settings…</p>}><SettingsRoute /></Suspense>; }
