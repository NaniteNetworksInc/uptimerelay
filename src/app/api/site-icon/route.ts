import { NextRequest } from "next/server";
import { getSiteSettings } from "@/lib/site/server";
export async function GET(request: NextRequest) {
  const { favicon } = await getSiteSettings();
  if (favicon?.startsWith("/")) return Response.redirect(new URL(favicon, process.env.APP_URL || request.url));
  if (favicon?.startsWith("data:image/")) {
    const [header, data] = favicon.split(",");
    return new Response(Buffer.from(data, "base64"), { headers: { "Content-Type": header.slice(5).split(";")[0], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  }
  return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#17171d"/><path d="m6 17 5 0 3-8 5 15 3-7h4" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>', { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
