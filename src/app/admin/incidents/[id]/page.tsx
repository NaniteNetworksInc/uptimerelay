import { getServiceGroups } from "@/lib/services/server";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/server";
import { incidentDetail } from "@/lib/incidents/server";
import IncidentEditor from "../IncidentEditor";
export const metadata: Metadata = { title: "Manage incident" };
async function EditIncident({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const detail = await incidentDetail((await params).id);
  if (!detail) notFound();
  return <IncidentEditor {...detail} groups={await getServiceGroups()} />;
}
export default function IncidentPage(props: { params: Promise<{ id: string }> }) { return <Suspense fallback={<p>Loading incident…</p>}><EditIncident {...props} /></Suspense>; }
