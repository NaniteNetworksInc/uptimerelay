import { isAllowedOrigin } from "@/lib/auth/origin";
import { NextRequest, NextResponse } from "next/server";
import { authDb, currentStaff } from "@/lib/auth/server";
import { parseIncident } from "@/lib/incidents/shared";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

export async function saveIncident(request: NextRequest, id?: string) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    const staff = await currentStaff();
    if (!staff) return NextResponse.json({ error: "Sign in to manage incidents." }, { status: 401 });
    const body = await request.text();
    if (body.length > 20000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    let input;
    try { input = parseIncident(JSON.parse(body)); } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid incident details." }, { status: 400 });
    }
    const db = await authDb();
    const groups = await db.orm.status_page.ServiceGroup.select("name").all();
    if (input.affectedServices.some(name => !groups.some(group => group.name === name))) return NextResponse.json({ error: "Select valid affected service groups." }, { status: 400 });
    const incidentId = id ?? randomUUID();
    if (!id && !input.message) return NextResponse.json({ error: "Write an initial incident update." }, { status: 400 });
    const result = await db.transaction(async tx => {
      const existing = id ? await tx.orm.status_page.Incident.where({ id }).forUpdate().first() : null;
      if (id && !existing) return "missing";
      if (existing && existing.status !== input.status && !input.message) return "message";
      const { message, ...fields } = input;
      const updatedAt = new Date().toISOString();
      if (existing) await tx.orm.status_page.Incident.where({ id: incidentId }).update({ ...fields, updatedAt });
      else await tx.orm.status_page.Incident.create({ id: incidentId, ...fields, updatedAt, createdBy: staff.id });
      if (message) await tx.orm.status_page.IncidentUpdate.create({ id: randomUUID(), incidentId, message, status: input.status, createdBy: staff.id });
      return "saved";
    });
    if (result === "missing") return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    if (result === "message") return NextResponse.json({ error: "Add an update explaining the status change." }, { status: 400 });
    revalidatePath("/"); revalidatePath("/admin");
    return NextResponse.json({ ok: true, id: incidentId });
  } catch { return NextResponse.json({ error: "Unable to save the incident. Please try again." }, { status: 503 }); }
}
