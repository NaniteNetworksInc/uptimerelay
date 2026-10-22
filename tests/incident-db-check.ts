import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../src/prisma/contract.d";
import contractJson from "../src/prisma/contract.json" with { type: "json" };
const db = postgres({ contract: contractFromJson<Contract>(contractJson), url: process.env.DATABASE_URL! });
const id = randomUUID();
const rollback = new Error("Intentional test rollback");
async function main() {
try {
  try {
    await db.transaction(async tx => {
      await tx.orm.status_page.Incident.create({ id, title: "Rollback-only integration check", severity: "degraded", status: "investigating", affectedServices: ["Chicago, Illinois Data Center"], published: false, createdBy: "integration-test", updatedAt: new Date().toISOString() });
      await tx.orm.status_page.IncidentUpdate.create({ id: randomUUID(), incidentId: id, message: "Initial update", status: "investigating", createdBy: "integration-test" });
      const incident = await tx.orm.status_page.Incident.where({ id }).forUpdate().first();
      assert.equal(incident?.published, false);
      assert.deepEqual(incident?.affectedServices, ["Chicago, Illinois Data Center"]);
      await tx.orm.status_page.Incident.where({ id }).update({ status: "resolved", updatedAt: new Date().toISOString() });
      const resolved = await tx.orm.status_page.Incident.where({ id }).first();
      assert.equal(resolved?.status, "resolved");
      assert.equal((await tx.orm.status_page.IncidentUpdate.where({ incidentId: id }).all()).length, 1);
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await db.orm.status_page.Incident.where({ id }).first(), null);
  assert.equal((await db.orm.status_page.IncidentUpdate.where({ incidentId: id }).all()).length, 0);
  console.log("Incident create/read/update and transaction rollback passed. No test records persisted.");
} finally { await db.close(); }

}
main().catch(error => { console.error(error); process.exitCode = 1; });
