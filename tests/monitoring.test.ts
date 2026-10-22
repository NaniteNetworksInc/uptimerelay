import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMonitor, monitorStatus, feedStatus } from "../src/lib/monitoring/config.ts";
import { isPublicAddress, probe } from "../src/lib/monitoring/probe.ts";
const config = { kind: "http", target: "https://example.com/health", port: 443, matches: "", intervalSeconds: 60, timeoutSeconds: 10, failureThreshold: 3, enabled: true };
test("rejects invalid monitor configuration and embedded credentials", () => {
  assert.equal(parseMonitor(config).kind, "http");
  for (const changes of [{ target: "file:///etc/passwd" }, { target: "https://admin:secret@example.com" }, { intervalSeconds: 0 }, { timeoutSeconds: 60 }, { port: 65536 }, { kind: "statuspage", matches: "" }, { enabled: "yes" }]) assert.throws(() => parseMonitor({ ...config, ...changes }));
});
test("rejects local, metadata, private, mapped and reserved IPs", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.100.100.200", "0.0.0.0", "224.0.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2001:db8::1", "2002:7f00:1::"]) assert.equal(isPublicAddress(ip), false, ip);
  for (const ip of ["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"]) assert.equal(isPublicAddress(ip), true, ip);
});
test("blocked destinations never open a connection", async () => {
  const result = await probe(parseMonitor({ ...config, target: "http://127.0.0.1" }));
  assert.match(result.error!, /public network/);
});
test("missing and stale checks are unknown", () => {
  const monitor = { status: "operational", checkedAt: null, intervalSeconds: 60, timeoutSeconds: 10 };
  assert.equal(monitorStatus(monitor), "unknown");
  assert.equal(monitorStatus({ ...monitor, checkedAt: new Date(1000).toISOString() }, 200_000), "unknown");
  assert.equal(monitorStatus({ ...monitor, checkedAt: new Date(1000).toISOString() }, 2000), "operational");
});
test("provider feeds use exact component health and fail closed on missing components", () => {
  const feed = { components: [{ name: "API", status: "operational" }, { name: "CDN", status: "partial_outage" }] };
  assert.equal(feedStatus(feed, "API"), "operational");
  assert.equal(feedStatus(feed, "API, CDN"), "partial_outage");
  assert.throws(() => feedStatus(feed, "Missing"));
  assert.throws(() => feedStatus({}, "API"));
});
