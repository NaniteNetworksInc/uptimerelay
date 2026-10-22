import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { currentStaff, authDb } from "@/lib/auth/server";
import { isAllowedOrigin } from "@/lib/auth/origin";
import { componentStatuses, requiredName, statusLink } from "@/lib/services/shared";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    if (!await currentStaff()) return NextResponse.json({ error: "Sign in to manage components." }, { status: 401 });
    const body = await request.json();
    let name; let statusUrl;
    try { name = requiredName(body.name); statusUrl = statusLink(body.statusUrl); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    if (!componentStatuses.includes(body.status) || typeof body.enabled !== "boolean") return NextResponse.json({ error: "Select a valid status and visibility." }, { status: 400 });
    const db = await authDb(); const { id } = await params;
    const existing = await db.orm.status_page.ServiceComponent.where({ id }).first();
    if (!existing) return NextResponse.json({ error: "Component not found." }, { status: 404 });
    const groupId = body.groupId ?? existing.groupId;
    if (typeof groupId !== "string" || !await db.orm.status_page.ServiceGroup.where({ id: groupId }).first()) return NextResponse.json({ error: "Select an existing service group." }, { status: 400 });
    if (body.showUptime !== undefined && typeof body.showUptime !== "boolean") return NextResponse.json({ error: "Invalid history preference." }, { status: 400 });
    const duplicate = await db.orm.status_page.ServiceComponent.where({ groupId, name }).first();
    if (duplicate && duplicate.id !== id) return NextResponse.json({ error: "This group already has a component with that name." }, { status: 409 });
    await db.orm.status_page.ServiceComponent.where({ id }).update({ groupId, name, status: body.status, enabled: body.enabled, statusUrl, showUptime: body.showUptime ?? existing.showUptime });
    revalidatePath("/"); revalidatePath("/admin/components");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to update component." }, { status: 503 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    if (!await currentStaff()) return NextResponse.json({ error: "Sign in to manage components." }, { status: 401 });
    const db = await authDb(); const { id } = await params;
    const found = await db.transaction(async tx => {
      const component = await tx.orm.status_page.ServiceComponent.where({ id }).forUpdate().first();
      if (!component) return false;
      await tx.orm.status_page.ServiceMonitor.where({ componentId: id }).delete();
      await tx.orm.status_page.MonitorResult.where({ componentId: id }).delete();
      await tx.orm.status_page.ServiceComponent.where({ id }).delete();
      return true;
    });
    if (!found) return NextResponse.json({ error: "Component not found." }, { status: 404 });
    revalidatePath("/"); revalidatePath("/admin/components");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to delete component." }, { status: 503 }); }
}
