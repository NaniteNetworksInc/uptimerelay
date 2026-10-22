import assert from "node:assert/strict";
import { test } from "node:test";
import { Secret } from "otpauth";
import { encryptMfa, decryptMfa, authenticator, totpStep, recoveryCodes, recoveryHash, secondFactor } from "../src/lib/auth/mfa";
import { normalizeInviteEmail, inviteState } from "../src/lib/staff/shared";
process.env.AUTH_ENCRYPTION_KEY = "ab".repeat(32);
test("MFA encryption authenticates ciphertext and binds it to the staff account", () => {
 const encrypted = encryptMfa("secret", "staff-a"); assert.equal(decryptMfa(encrypted, "staff-a"), "secret"); assert.throws(() => decryptMfa(encrypted, "staff-b"));
 const parts = encrypted.split(":"); parts[2] = (parts[2][0] === "0" ? "1" : "0") + parts[2].slice(1); assert.throws(() => decryptMfa(parts.join(":"), "staff-a"));
});
test("TOTP verifies correct codes and rejects replay, invalid, and expired codes", () => {
 const secret = new Secret({ size: 20 }).base32; const now = 1800000000000; const code = authenticator(secret).generate({ timestamp: now }); const step = totpStep(secret, code, -1, now);
 assert.equal(step, Math.floor(now / 30000)); assert.equal(totpStep(secret, code, step!, now), null); assert.equal(totpStep(secret, code, -1, now + 120000), null); assert.equal(totpStep(secret, "abc", -1, now), null);
});
test("recovery codes are normalized, hashed, and removed after use", () => {
 const codes = recoveryCodes(); assert.equal(new Set(codes).size, 10); const hashes = codes.map(recoveryHash);
 const account = { id: "a", mfaEnabled: true, mfaSecret: null, mfaLastStep: -1, mfaRecoveryHashes: hashes };
 const result = secondFactor(account, codes[0].toUpperCase()); assert.ok(result && "mfaRecoveryHashes" in result); assert.equal(result.mfaRecoveryHashes?.length, 9);
 assert.equal(secondFactor({ ...account, mfaRecoveryHashes: result.mfaRecoveryHashes! }, codes[0]), null);
});
test("invitation status rejects expired and revoked links; emails are normalized", () => {
 assert.equal(normalizeInviteEmail(" Person@Example.com "), "person@example.com"); assert.throws(() => normalizeInviteEmail("bad"));
 const invite = { usedAt: null, revokedAt: null, expiresAt: new Date(100000).toISOString() };
 assert.equal(inviteState(invite, 0), "Pending"); assert.equal(inviteState(invite, 100000), "Expired"); assert.equal(inviteState({ ...invite, revokedAt: "date" }, 0), "Revoked"); assert.equal(inviteState({ ...invite, usedAt: "date" }, 0), "Accepted");
});
