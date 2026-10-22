import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { accountRequest } from "@/lib/auth/account-request";
import { hashPassword, verifyPassword } from "@/lib/auth/crypto";
import { secondFactor } from "@/lib/auth/mfa";
import { sessionCookie } from "@/lib/auth/server";
export async function POST(request: NextRequest) {
  try {
    const access = await accountRequest(request, true); if (access.error) return access.error;
    const body = await request.json();
    if (typeof body.password !== "string" || body.password.length < 12 || body.password.length > 256 || body.password !== body.confirmation || typeof body.currentPassword !== "string" || body.currentPassword.length > 256) return NextResponse.json({ error: "Use a matching new password between 12 and 256 characters." }, { status: 400 });
    const passwordHash = await hashPassword(body.password);
    const success = await access.db.transaction(async tx => {
      const account = await tx.orm.status_page.StaffAccount.where({ id: access.staff.id }).forUpdate().first();
      if (!account || !await verifyPassword(body.currentPassword, account.passwordHash)) return false;
      const factor = secondFactor(account, typeof body.code === "string" ? body.code : ""); if (!factor) return false;
      await tx.orm.status_page.StaffAccount.where({ id: account.id }).update({ passwordHash, ...factor });
      await tx.orm.status_page.StaffSession.where({ staffId: account.id }).delete();
      await tx.orm.status_page.StaffMfaSetup.where({ staffId: account.id }).delete(); return true;
    });
    if (!success) return NextResponse.json({ error: "Your current password or 2FA code was not accepted." }, { status: 400 });
    (await cookies()).delete(sessionCookie); return NextResponse.json({ ok: true, signInAgain: true });
  } catch { return NextResponse.json({ error: "Unable to change password." }, { status: 503 }); }
}
