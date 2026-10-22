import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Secret } from "otpauth";
import QRCode from "qrcode";
import { getSiteSettings } from "@/lib/site/server";
import { accountRequest } from "@/lib/auth/account-request";
import { verifyPassword, newToken, tokenHash } from "@/lib/auth/crypto";
import { authenticator, encryptMfa, decryptMfa, totpStep, recoveryCodes, recoveryHash, secondFactor, mfaConfigured } from "@/lib/auth/mfa";
import { sessionCookie, setSessionCookie } from "@/lib/auth/server";
export async function POST(request: NextRequest) {
  try {
    const access = await accountRequest(request, true); if (access.error) return access.error;
    if (!mfaConfigured()) return NextResponse.json({ error: "2FA is not configured on the server yet. Ask your administrator to set AUTH_ENCRYPTION_KEY." }, { status: 503 });
    const body = await request.json();
    if (!["setup", "enable", "disable"].includes(body.action) || typeof body.password !== "string" || body.password.length > 256) return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
    const session = (await cookies()).get(sessionCookie)?.value;
    if (!session) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
    const replacement = newToken();
    const result = await access.db.transaction(async tx => {
      const account = await tx.orm.status_page.StaffAccount.where({ id: access.staff.id }).forUpdate().first();
      if (!account || !await verifyPassword(body.password, account.passwordHash)) return { error: "Your current password was not accepted." };
      if (body.action === "setup") {
        if (account.mfaEnabled) return { error: "Two-factor authentication is already enabled." };
        const secret = new Secret({ size: 20 }).base32;
        await tx.orm.status_page.StaffMfaSetup.where({ staffId: account.id }).delete();
        await tx.orm.status_page.StaffMfaSetup.create({ staffId: account.id, encryptedSecret: encryptMfa(secret, account.id), sessionHash: tokenHash(session), expiresAt: new Date(Date.now() + 600000).toISOString() });
        return { secret };
      }
      let codes: string[] = [];
      if (body.action === "enable") {
        if (account.mfaEnabled) return { error: "Two-factor authentication is already enabled." };
        const setup = await tx.orm.status_page.StaffMfaSetup.where({ staffId: account.id }).first();
        if (!setup || setup.sessionHash !== tokenHash(session) || new Date(setup.expiresAt).getTime() <= Date.now()) return { error: "Setup expired. Start again." };
        const step = totpStep(decryptMfa(setup.encryptedSecret, account.id), String(body.code ?? ""), -1);
        if (step === null) return { error: "The authenticator code was not accepted." };
        codes = recoveryCodes();
        await tx.orm.status_page.StaffAccount.where({ id: account.id }).update({ mfaEnabled: true, mfaSecret: setup.encryptedSecret, mfaLastStep: step, mfaRecoveryHashes: codes.map(recoveryHash) });
      } else {
        if (!account.mfaEnabled || !secondFactor(account, String(body.code ?? ""))) return { error: "The authenticator or recovery code was not accepted." };
        await tx.orm.status_page.StaffAccount.where({ id: account.id }).update({ mfaEnabled: false, mfaSecret: null, mfaLastStep: -1, mfaRecoveryHashes: [] });
      }
      await tx.orm.status_page.StaffMfaSetup.where({ staffId: account.id }).delete();
      await tx.orm.status_page.StaffSession.where({ staffId: account.id }).delete();
      await tx.orm.status_page.StaffSession.create({ tokenHash: tokenHash(replacement), staffId: account.id, expiresAt: new Date(Date.now() + 28800000).toISOString() });
      return { codes };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    if ("secret" in result && result.secret) {
      const uri = authenticator(result.secret, access.staff.email, (await getSiteSettings()).name).toString();
      return NextResponse.json({ ok: true, secret: result.secret, qr: await QRCode.toDataURL(uri, { width: 224, margin: 2 }) }, { headers: { "Cache-Control": "no-store" } });
    }
    await setSessionCookie(replacement); revalidatePath("/admin", "layout");
    return NextResponse.json({ ok: true, recoveryCodes: "codes" in result ? result.codes : [] }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to update 2FA. Please try again." }, { status: 503 }); }
}
