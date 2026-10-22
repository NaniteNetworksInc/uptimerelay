import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSite, parseSiteSettings, validSetupToken, siteImage } from "../src/lib/site/shared.ts";
import { buttonInk } from "../src/lib/site/colors.ts";
import { readSettingsBody } from "../src/lib/site/body.ts";
test("branding defaults are generic and accept organization customization", () => {
  const site = parseSiteSettings({ ...defaultSite, name: " Example Hosting ", accent: "#1255FF" });
  assert.equal(site.name, "Example Hosting"); assert.equal(site.accent, "#1255ff");
  assert.ok(!JSON.stringify(defaultSite).match(/nanite|blitznode/i));
});
test("branding rejects CSS injection, unsafe images and blank names", () => {
  for (const data of [{ accent: "red;display:none" }, { buttonColor: "#fff" }, { name: " " }, { logo: "https://example.com/image.png" }, { logo: "//example.com/image.png" }, { favicon: "data:image/svg+xml,<svg/>" }, { logo: "data:image/png;base64,ZmFrZQ==" }, { logo: "/../private.png" }]) assert.throws(() => parseSiteSettings({ ...defaultSite, ...data }));
  assert.equal(siteImage("/images/brand-logo.png"), "/images/brand-logo.png");
});
test("setup requires a configured strong token and exact match", () => {
  const token = "a".repeat(64);
  assert.equal(validSetupToken(token, token), true);
  assert.equal(validSetupToken("b".repeat(64), token), false);
  assert.equal(validSetupToken("short", "short"), false);
  assert.equal(validSetupToken(null, token), false);
  assert.equal(validSetupToken(token, ""), false);
});
test("button text switches for light and dark colors", () => {
  assert.equal(buttonInk("#ffffff"), "#000000"); assert.equal(buttonInk("#000000"), "#ffffff"); assert.equal(buttonInk("#b52839"), "#ffffff");
});
test("settings requests enforce a streaming body limit", async () => {
  const valid = new Request("https://example.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Test" }) });
  assert.deepEqual(await readSettingsBody(valid), { name: "Test" });
  const large = new Request("https://example.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "x".repeat(100) }) });
  await assert.rejects(readSettingsBody(large, 20), /too large/);
});
