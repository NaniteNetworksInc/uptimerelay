import { lookup } from "node:dns/promises";
import { BlockList, isIP, connect } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { feedStatus, type MonitorConfig } from "./config.ts";

const blocked = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
] as const)
  blocked.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
blocked.addSubnet("2001::", 23, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");
blocked.addSubnet("2002::", 16, "ipv6");
blocked.addSubnet("3fff::", 20, "ipv6");
export function isPublicAddress(address: string) {
  const family = isIP(address);
  return family === 4
    ? !blocked.check(address, "ipv4")
    : family === 6 &&
        globalV6.check(address, "ipv6") &&
        !blocked.check(address, "ipv6");
}
export async function resolveTarget(host: string) {
  const hostname = host.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (
    !addresses.length ||
    addresses.some((entry) => !isPublicAddress(entry.address))
  )
    throw new Error("Only public network destinations can be monitored.");
  return addresses[0];
}

export async function probe(
  config: MonitorConfig,
): Promise<{ status: string; latencyMs: number; error: string | null }> {
  const start = Date.now();
  try {
    // Bound DNS time as well as the connection; connect only to the vetted address.
    const host =
      config.kind === "tcp" ? config.target : new URL(config.target).hostname;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const address = await Promise.race([
      resolveTarget(host),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("DNS lookup timed out.")),
          config.timeoutSeconds * 1000,
        );
      }),
    ]).finally(() => clearTimeout(timer));
    const remaining = Math.max(
      1,
      config.timeoutSeconds * 1000 - (Date.now() - start),
    );
    let status = "operational";
    if (config.kind === "tcp") {
      await new Promise<void>((resolve, reject) => {
        const socket = connect({
          host: address.address,
          family: address.family,
          port: config.port,
        });
        const timeout = setTimeout(
          () => socket.destroy(new Error("Connection timed out.")),
          remaining,
        );
        socket.once("connect", () => {
          socket.destroy();
          resolve();
        });
        socket.once("error", reject);
        socket.once("close", () => clearTimeout(timeout));
      });
    } else {
      const url = new URL(config.target);
      const body = await new Promise<string>((resolve, reject) => {
        const request = (
          url.protocol === "https:" ? httpsRequest : httpRequest
        )(
          url,
          {
            method: "GET",
            agent: false,
            family: address.family,
            lookup: (_hostname, _options, callback) =>
              callback(null, address.address, address.family),
            headers: {
              "User-Agent": "UptimeRelay/0.1.0",
              Accept: config.kind === "statuspage" ? "application/json" : "*/*",
              "Accept-Encoding": "identity",
            },
          },
          (response) => {
            const code = response.statusCode ?? 0;
            // Never follow redirects: a redirect must not bypass destination validation.
            if (
              code < 200 ||
              code >= (config.kind === "statuspage" ? 300 : 400)
            ) {
              response.destroy();
              reject(new Error(`HTTP ${code}`));
              return;
            }
            if (config.kind === "http") {
              response.destroy();
              resolve("");
              return;
            }
            const chunks: Buffer[] = [];
            let size = 0;
            response.on("data", (chunk: Buffer) => {
              size += chunk.length;
              if (size > 1_048_576)
                response.destroy(new Error("Provider feed exceeds 1 MB."));
              else chunks.push(chunk);
            });
            response.once("end", () =>
              resolve(Buffer.concat(chunks).toString("utf8")),
            );
            response.once("error", reject);
          },
        );
        const timeout = setTimeout(
          () => request.destroy(new Error("Check timed out.")),
          remaining,
        );
        request.once("close", () => clearTimeout(timeout));
        request.once("error", reject);
        request.end();
      });
      if (config.kind === "statuspage")
        status = feedStatus(JSON.parse(body), config.matches);
    }
    return { status, latencyMs: Date.now() - start, error: null };
  } catch (error) {
    return {
      status: config.kind === "statuspage" ? "unknown" : "major_outage",
      latencyMs: Date.now() - start,
      error:
        error instanceof Error ? error.message.slice(0, 240) : "Check failed.",
    };
  }
}
