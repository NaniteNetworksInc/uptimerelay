export type MonitorConfig = {
  kind: "http" | "tcp" | "statuspage";
  target: string;
  port: number;
  matches: string;
  intervalSeconds: number;
  timeoutSeconds: number;
  failureThreshold: number;
  enabled: boolean;
};
export function parseMonitor(value: unknown): MonitorConfig {
  if (!value || typeof value !== "object")
    throw new Error("Invalid monitor configuration.");
  const data = value as Record<string, unknown>;
  if (!["http", "tcp", "statuspage"].includes(String(data.kind)))
    throw new Error("Select a check type.");
  const kind = data.kind as MonitorConfig["kind"];
  if (
    typeof data.target !== "string" ||
    !data.target.trim() ||
    data.target.length > 2048
  )
    throw new Error("Enter a target.");
  let target = data.target.trim();
  if (kind !== "tcp") {
    const url = new URL(target);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hash
    )
      throw new Error(
        "Use a public HTTP or HTTPS URL without credentials or a fragment.",
      );
    if (kind === "statuspage" && url.protocol !== "https:")
      throw new Error("Status feeds require HTTPS.");
    target = url.href;
  } else if (!/^[a-zA-Z0-9.:-]+$/.test(target))
    throw new Error(
      "Enter a hostname or IP address without a protocol or path.",
    );
  function integer(name: string, min: number, max: number) {
    const number = data[name];
    if (
      typeof number !== "number" ||
      !Number.isInteger(number) ||
      number < min ||
      number > max
    )
      throw new Error(`${name} must be between ${min} and ${max}.`);
    return number;
  }
  if (typeof data.enabled !== "boolean")
    throw new Error("Invalid monitor state.");
  if (typeof data.matches !== "string" || data.matches.length > 500)
    throw new Error("Keep feed component names under 500 characters.");
  if (kind === "statuspage" && !data.matches.trim())
    throw new Error(
      "Enter the exact component names from the provider feed, separated by commas.",
    );
  return {
    kind,
    target,
    matches: data.matches.trim(),
    port: integer("port", 1, 65535),
    intervalSeconds: integer("intervalSeconds", 30, 3600),
    timeoutSeconds: integer("timeoutSeconds", 1, 30),
    failureThreshold: integer("failureThreshold", 1, 10),
    enabled: data.enabled,
  };
}

export function monitorStatus(
  monitor: {
    status: string;
    checkedAt: string | null;
    intervalSeconds: number;
    timeoutSeconds: number;
  },
  now = Date.now(),
) {
  if (
    !monitor.checkedAt ||
    now - Date.parse(monitor.checkedAt) >
      Math.max(
        180_000,
        monitor.intervalSeconds * 3000 + monitor.timeoutSeconds * 1000,
      )
  )
    return "unknown";
  return monitor.status;
}

export function feedStatus(payload: unknown, matches: string): string {
  const entries = (
    payload as { components?: { name: string; status: string }[] }
  )?.components;
  if (!Array.isArray(entries))
    throw new Error("Provider returned an invalid component feed.");
  const names = matches
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  const map: Record<string, string> = {
    operational: "operational",
    degraded_performance: "degraded",
    partial_outage: "partial_outage",
    major_outage: "major_outage",
    under_maintenance: "maintenance",
  };
  const ranks: Record<string, number> = {
    operational: 0,
    degraded: 1,
    maintenance: 2,
    partial_outage: 3,
    major_outage: 4,
  };
  return names.reduce((state, name) => {
    const found = entries.find(
      (entry) =>
        typeof entry.name === "string" && entry.name.toLowerCase() === name,
    );
    if (!found || !map[found.status])
      throw new Error(
        "A configured provider component was not found or has an unknown status.",
      );
    const status = map[found.status];
    return ranks[status] > ranks[state] ? status : state;
  }, "operational");
}
