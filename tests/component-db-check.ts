import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../src/prisma/contract.d";
import contractJson from "../src/prisma/contract.json" with { type: "json" };
import { readDailyHistory } from "../src/lib/services/history-query";
const db = postgres({ contract: contractFromJson<Contract>(contractJson), url: process.env.DATABASE_URL! });
const rollback = new Error("rollback-test");
async function main() {
try {
  await db.transaction(async tx => {
    const group = await tx.orm.status_page.ServiceGroup.create({ id: randomUUID(), name: `test-${randomUUID()}`, description: "Temporary rollback test" });
    const componentId = randomUUID();
    await tx.orm.status_page.ServiceComponent.create({ id: componentId, groupId: group.id, name: "History check", showUptime: true });
    await tx.orm.status_page.MonitorResult.create({ id: randomUUID(), componentId, status: "operational", latencyMs: 25 });
    await tx.orm.status_page.MonitorResult.create({ id: randomUUID(), componentId, status: "major_outage", latencyMs: 100 });
    const rows = (await readDailyHistory(tx)).filter(row => row.componentId === componentId);
    assert.equal(rows.length, 2);
    assert.equal(rows.reduce((sum, row) => sum + row.checks, 0), 2);
    assert.ok(rows.every(row => row.day === new Date().toISOString().slice(0, 10)));
    throw rollback;
  });
} catch (error) { if (error !== rollback) throw error; }
finally { await db.close(); }
console.log("Daily history query passed; temporary records rolled back.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
