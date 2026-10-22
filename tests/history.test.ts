import assert from "node:assert/strict";
import { test } from "node:test";
import { buildHistory } from "../src/lib/services/history.ts";
test("history keeps unmeasured days unknown and uses UTC date boundaries", () => {
  const days = buildHistory([], Date.parse("2026-10-22T01:00:00Z"));
  assert.equal(days.length, 90); assert.equal(days.at(-1)?.date, "2026-10-22");
  assert.ok(days.every(day => day.status === "unknown" && day.checks === 0));
});
test("history reports the worst measured state and counts check samples accurately", () => {
  const days = buildHistory([
    { componentId: "a", day: "2026-10-22", status: "operational", checks: 98 },
    { componentId: "a", day: "2026-10-22", status: "major_outage", checks: 2 },
    { componentId: "a", day: "2026-10-22", status: "unknown", checks: 5 },
  ], Date.parse("2026-10-22T01:00:00Z"));
  assert.deepEqual(days.at(-1), { date: "2026-10-22", status: "major_outage", checks: 100, successful: 98 });
});
