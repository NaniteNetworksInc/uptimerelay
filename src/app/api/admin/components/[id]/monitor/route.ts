import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { authDb, currentStaff } from "@/lib/auth/server";
import { isAllowedOrigin } from "@/lib/auth/origin";
import { parseMonitor } from "@/lib/monitoring/config";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  if (!await currentStaff()) return NextResponse.json({ error: "Sign in to manage monitoring." }, { status: 401 });
  let config;
  try { config = parseMonitor(await request.json()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid monitor." }, { status: 400 }); }
  try {
    const db = await authDb(); const { id } = await params;
    const component = await db.orm.status_page.ServiceComponent.where({ id }).first();
    if (!component) return NextResponse.json({ error: "Component not found." }, { status: 404 });
    await db.transaction(async tx => {
      // Serialize creation and updates for this component.
      await tx.orm.status_page.ServiceComponent.where({ id }).forUpdate().first();
      const existing = await tx.orm.status_page.ServiceMonitor.where({ componentId: id }).first();
      const data = { ...config, revision: randomUUID(), status: "unknown", checkedAt: null, latencyMs: null, error: null, failures: 0, nextCheckAt: new Date().toISOString() };
      if (existing) await tx.orm.status_page.ServiceMonitor.where({ componentId: id }).update(data);
      else await tx.orm.status_page.ServiceMonitor.create({ componentId: id, ...data });
    });
    revalidatePath("/"); revalidatePath("/admin/components");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to save monitor configuration." }, { status: 503 }); }
}
