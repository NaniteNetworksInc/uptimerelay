import { getServiceGroups } from "@/lib/services/server";
import { Suspense } from "react";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import IncidentEditor from "../IncidentEditor";
export const metadata: Metadata = { title: "Create incident" };
async function NewIncident() { await requireStaff(); return <IncidentEditor groups={await getServiceGroups()} />; }
export default function NewIncidentPage() { return <Suspense fallback={<p>Loading editor…</p>}><NewIncident /></Suspense>; }
