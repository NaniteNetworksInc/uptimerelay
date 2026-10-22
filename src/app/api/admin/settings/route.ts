import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authDb, currentStaff } from "@/lib/auth/server";
import { isAllowedOrigin } from "@/lib/auth/origin";
import { parseSiteSettings } from "@/lib/site/shared";
import { readSettingsBody } from "@/lib/site/body";
export async function PUT(request: NextRequest) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    const staff = await currentStaff();
    if (!staff) return NextResponse.json({ error: "Sign in to manage settings." }, { status: 401 });
    if (staff.role !== "owner") return NextResponse.json({ error: "Only the owner can manage site settings." }, { status: 403 });
    let settings;
    try { settings = parseSiteSettings(await readSettingsBody(request)); }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const db = await authDb();
    await db.transaction(async tx => {
      const existing = await tx.orm.status_page.SiteSettings.where({ id: "site" }).forUpdate().first();
      if (existing) await tx.orm.status_page.SiteSettings.where({ id: "site" }).update(settings);
      else await tx.orm.status_page.SiteSettings.create(settings);
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to save site settings." }, { status: 503 }); }
}
