import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../src/prisma/contract.d";
import contractJson from "../src/prisma/contract.json" with { type: "json" };
import serviceGroups from "./data/services.json" with { type: "json" };
import providers from "./data/providers.json" with { type: "json" };
import { randomUUID } from "node:crypto";
async function main() {
 const examples = process.argv.includes("--example"); const external = process.argv.includes("--providers");
 if (!examples && !external) throw new Error("Choose --example for generic sample services or --providers for provider templates. No services were imported.");
 const db = postgres({ contract: contractFromJson<Contract>(contractJson), url: process.env.DATABASE_URL! });
 try {
  for (const entry of examples ? serviceGroups : []) {
   const existing = await db.orm.status_page.ServiceGroup.where({ name: entry.name }).first();
   const group = existing ?? await db.orm.status_page.ServiceGroup.create({ id: randomUUID(), name: entry.name, description: entry.description });
   for (const name of entry.components) if (!await db.orm.status_page.ServiceComponent.where({ groupId: group.id, name }).first()) await db.orm.status_page.ServiceComponent.create({ id: randomUUID(), groupId: group.id, name, status: "operational" });
  }
  if (external) await db.transaction(async tx => {
   const existing = await tx.orm.status_page.ServiceGroup.where({ name: "Third Party" }).first();
   const group = existing ?? await tx.orm.status_page.ServiceGroup.create({ id: randomUUID(), name: "Third Party", description: "External dependencies" });
   const movedGroups: string[] = [];
   for (const entry of providers) {
    const oldGroup = await tx.orm.status_page.ServiceGroup.where({ name: entry.name }).first();
    if (oldGroup) {
     const components = await tx.orm.status_page.ServiceComponent.where({ groupId: oldGroup.id }).all();
     for (const component of components) {
      const name = component.name === entry.name ? entry.name : `${entry.name} · ${component.name}`;
      // Move existing rows so monitor settings and check history retain their IDs.
      const duplicate = await tx.orm.status_page.ServiceComponent.where({ groupId: group.id, name }).first();
      if (duplicate && duplicate.id !== component.id) throw new Error(`Cannot move duplicate component: ${name}. Rename it in the admin panel first.`);
      await tx.orm.status_page.ServiceComponent.where({ id: component.id }).update({ groupId: group.id, name });
     }
     await tx.orm.status_page.ServiceGroup.where({ id: oldGroup.id }).delete();
     movedGroups.push(entry.name);
    }
    for (const item of entry.components) {
     const name = item.name === entry.name ? entry.name : `${entry.name} · ${item.name}`;
     const found = await tx.orm.status_page.ServiceComponent.where({ groupId: group.id, name }).first();
     if (found) continue; // Preserve manual health, monitoring, and external links.
     const component = await tx.orm.status_page.ServiceComponent.create({ id: randomUUID(), groupId: group.id, name, status: "unknown", statusUrl: entry.url });
     if (entry.feed && item.match) await tx.orm.status_page.ServiceMonitor.create({ componentId: component.id, kind: "statuspage", target: entry.feed, matches: item.match, revision: randomUUID() });
    }
   }
   if (movedGroups.length) {
    const incidents = await tx.orm.status_page.Incident.all();
    for (const incident of incidents) {
     if (!incident.affectedServices.some(name => movedGroups.includes(name))) continue;
     const affectedServices = [...new Set(incident.affectedServices.map(name => movedGroups.includes(name) ? group.name : name))];
     await tx.orm.status_page.Incident.where({ id: incident.id }).update({ affectedServices });
    }
   }
  });
  console.log("Existing service groups imported. Existing database entries were preserved.");
 } finally { await db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
