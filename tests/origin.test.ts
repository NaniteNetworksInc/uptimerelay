import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedOrigin } from "../src/lib/auth/origin";
const publicUrl = "https://status.example.com";
const request = (origin?: string, forwarded?: string) => ({ url: "http://0.0.0.0:5678/api/auth/login", headers: new Headers({ ...(origin ? { origin } : {}), ...(forwarded ? { "x-forwarded-host": forwarded } : {}) }) });
test("accepts the configured HTTPS origin behind an internal HTTP proxy", () => {
  assert.equal(isAllowedOrigin(request(publicUrl), publicUrl, true), true);
  assert.equal(isAllowedOrigin(request(publicUrl), `${publicUrl}/`, true), true);
});
test("rejects cross-origin, missing, opaque, and forged forwarding origins", () => {
  for (const origin of [undefined, "null", "https://evil.example", "http://status.example.com", "https://status.example.com.evil.example", `${publicUrl}/path`]) assert.equal(isAllowedOrigin(request(origin), publicUrl, true), false);
  assert.equal(isAllowedOrigin(request("https://evil.example", "evil.example"), publicUrl, true), false);
});
test("fails closed on missing or invalid production configuration", () => {
  assert.equal(isAllowedOrigin(request(publicUrl), "", true), false);
  assert.equal(isAllowedOrigin(request(publicUrl), "not a URL", true), false);
});
test("development falls back to the actual request origin", () => {
  const local = { url: "http://localhost:3000/api/auth/login", headers: new Headers({ origin: "http://localhost:3000" }) };
  assert.equal(isAllowedOrigin(local, "", false), true);
  assert.equal(isAllowedOrigin(request(publicUrl), "", false), false);
});
