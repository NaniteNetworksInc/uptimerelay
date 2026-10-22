import "server-only";
import { secondFactor } from "./mfa";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { authDb, sessionCookie, setSessionCookie } from "@/lib/auth/server";
import { hashPassword, newToken, tokenHash, validToken, verifyPassword } from "@/lib/auth/crypto";

export type AuthState = { error: string };
const failed = "Sign-in failed. Check your email and password, or try again later.";
const unavailable = "Staff sign-in is temporarily unavailable. Please contact your administrator.";
const field = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)) : "";

export async function allowLogin(email: string) {
  const db = await authDb();
  const id = tokenHash(`${email}:${Math.floor(Date.now() / 900000)}`);
  // A unique row plus a row lock keeps attempts consistent across app replicas.
  try { await db.orm.status_page.StaffLoginThrottle.create({ id, attempts: 0 }); } catch {
    if (!await db.orm.status_page.StaffLoginThrottle.where({ id }).first()) throw new Error("Throttle unavailable");
  }
  return db.transaction(async tx => {
    const row = await tx.orm.status_page.StaffLoginThrottle.where({ id }).forUpdate().first();
    if (!row || row.attempts >= 5) return false;
    await tx.orm.status_page.StaffLoginThrottle.where({ id }).update({ attempts: row.attempts + 1 });
    return true;
  });
}

export async function login(_state: AuthState, data: FormData): Promise<AuthState | { ok: true }> {
  const email = field(data, "email").trim().toLowerCase();
  const password = field(data, "password");
  if (!email || email.length > 254 || !password || password.length > 256) return { error: failed };
  try {
    if (!await allowLogin(email)) return { error: failed };
    const db = await authDb();
    const sessionToken = newToken();
    const success = await db.transaction(async tx => {
      const staff = await tx.orm.status_page.StaffAccount.where({ email }).forUpdate().first();
      const fallback = `scrypt:00000000000000000000000000000000:${"0".repeat(128)}`;
      const valid = await verifyPassword(password, staff?.passwordHash ?? fallback);
      if (!staff || !valid) return false;
      const factor = secondFactor(staff, field(data, "code"));
      if (!factor) return false;
      if (Object.keys(factor).length) await tx.orm.status_page.StaffAccount.where({ id: staff.id }).update(factor);
      await tx.orm.status_page.StaffSession.create({ tokenHash: tokenHash(sessionToken), staffId: staff.id, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() });
      return true;
    });
    if (!success) return { error: "Sign-in failed. Check your email, password, and 2FA or recovery code." };
    await setSessionCookie(sessionToken);
  } catch { return { error: unavailable }; }
  return { ok: true };
}

export async function register(_state: AuthState, data: FormData): Promise<AuthState | { ok: true }> {
  const token = field(data, "token");
  const name = field(data, "name").trim();
  const password = field(data, "password");
  if (!validToken(token)) return { error: "This invitation is invalid. Ask your administrator for a new link." };
  if (!name || name.length > 100) return { error: "Enter a name between 1 and 100 characters." };
  if (password.length < 12 || password.length > 256) return { error: "Use a password between 12 and 256 characters." };
  if (password !== field(data, "confirmation")) return { error: "The passwords do not match." };
  const hash = await hashPassword(password);
  const sessionToken = newToken();
  try {
    const db = await authDb();
    await db.transaction(async tx => {
      const invite = await tx.orm.status_page.StaffInvite.where({ tokenHash: tokenHash(token) }).forUpdate().first();
      if (!invite || invite.usedAt || invite.revokedAt || new Date(invite.expiresAt).getTime() <= Date.now()) throw new Error("Invalid invitation");
      const staff = await tx.orm.status_page.StaffAccount.create({ id: randomUUID(), email: invite.email, name, passwordHash: hash });
      await tx.orm.status_page.StaffInvite.where({ id: invite.id }).update({ usedAt: new Date().toISOString() });
      await tx.orm.status_page.StaffSession.create({ tokenHash: tokenHash(sessionToken), staffId: staff.id, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() });
    });
    await setSessionCookie(sessionToken);
  } catch { return { error: "Unable to accept this invitation. It may have expired or already been used. Ask your administrator for a new link." }; }
  return { ok: true };
}

export async function logout() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (token && validToken(token)) {
    const db = await authDb();
    await db.orm.status_page.StaffSession.where({ tokenHash: tokenHash(token) }).delete();
  }
  (await cookies()).delete(sessionCookie);
  return { ok: true };
}
