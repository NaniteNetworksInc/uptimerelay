import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { authDb, setSessionCookie } from "@/lib/auth/server";
import { hashPassword, newToken, tokenHash } from "@/lib/auth/crypto";
import { allowLogin } from "@/lib/auth/handlers";
import { isAllowedOrigin } from "@/lib/auth/origin";
import { defaultSite, parseSiteSettings, validSetupToken } from "@/lib/site/shared";
import { readSettingsBody } from "@/lib/site/body";
import { normalizeInviteEmail } from "@/lib/staff/shared";
export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  try {
    const db = await authDb();
    if (await db.orm.status_page.StaffAccount.select("id").first()) return NextResponse.json({ error: "Setup is already complete. Sign in instead." }, { status: 409 });
    if (!await allowLogin("installation-setup")) return NextResponse.json({ error: "Too many setup attempts. Try again in 15 minutes." }, { status: 429 });
    let body;
    try { body = await readSettingsBody(request, 16_384); } catch { return NextResponse.json({ error: "Invalid setup request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid setup request." }, { status: 400 });
    if (!validSetupToken(body.token)) return NextResponse.json({ error: "The setup token was not accepted. Check the server configuration." }, { status: 403 });
    let email; let settings;
    try { email = normalizeInviteEmail(body.email); settings = parseSiteSettings({ ...defaultSite, name: body.siteName, copyright: body.siteName }); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100 || typeof body.password !== "string" || body.password.length < 12 || body.password.length > 256 || body.password !== body.confirmation) return NextResponse.json({ error: "Enter your name and matching passwords of 12–256 characters." }, { status: 400 });
    const passwordHash = await hashPassword(body.password); const session = newToken();
    await db.transaction(async tx => {
      // The singleton row serializes competing setup requests, including an empty DB.
      const existing = await tx.orm.status_page.SiteSettings.where({ id: "site" }).forUpdate().first();
      if (!existing) await tx.orm.status_page.SiteSettings.create(settings);
      if (await tx.orm.status_page.StaffAccount.select("id").first()) throw new Error("Setup already complete.");
      if (existing) await tx.orm.status_page.SiteSettings.where({ id: "site" }).update(settings);
      const staff = await tx.orm.status_page.StaffAccount.create({ id: randomUUID(), name: body.name.trim(), email, passwordHash, role: "owner" });
      await tx.orm.status_page.StaffSession.create({ tokenHash: tokenHash(session), staffId: staff.id, expiresAt: new Date(Date.now() + 28_800_000).toISOString() });
    });
    await setSessionCookie(session); revalidatePath("/", "layout");
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Setup could not finish. It may already be complete; try signing in." }, { status: 409 }); }
}
