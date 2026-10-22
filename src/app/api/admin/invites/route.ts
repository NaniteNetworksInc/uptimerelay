import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { currentStaff, authDb } from "@/lib/auth/server";
import { isAllowedOrigin } from "@/lib/auth/origin";
import { newToken, tokenHash } from "@/lib/auth/crypto";
import { normalizeInviteEmail } from "@/lib/staff/shared";
export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    const staff = await currentStaff();
    if (!staff) return NextResponse.json({ error: "Sign in to invite staff." }, { status: 401 });
    if (staff.role !== "owner") return NextResponse.json({ error: "Only the owner can invite staff." }, { status: 403 });
    let email;
    try { email = normalizeInviteEmail((await request.json()).email); } catch { return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 }); }
    const db = await authDb();
    if (await db.orm.status_page.StaffAccount.where({ email }).first()) return NextResponse.json({ error: "This email already has a staff account." }, { status: 409 });
    const token = newToken();
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    await db.orm.status_page.StaffInvite.create({ id: randomUUID(), email, tokenHash: tokenHash(token), expiresAt, invitedBy: staff.id });
    const link = new URL("/admin/register", process.env.APP_URL || request.url);
    link.searchParams.set("token", token);
    revalidatePath("/admin/staff");
    return NextResponse.json({ ok: true, url: link.toString(), expiresAt }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to create an invitation. Please try again." }, { status: 503 }); }
}
