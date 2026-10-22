import { Suspense } from "react";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { listIncidents } from "@/lib/incidents/server";
import Dashboard from "./Dashboard";
export const metadata: Metadata = { title: "Incidents" };
async function Workspace() { await requireStaff(); return <Dashboard incidents={await listIncidents()} />; }
export default function AdminPage() { return <Suspense fallback={<p>Loading incidents…</p>}><Workspace /></Suspense>; }
