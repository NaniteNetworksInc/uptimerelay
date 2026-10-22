import { createHash, timingSafeEqual } from "node:crypto";
export const defaultSite = { id: "site", name: "UptimeRelay", description: "Service health, incident updates, and scheduled maintenance.", copyright: "UptimeRelay", logo: null as string | null, favicon: null as string | null, accent: "#ff555f", buttonColor: "#b52839" };
export type SiteSettings = typeof defaultSite;
export function parseSiteSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") throw new Error("Invalid site settings.");
  const data = value as Record<string, unknown>;
  function text(key: string, max: number) { const value = data[key]; if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`${key} must contain 1–${max} characters.`); return value.trim(); }
  function color(key: string) { const value = data[key]; if (typeof value !== "string" || !/^#[a-f\d]{6}$/i.test(value)) throw new Error("Choose six-digit hex colors."); return value.toLowerCase(); }
  return { id: "site", name: text("name", 100), description: text("description", 300), copyright: text("copyright", 120), logo: siteImage(data.logo), favicon: siteImage(data.favicon), accent: color("accent"), buttonColor: color("buttonColor") };
}
export function siteImage(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Choose a PNG, JPEG, or WebP image.");
  if (/^\/[a-zA-Z0-9_/-]+\.(png|jpe?g|webp)$/i.test(value) && !value.includes("..")) return value;
  const match = /^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(value);
  if (!match || value.length > 700_000) throw new Error("Images must be PNG, JPEG, or WebP and under 500 KB.");
  const bytes = Buffer.from(match[2], "base64");
  const valid = match[1] === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : match[1] === "jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP";
  if (!valid || bytes.length > 500 * 1024) throw new Error("The selected image is not a valid PNG, JPEG, or WebP under 500 KB.");
  return value;
}
export function validSetupToken(provided: unknown, expected = process.env.SETUP_TOKEN) {
  if (typeof expected !== "string" || expected.length < 32 || typeof provided !== "string" || provided.length > 256) return false;
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(provided), hash(expected));
}
