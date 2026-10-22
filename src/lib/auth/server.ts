import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { newToken, tokenHash, validToken } from "./crypto";

export const sessionCookie = process.env.NODE_ENV === "production" ? "__Host-uptimerelay-staff" : "uptimerelay-staff";
export async function authDb() {
  // Prisma creates per-query UUIDs; keep all web database work out of prerendering.
  await connection();
  if (!process.env.DATABASE_URL) throw new Error("Staff authentication is not configured.");
  return (await import("@/lib/prisma.client")).prisma;
}
export async function createSession(staffId: string) {
  const db = await authDb();
  const token = newToken();
  await db.orm.status_page.StaffSession.create({ tokenHash: tokenHash(token), staffId, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() });
  await setSessionCookie(token);
}
export async function setSessionCookie(token: string) {
  (await cookies()).set(sessionCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
}
export async function currentStaff() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !validToken(token)) return null;
  const db = await authDb();
  const session = await db.orm.status_page.StaffSession.where({ tokenHash: tokenHash(token) }).first();
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return db.orm.status_page.StaffAccount.select("id", "name", "email", "avatar", "mfaEnabled", "role").where({ id: session.staffId }).first();
}
export async function requireStaff() {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}
export async function requireOwner() {
  const staff = await requireStaff();
  if (staff.role !== "owner") redirect("/admin");
  return staff;
}
export async function findInvite(token: string) {
  if (!validToken(token)) return null;
  const db = await authDb();
  const invite = await db.orm.status_page.StaffInvite.where({ tokenHash: tokenHash(token) }).first();
  return invite && !invite.usedAt && !invite.revokedAt && new Date(invite.expiresAt).getTime() > Date.now() ? invite : null;
}
