import { Suspense } from "react";
import type { Metadata } from "next";
import { authDb, requireOwner } from "@/lib/auth/server";
import { inviteState } from "@/lib/staff/shared";
import Staff from "./Staff";
export const metadata: Metadata = { title: "Staff invitations" };
async function StaffRoute() {
  await requireOwner(); const db = await authDb();
  const accounts = await db.orm.status_page.StaffAccount.select("id", "name", "email").orderBy(row => row.createdAt.asc()).all();
  const rows = await db.orm.status_page.StaffInvite.select("id", "email", "expiresAt", "usedAt", "revokedAt").orderBy(row => row.createdAt.desc()).limit(100).all();
  const invites = rows.map(row => ({ id: row.id, email: row.email, expiresAt: row.expiresAt, state: inviteState(row) }));
  return <Staff accounts={accounts} invites={invites} />;
}
export default function StaffPage() { return <Suspense fallback={<p>Loading staff…</p>}><StaffRoute /></Suspense>; }
