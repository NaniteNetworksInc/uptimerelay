import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import { tokenHash } from "./crypto";
export function mfaConfigured() { return /^[a-f0-9]{64}$/i.test(process.env.AUTH_ENCRYPTION_KEY ?? ""); }
function key() { if (!mfaConfigured()) throw new Error("Configure AUTH_ENCRYPTION_KEY for 2FA."); return Buffer.from(process.env.AUTH_ENCRYPTION_KEY!, "hex"); }
export function encryptMfa(secret: string, staffId: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv); cipher.setAAD(Buffer.from(staffId));
  const data = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(part => part.toString("hex")).join(":");
}
export function decryptMfa(encrypted: string, staffId: string) {
  const [iv, tag, data] = encrypted.split(":").map(part => Buffer.from(part, "hex"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv); decipher.setAAD(Buffer.from(staffId)); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
export function authenticator(secret: string, email = "Staff", issuer = "UptimeRelay") { return new TOTP({ issuer, label: email, algorithm: "SHA1", digits: 6, period: 30, secret: Secret.fromBase32(secret) }); }
export function totpStep(secret: string, code: string, lastStep: number, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const delta = authenticator(secret).validate({ token: code, window: 1, timestamp: now });
  if (delta === null) return null;
  const step = Math.floor(now / 30000) + delta; return step > lastStep ? step : null;
}
export function recoveryHash(code: string) { return tokenHash(code.replace(/[\s-]/g, "").toLowerCase()); }
export function recoveryCodes() { return Array.from({ length: 10 }, () => randomBytes(10).toString("hex").match(/.{1,5}/g)!.join("-")); }
export function secondFactor(account: { id: string; mfaEnabled: boolean; mfaSecret: string | null; mfaLastStep: number; mfaRecoveryHashes: readonly string[] }, code: string) {
  if (!account.mfaEnabled) return {};
  const hash = recoveryHash(code);
  if (account.mfaRecoveryHashes.includes(hash)) return { mfaRecoveryHashes: account.mfaRecoveryHashes.filter(item => item !== hash) };
  if (!account.mfaSecret) return null;
  const step = totpStep(decryptMfa(account.mfaSecret, account.id), code.trim(), account.mfaLastStep);
  return step === null ? null : { mfaLastStep: step };
}
