import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authDb, currentStaff } from "@/lib/auth/server";
import { isAllowedOrigin } from "@/lib/auth/origin";
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    const staff = await currentStaff();
    if (!staff) return NextResponse.json({ error: "Sign in to revoke invitations." }, { status: 401 });
    if (staff.role !== "owner") return NextResponse.json({ error: "Only the owner can revoke invitations." }, { status: 403 });
    const { id } = await params;
    const db = await authDb();
    const result = await db.transaction(async tx => {
      const invite = await tx.orm.status_page.StaffInvite.where({ id }).forUpdate().first();
      if (!invite) return false;
      if (!invite.usedAt && !invite.revokedAt) await tx.orm.status_page.StaffInvite.where({ id }).update({ revokedAt: new Date().toISOString() });
      return true;
    });
    if (!result) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    revalidatePath("/admin/staff");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to revoke invitation." }, { status: 503 }); }
}
