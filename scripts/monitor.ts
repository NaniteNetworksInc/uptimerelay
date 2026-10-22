import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
// Standalone Node scripts need relative imports; Node does not read tsconfig aliases.
import type { Contract } from "../src/prisma/contract.d.ts";
import contractJson from "../src/prisma/contract.json" with { type: "json" };
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { probe } from "../src/lib/monitoring/probe.ts";
import type { MonitorConfig } from "../src/lib/monitoring/config.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = postgres({ contract: contractFromJson<Contract>(contractJson), url: process.env.DATABASE_URL });
let stopping = false;
process.on("SIGTERM", () => { stopping = true; }); process.on("SIGINT", () => { stopping = true; });

async function checkNext() {
  const monitor = await db.transaction(async tx => {
    const row = await tx.orm.status_page.ServiceMonitor.where({ enabled: true }).where(row => row.nextCheckAt.lte(new Date().toISOString())).orderBy(row => row.nextCheckAt.asc()).forUpdate({ skipLocked: true }).first();
    if (!row) return null;
    const lease = new Date(Date.now() + row.timeoutSeconds * 1000 + 60_000).toISOString();
    await tx.orm.status_page.ServiceMonitor.where({ componentId: row.componentId }).update({ nextCheckAt: lease });
    return { ...row, lease };
  });
  if (!monitor) return false;
  const result = await probe(monitor as MonitorConfig);
  await db.transaction(async tx => {
    const current = await tx.orm.status_page.ServiceMonitor.where({ componentId: monitor.componentId }).forUpdate().first();
    if (!current || !current.enabled || current.revision !== monitor.revision || Date.parse(current.nextCheckAt) !== Date.parse(monitor.lease)) return;
    const failures = result.error ? current.failures + 1 : 0;
    // Feed transport failures indicate missing data, not an outage at that provider.
    const status = result.error && monitor.kind !== "statuspage" && failures < monitor.failureThreshold ? current.status : result.status;
    const checkedAt = new Date().toISOString();
    await tx.orm.status_page.ServiceMonitor.where({ componentId: monitor.componentId }).update({ status, failures, checkedAt, latencyMs: result.latencyMs, error: result.error, nextCheckAt: new Date(Date.now() + monitor.intervalSeconds * 1000).toISOString() });
    await tx.orm.status_page.MonitorResult.create({ id: randomUUID(), componentId: monitor.componentId, status: result.status, latencyMs: result.latencyMs, checkedAt });
  });
  console.log(`${monitor.componentId}: ${result.status}${result.error ? " (check failed)" : ""}`);
  return true;
}

async function main() {
  let lastCleanup = 0;
  console.log("UptimeRelay monitoring worker started.");
  while (!stopping) {
    try {
      if (Date.now() - lastCleanup > 3_600_000) {
        await db.orm.status_page.MonitorResult.where(row => row.checkedAt.lt(new Date(Date.now() - 90 * 86_400_000).toISOString())).delete();
        lastCleanup = Date.now();
      }
      const checked = await Promise.all(Array.from({ length: 4 }, () => checkNext()));
      if (process.argv.includes("--once")) break;
      if (!checked.some(Boolean)) await delay(2000);
    } catch (error) {
      console.error("Monitoring cycle failed:", error instanceof Error ? error.message : "Database unavailable.");
      if (process.argv.includes("--once")) throw error;
      await delay(5000);
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.close());
