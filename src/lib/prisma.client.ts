import "server-only";

import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";

import type { Contract } from "@/prisma/contract.d";
import contractJson from "@/prisma/contract.json" with { type: "json" };

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

export const contract = contractFromJson<Contract>(contractJson);

export const prisma = postgres({
  contract,
  url: databaseUrl,
});


