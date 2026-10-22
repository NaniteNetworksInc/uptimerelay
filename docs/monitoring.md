# Services and monitoring

PostgreSQL is the source of truth for groups, components, external links, monitoring settings and results. Manage services under **Admin → Components**. No runtime code imports a static service list.

The component manager shows expandable groups and searchable component rows. Select a row to edit its name, parent group, manual health, visibility, provider link, monitoring and history preference. Deletion requires confirmation and atomically removes the component, monitor and recorded check history. Moving a component retains its ID and history. Incidents target groups, so a moved component follows incidents for its new group.

Enable **Show uptime history** to display a 90-day UTC daily history in the editor and public page. Days without known measurements are gray. Each measured day shows the worst recorded check status. The percentage is labeled recorded check success and excludes unknown samples; it is not a time-weighted availability guarantee. Changing a monitoring target retains old history for that component.

## Apply and import

Use Node.js 24 and the repository's locked dependencies. From the checkout, with DATABASE_URL in `.env`:

```bash
yarn install --frozen-lockfile
yarn contract:emit
yarn prisma db migrate --show
yarn prisma db migrate --advance-ref db
yarn services:import --example
```

Review the preview before applying. The monitoring migration adds two tables, two indexes and a nullable status-page URL. The generated baseline supports fresh databases; existing databases at the previous contract apply only the monitoring delta. Back up the database before deployment.

The component-history migration adds the `showUptime` preference, initially off. The import is for initial setup or explicitly restoring fixture services: running it after deleting an imported component will recreate that missing fixture entry. Do not run the importer automatically on every deploy.

`scripts/data/services.json` and `providers.json` are one-time import fixtures, not live configuration. Importing again preserves existing components and staff edits. External providers live inside **Third Party**, with provider-prefixed component names where needed. The importer moves previously separate provider groups into Third Party while retaining component IDs, links, monitor settings and check history. Incidents targeting moved groups are reassociated with Third Party; because incidents target groups, they affect the whole Third Party group afterward. Imported third-party components start with **No data**. Cloudflare, Bunny.net, Twilio, Discord and GitHub are configured with exact published component-feed names. Stripe, Amazon SES, Slack and Notion initially have external status links and manual health; no feed is fabricated for these providers. Amazon SES monitoring should be configured for the AWS region actually used. Unmatched/changed provider component names produce No data and an admin error message.

## Configure checks

Expand **Monitoring** below a component. Select HTTP/HTTPS, TCP port, or an Atlassian Statuspage-compatible components JSON feed. Specify its public target, interval (30–3600 seconds), timeout (1–30 seconds), and consecutive failures (1–10) before an HTTP/TCP outage. Save to queue the first check immediately.

- HTTP checks GET and accept HTTP 200–399 without following redirects. A redirect checks the responding endpoint only. Use a direct health endpoint for application-level readiness. No credentials, custom headers, body assertions, or authenticated probes are supported yet.
- TCP checks only establish a connection; they do not log in or verify protocol behavior.
- Provider feeds read component status, not website reachability. Enter exact component names separated by commas. Feed failures indicate missing data, never a confirmed provider outage.
- Destinations must resolve exclusively to public IPs. DNS is resolved for every check and connections are pinned to a validated address. Private/internal monitoring requires a separately designed trusted agent.
- Health combines monitoring with manual health and published incidents, retaining the worse known condition. A manual No data value does not mask a fresh monitoring result. Disabling a monitor restores manual status.
- No checks or stale worker reports show No data. HTTP/TCP errors require the configured failure threshold; one success recovers immediately. Results are retained for 90 days. History displays are optional per component. Time-weighted uptime percentages and alert notifications are not implemented.
- The public page refreshes every minute while visible. Checks run independently of website traffic; they do not automatically publish incident narratives.

## Run continuously on the VM

The web server and worker are separate processes. Running `yarn build` or `yarn start` does not start monitoring.

```bash
yarn monitor:once  # process up to four due monitors, then exit
yarn monitor       # continuously process due monitors, four checks at a time
```

For systemd, keep the checkout, runtime dependencies, generated contract and `.env` in `/opt/uptimerelay`. Ensure a non-root `uptimerelay` account exists and can read them; protect `.env` so other users cannot read it. Adjust paths and account in `deploy/uptimerelay-monitor.service` to match the deployment. Node must be a system installation accessible at `/usr/bin/node`.

```bash
sudo cp deploy/uptimerelay-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now uptimerelay-monitor
sudo journalctl -u uptimerelay-monitor -f
```

Restart after deploys: `sudo systemctl restart uptimerelay-monitor`. Row locks and per-check leases prevent duplicate claims between workers; a changed configuration discards in-flight old results. A killed worker's claim becomes due again after its timeout plus 60 seconds.

For a VM outside Dokploy's network, DATABASE_URL must use a reachable database endpoint, not a Dokploy-only container hostname. Restrict database access to trusted hosts. The web-only standalone Docker image does not include the worker checkout; run this unit on the VM or package a separate worker container.
