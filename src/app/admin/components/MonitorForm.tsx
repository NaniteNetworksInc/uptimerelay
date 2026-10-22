"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ManagedGroup } from "@/lib/services/shared";
const input =
  "mt-2 min-h-11 w-full rounded-lg border border-(--line) bg-(--panel-bg) px-3 py-2 text-sm outline-none focus:border-(--accent)";
export default function MonitorForm({
  component,
}: {
  component: ManagedGroup["components"][number];
}) {
  const monitor = component.monitor;
  const [kind, setKind] = useState(monitor?.kind ?? "http");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/components/${component.id}/monitor`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind,
            target: data.get("target"),
            port: Number(data.get("port") || 443),
            matches: data.get("matches") || "",
            intervalSeconds: Number(data.get("intervalSeconds")),
            timeoutSeconds: Number(data.get("timeoutSeconds")),
            failureThreshold: Number(data.get("failureThreshold")),
            enabled: data.get("enabled") === "on",
          }),
        },
      );
      const result = await response.json();
      setFailed(!response.ok);
      setMessage(
        response.ok
          ? "Monitor saved. The worker will pick up this configuration."
          : result.error || "Unable to save monitor.",
      );
      if (response.ok) router.refresh();
    } catch {
      setFailed(true);
      setMessage("Unable to reach the server.");
    } finally {
      setPending(false);
    }
  }
  return (
    <details className="pb-5">
      <summary className="cursor-pointer text-xs text-(--tag-ink)">
        Monitoring · {monitor?.enabled ? "Enabled" : "Not enabled"}
      </summary>
      <div className="mt-4 border-l border-(--line) pl-4">
        <p className="text-xs leading-6 text-(--muted)">
          {monitor?.checkedAt
            ? `Last checked ${new Date(monitor.checkedAt).toISOString().replace("T", " ").slice(0, 19)} UTC · ${monitor.latencyMs ?? "—"} ms`
            : "No checks recorded yet. A running monitoring worker is required."}
        </p>
        {monitor?.error && (
          <p className="mt-2 text-xs text-(--tag-ink)">{monitor.error}</p>
        )}
        <form onSubmit={save} className="mt-4">
          <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs">
              Check type
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as typeof kind)}
                className={input}
              >
                <option value="http">HTTP / HTTPS</option>
                <option value="tcp">TCP port</option>
                <option value="statuspage">Provider component feed</option>
              </select>
            </label>
            <label className="text-xs">
              {kind === "tcp"
                ? "Public hostname or IP"
                : kind === "statuspage"
                  ? "Statuspage components JSON URL"
                  : "Health-check URL"}
              <input
                name="target"
                type={kind === "tcp" ? "text" : "url"}
                defaultValue={monitor?.target ?? ""}
                required
                maxLength={2048}
                placeholder={
                  kind === "tcp"
                    ? "server.example.com"
                    : "https://example.com/health"
                }
                className={input}
              />
            </label>
            {kind === "tcp" && (
              <label className="text-xs">
                Port
                <input
                  type="number"
                  name="port"
                  min={1}
                  max={65535}
                  defaultValue={monitor?.port ?? 443}
                  required
                  className={input}
                />
              </label>
            )}
            {kind === "statuspage" && (
              <label className="text-xs sm:col-span-2">
                Exact provider component names, separated by commas
                <input
                  name="matches"
                  defaultValue={monitor?.matches ?? ""}
                  required
                  maxLength={500}
                  placeholder="API Requests"
                  className={input}
                />
              </label>
            )}
            <label className="text-xs">
              Check interval (seconds)
              <input
                type="number"
                name="intervalSeconds"
                min={30}
                max={3600}
                defaultValue={monitor?.intervalSeconds ?? 60}
                required
                className={input}
              />
            </label>
            <label className="text-xs">
              Timeout (seconds)
              <input
                type="number"
                name="timeoutSeconds"
                min={1}
                max={30}
                defaultValue={monitor?.timeoutSeconds ?? 10}
                required
                className={input}
              />
            </label>
            <label className="text-xs">
              Failures before reporting an outage
              <input
                type="number"
                name="failureThreshold"
                min={1}
                max={10}
                defaultValue={monitor?.failureThreshold ?? 3}
                required
                className={input}
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                name="enabled"
                type="checkbox"
                defaultChecked={monitor?.enabled ?? true}
                className="size-4 accent-(--button)"
              />
              Enable monitoring
            </label>
            <p className="text-xs leading-6 text-(--muted) sm:col-span-2">
              HTTP accepts responses from 200–399 without following redirects.
              TCP checks connectivity only. Feed checks use the provider’s
              published component health. Staff incidents and worse manual
              statuses take priority.
            </p>
            <button className="min-h-11 cursor-pointer rounded-lg border border-(--line) px-4 text-xs hover:bg-(--hover) sm:justify-self-start">
              {pending ? "Saving…" : "Save monitor"}
            </button>
          </fieldset>
          {message && (
            <p
              role={failed ? "alert" : "status"}
              className="mt-3 text-xs leading-6"
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </details>
  );
}
