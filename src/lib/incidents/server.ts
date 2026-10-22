import "server-only";
import { connection } from "next/server";
import { authDb } from "@/lib/auth/server";
export async function listIncidents(publicOnly = false) {
  await connection();
  const db = await authDb();
  const collection = publicOnly ? db.orm.status_page.Incident.where({ published: true }) : db.orm.status_page.Incident;
  const ordered = collection.orderBy(row => row.updatedAt.desc());
  return publicOnly ? ordered.all() : ordered.limit(100).all();
}
export async function incidentDetail(id: string) {
  const db = await authDb();
  const incident = await db.orm.status_page.Incident.where({ id }).first();
  if (!incident) return null;
  const updates = await db.orm.status_page.IncidentUpdate.where({ incidentId: id }).orderBy(row => row.createdAt.desc()).all();
  return { incident, updates };
}
