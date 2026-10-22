export function normalizeInviteEmail(value: unknown) {
  if (typeof value !== "string") throw new Error("Enter a valid email address.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  return email;
}
export function inviteState(invite: { usedAt: string | null; revokedAt: string | null; expiresAt: string }, now = Date.now()) {
  if (invite.usedAt) return "Accepted";
  if (invite.revokedAt) return "Revoked";
  return new Date(invite.expiresAt).getTime() <= now ? "Expired" : "Pending";
}
