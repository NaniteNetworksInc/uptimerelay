import "dotenv/config";
import { readFile } from "node:fs/promises";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../src/prisma/contract.d.ts";
import contractJson from "../src/prisma/contract.json" with { type: "json" };
import { defaultSite, parseSiteSettings } from "../src/lib/site/shared.ts";

function arg(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
async function main() {
  const name = arg("--name"); const ownerEmail = arg("--owner-email")?.toLowerCase();
  if (!name || !ownerEmail) throw new Error("Usage: yarn site:configure --name 'Organization' --owner-email owner@example.com [--copyright 'Company'] [--logo-file path.png | --logo-path /images/logo.png]");
  const db = postgres({ contract: contractFromJson<Contract>(contractJson), url: process.env.DATABASE_URL! });
  try {
    const existing = await db.orm.status_page.SiteSettings.where({ id: "site" }).first();
    if (existing) throw new Error("Site settings already exist. Use the owner's Settings screen to edit branding.");
    const logoFile = arg("--logo-file"); let logo: string | null = arg("--logo-path") ?? null;
    if (logoFile && logo) throw new Error("Choose either --logo-file or --logo-path.");
    if (logoFile) { const image = await readFile(logoFile); const ext = logoFile.split(".").at(-1)?.toLowerCase(); const mime = ext === "jpg" || ext === "jpeg" ? "jpeg" : ext; logo = `data:image/${mime};base64,${image.toString("base64")}`; }
    const settings = parseSiteSettings({ ...defaultSite, name, copyright: arg("--copyright") ?? name, logo });
    await db.transaction(async tx => {
      const owner = await tx.orm.status_page.StaffAccount.where({ email: ownerEmail }).forUpdate().first();
      if (!owner) throw new Error("The existing staff account was not found. This command does not create accounts or change passwords.");
      await tx.orm.status_page.SiteSettings.create(settings);
      await tx.orm.status_page.StaffAccount.where({ id: owner.id }).update({ role: "owner" });
    });
    console.log("Existing installation configured; services, passwords and sessions were preserved.");
  } finally { await db.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Unable to configure installation."); process.exitCode = 1; });
