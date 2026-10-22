import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { currentStaff, authDb } from "@/lib/auth/server";
import { isAllowedOrigin } from "@/lib/auth/origin";
import { componentStatuses, requiredName } from "@/lib/services/shared";
export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    if (!await currentStaff()) return NextResponse.json({ error: "Sign in to manage components." }, { status: 401 });
    const body = await request.json();
    let name;
    try { name = requiredName(body.name); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const db = await authDb();
    if (body.kind === "group") {
      if (typeof body.description !== "string" || body.description.length > 240) return NextResponse.json({ error: "Keep the description under 240 characters." }, { status: 400 });
      if (await db.orm.status_page.ServiceGroup.where({ name }).first()) return NextResponse.json({ error: "A group with this name already exists." }, { status: 409 });
      await db.orm.status_page.ServiceGroup.create({ id: randomUUID(), name, description: body.description.trim() });
    } else if (body.kind === "component") {
      if (!componentStatuses.includes(body.status) || typeof body.groupId !== "string") return NextResponse.json({ error: "Select a valid group and status." }, { status: 400 });
      if (!await db.orm.status_page.ServiceGroup.where({ id: body.groupId }).first()) return NextResponse.json({ error: "Group not found." }, { status: 400 });
      if (await db.orm.status_page.ServiceComponent.where({ groupId: body.groupId, name }).first()) return NextResponse.json({ error: "This group already has a component with that name." }, { status: 409 });
      await db.orm.status_page.ServiceComponent.create({ id: randomUUID(), groupId: body.groupId, name, status: body.status });
    } else return NextResponse.json({ error: "Invalid component request." }, { status: 400 });
    revalidatePath("/"); revalidatePath("/admin/components");
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to save component details." }, { status: 503 }); }
}
