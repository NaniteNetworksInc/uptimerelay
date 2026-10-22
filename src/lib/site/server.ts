import "server-only";
import { cache } from "react";
import { authDb } from "@/lib/auth/server";
import { defaultSite } from "./shared";
export const getSiteSettings = cache(async () => {
  try { const db = await authDb(); return await db.orm.status_page.SiteSettings.where({ id: "site" }).first() ?? defaultSite; }
  catch { return defaultSite; }
});
export async function installationHasAccounts() {
  const db = await authDb();
  return !!await db.orm.status_page.StaffAccount.select("id").first();
}
