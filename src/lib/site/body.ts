export async function readSettingsBody(request: Request, limit = 1_450_000) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("Send JSON data.");
  const reader = request.body?.getReader(); if (!reader) throw new Error("Request body is missing.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); throw new Error("Request is too large."); } chunks.push(value); }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally { reader.releaseLock(); }
}
