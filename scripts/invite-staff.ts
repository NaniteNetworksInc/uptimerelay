import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../src/prisma/contract.d";
import contractJson from "../src/prisma/contract.json" with { type: "json" };
import { randomUUID } from "node:crypto";
import { newToken, tokenHash } from "../src/lib/auth/crypto";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const base = process.env.APP_URL;
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Usage: yarn staff:invite person@example.com");
  if (!process.env.DATABASE_URL || !base)
    throw new Error("Set DATABASE_URL and APP_URL in .env first.");
  const origin = new URL(base);
  if (
    origin.protocol !== "https:" &&
    !(
      origin.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(origin.hostname)
    )
  )
    throw new Error("APP_URL must use HTTPS outside local development.");
  const db = postgres({
    contract: contractFromJson<Contract>(contractJson),
    url: process.env.DATABASE_URL,
  });
  try {
    if (!await db.orm.status_page.StaffAccount.where({ role: "owner" }).first()) throw new Error("Complete owner setup or configure the existing installation before inviting staff.");
    if (await db.orm.status_page.StaffAccount.where({ email }).first())
      throw new Error("This email already has a staff account.");
    const token = newToken();
    await db.orm.status_page.StaffInvite.create({
      id: randomUUID(),
      email,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    const link = new URL("/admin/register", origin);
    link.searchParams.set("token", token);
    console.log(
      "Single-use invitation, valid for 24 hours. Share privately with the invited staff member:",
    );
    console.log(link.toString());
  } finally {
    await db.close();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unable to create invitation.",
  );
  process.exitCode = 1;
});
