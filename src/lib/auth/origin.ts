/** Trust a configured public origin, never client-controlled forwarding headers. */
export function isAllowedOrigin(
  request: Pick<Request, "url" | "headers">,
  appUrl = process.env.APP_URL,
  production = process.env.NODE_ENV === "production",
): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    // Reverse proxies may expose an internal HTTP URL to the application.
    // Production must have an explicit public URL; development can use localhost.
    if (production && !appUrl) return false;
    const allowed = new URL(appUrl || request.url);
    if (!["https:", "http:"].includes(allowed.protocol) || allowed.username || allowed.password) return false;
    return origin === allowed.origin;
  } catch { return false; }
}
