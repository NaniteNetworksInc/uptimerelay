import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIncident } from "../src/lib/incidents/shared";
const valid = { title: "Network issue", message: "Investigating connectivity.", severity: "degraded", status: "investigating", affectedServices: ["Test service group"], published: false };
test("incident input trims text and deduplicates known service groups", () => {
  const result = parseIncident({ ...valid, title: " Network issue ", affectedServices: [...valid.affectedServices, ...valid.affectedServices] });
  assert.equal(result.title, "Network issue"); assert.equal(result.affectedServices.length, 1); assert.equal(result.published, false);
});
test("rejects invalid workflow states, severities, and service groups", () => {
  for (const changes of [{ status: "closed" }, { severity: "fine" }, { affectedServices: [""] }, { affectedServices: [] }, { published: "true" }, { title: " " }, { message: "x".repeat(5001) }]) assert.throws(() => parseIncident({ ...valid, ...changes }));
});
