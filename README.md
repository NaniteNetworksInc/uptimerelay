# Self-hosted status page

Run your own status page with customizable branding, an invite-only staff area, incident publishing, grouped services, and automated monitoring.

Each installation serves one organization and uses its own PostgreSQL database. New installations start with no accounts or services. Your logo, colors, site name, browser icon, description, and copyright are managed through the owner’s Settings screen.

## Features

- Public service health and incident updates, with light and dark themes.
- Expandable service groups and a searchable component editor.
- HTTP/HTTPS checks, TCP port checks, and compatible provider status feeds.
- Configurable check intervals, timeouts, and failure thresholds.
- Optional 90-day recorded check history; unmeasured days show no data.
- Staff invitations, password changes, authenticator-based 2FA, and recovery codes.
- Owner-only branding settings and staff invitation management.
- Separate website, monitoring worker, and migration processes.

This is a self-hosted application, not a multi-tenant hosting platform. Alert delivery and scheduled maintenance publishing are not implemented yet. History percentages describe recorded check success, not guaranteed or time-weighted uptime.

## Requirements

Choose either:

| Deployment | Requirements |
| --- | --- |
| Docker, recommended | Docker Engine with the Compose plugin; PostgreSQL can be bundled or external. |
| Native Node.js | Node.js 24, Yarn Classic 1.22.22, and PostgreSQL. |

The optional bundled database uses PostgreSQL 17. An external database must be reachable from the application and worker, and its user must be allowed to create the application’s schemas, tables, and indexes.

For a public deployment, use a domain and an HTTPS reverse proxy such as Nginx, Caddy, or Traefik. Docker publishes the website only on `127.0.0.1:3000`; the container itself listens on port `5678`.

The shell commands below use Bash on Linux.

## 1. Download the application

```bash
git clone https://github.com/NaniteNetworksInc/status-page.git
cd status-page
cp .env.example .env
```

Use a tagged release when deploying a stable version. If the repository is private, your Git account needs access to clone it.

## 2. Configure the environment

Generate independent random values for your setup token, encryption key, and database password. You can use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or, if Node.js is not installed on the host, use the Node container:

```bash
docker run --rm node:24-bookworm-slim node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run your chosen command separately for each value, then edit `.env`:

```dotenv
APP_URL="https://status.example.com"
DATABASE_URL="postgresql://status:YOUR_DATABASE_PASSWORD@db:5432/statuspage"
SETUP_TOKEN="YOUR_RANDOM_SETUP_TOKEN"
AUTH_ENCRYPTION_KEY="YOUR_64_CHARACTER_HEX_KEY"
POSTGRES_PASSWORD="YOUR_DATABASE_PASSWORD"
```

Replace every placeholder before starting the application.

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Exact public origin, including scheme and optional port. It must match the URL used in the browser. Production requests fail closed when this is missing or incorrect. |
| `DATABASE_URL` | PostgreSQL connection string. Use `db` as the hostname only with the bundled database configuration. |
| `SETUP_TOKEN` | Random secret of at least 32 characters, required to create the first owner. Remove it after setup. |
| `AUTH_ENCRYPTION_KEY` | Exactly 64 hexadecimal characters. Encrypts authenticator secrets; keep this value unchanged and back it up securely. |
| `POSTGRES_PASSWORD` | Required only for bundled PostgreSQL. It must match the password in `DATABASE_URL`. |

Use different secrets for each installation. Keep `.env` outside Git. Percent-encode special characters in a database URL’s username or password; generated hex passwords avoid that requirement.

For local testing, use `APP_URL="http://localhost:3000"`. Public deployments should use HTTPS because production session cookies are secure cookies.

## 3. Start the application

### Option A: bundled PostgreSQL

Use this when you want Compose to manage the database too. Set `DATABASE_URL` to the `db` hostname, and provide matching passwords as shown above.

```bash
docker compose -f compose.yaml -f compose.db.yaml up -d --build
docker compose -f compose.yaml -f compose.db.yaml ps -a
docker compose -f compose.yaml -f compose.db.yaml logs migrate
```

This starts PostgreSQL, applies database migrations, and then starts the website and monitoring worker. The `migrate` service should exit successfully with code `0`; it is not a continuously running service.

Database files persist in the `postgres_data` named volume. PostgreSQL does not expose a public host port in this configuration.

### Option B: external PostgreSQL

Create a dedicated database and configure its connection string in `.env`:

```dotenv
DATABASE_URL="postgresql://status:YOUR_PASSWORD@YOUR_DATABASE_HOST:5432/statuspage"
```

Then start the application without the bundled database file:

```bash
docker compose up -d --build
docker compose ps -a
docker compose logs migrate
```

`localhost` inside a container means that container, not another server or the Docker host. A Dokploy database’s internal container hostname works only when the application joins a network where that name is reachable. For a separate VM, use a reachable database endpoint and restrict database access to your application hosts.

### Reverse proxy

Point your domain at the application server and configure your HTTPS reverse proxy to forward traffic to:

```text
http://127.0.0.1:3000
```

For Nginx, the upstream location can use:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Place that location inside your domain’s configured HTTPS server block. Certificate provisioning is handled by your reverse proxy. `APP_URL` must be the public HTTPS origin, even though the upstream connection uses HTTP.

When deploying the web image directly through Dokploy or another container platform, configure its application port as **5678**. Run the migration and worker targets separately; starting the web image alone does not start monitoring.

## 4. Create your owner account

Open:

```text
https://status.example.com/admin/setup
```

Enter your setup token, site name, name, email address, and a password of at least 12 characters. The first account becomes the owner.

Setup closes whenever any staff account already exists. A missing or short setup token keeps setup disabled; there is no open registration page.

After setup:

1. Remove `SETUP_TOKEN` from `.env`.
2. Recreate the web service to apply that environment change:

   ```bash
   docker compose up -d --no-deps --force-recreate web
   ```

3. Open **Admin → Settings** to configure your branding.
4. Open **Admin → Staff** to invite colleagues.
5. Open **Account & security** from your profile menu to enable 2FA.

For bundled PostgreSQL, use `docker compose -f compose.yaml -f compose.db.yaml` instead of `docker compose` throughout subsequent commands.

Uploaded logos and browser icons are stored in PostgreSQL. PNG, JPEG, and WebP files up to 500 KB are supported. Owners can change branding and manage invitations; other staff can manage components and incidents.

## 5. Add services and monitoring

In **Admin → Components**:

1. Create a service group.
2. Add components to that group.
3. Select a component to edit its status, visibility, group, external status link, or history preference.
4. Expand **Monitoring**, configure a check, and enable it.

| Check type | What it checks |
| --- | --- |
| HTTP / HTTPS | Performs a GET request and accepts status codes 200–399. Redirects are not followed. Use a direct health endpoint for readiness checks. |
| TCP | Tests whether a connection can be established to the configured public hostname and port. It does not authenticate or verify application behavior. |
| Provider component feed | Reads published component health from an Atlassian Statuspage-compatible JSON feed. |

For example, GitHub’s API component can use:

```text
Feed URL: https://www.githubstatus.com/api/v2/components.json
Exact component name: API Requests
```

A feed must contain a `components` array with matching `name` and `status` fields. Multiple exact component names can be separated by commas. RSS and arbitrary JSON formats are not supported by this check type.

Monitors run independently of website traffic. Failed or stale provider feeds show no data rather than a confirmed provider outage. Staff incidents and worse manual health conditions take priority over healthier monitoring results.

Only public network destinations are allowed. Private, loopback, link-local, metadata, and other reserved destinations are blocked. The public page refreshes every minute while visible. Check results are retained for 90 days.

Read [the monitoring guide](docs/monitoring.md) for detailed behavior and native worker management.

### Optional service templates

A clean installation has no sample services. To explicitly import templates using Docker:

```bash
docker compose run --rm migrate yarn services:import --example
docker compose run --rm migrate yarn services:import --providers
```

Or from a full native checkout:

```bash
yarn services:import --example
yarn services:import --providers
```

Provider templates are placed under **Third Party**. Supported feeds are configured where available; other provider entries start without measured health. These imports are not startup tasks. Re-running an import restores missing template components, including ones you previously deleted.

## Native Node.js installation

Configure `.env`, then install and build using Node.js 24 and Yarn Classic:

```bash
npm install -g yarn@1.22.22
yarn install --frozen-lockfile
yarn contract:emit
yarn prisma db migrate --show
yarn prisma db migrate
yarn build

mkdir -p .next/standalone/.next
cp -R public .next/standalone/
cp -R .next/static .next/standalone/.next/
```

Review the migration preview before applying it to an existing database. Start the standalone website from the repository directory:

```bash
NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3000   node --env-file=.env .next/standalone/server.js
```

Run the monitoring worker as a separate process from the full checkout:

```bash
yarn monitor
```

Use systemd or another process supervisor for both processes. The worker reads the checkout’s `.env` through dotenv. The example systemd unit in `deploy/uptimerelay-monitor.service` must be adjusted to your actual service user, paths, and Node.js executable before installation.

For development, use `yarn dev` with a dedicated development database. The production build uses standalone output; do not use the development server for public hosting.

## Upgrade an existing installation

Back up your database, `.env`, and `AUTH_ENCRYPTION_KEY` before upgrading. Check the release notes and migrations before switching versions.

For Docker, using the same Compose files used during installation:

```bash
# Check out the release you intend to deploy first.
docker compose build
docker compose stop web worker
docker compose run --rm migrate
docker compose up -d web worker
docker compose logs --tail=100 web worker
```

Do not continue if the migration command fails. Migrations run against the configured database; returning to an older image does not automatically reverse schema changes. Do not re-run sample imports as part of an upgrade.

### Upgrade from the original Nanite-specific configuration

Existing accounts receive the `staff` role in the customization migration, and first-run setup stays closed. After applying the migration, an authorized server operator can designate the existing owner and initialize branding:

```bash
yarn site:configure --name "Your Organization"   --owner-email owner@example.com   --copyright "Your Organization, Inc."   --logo-file /path/to/logo.png
```

For Docker, run the equivalent command using the tooling image:

```bash
docker compose run --rm migrate yarn site:configure   --name "Your Organization" --owner-email owner@example.com
```

The named account must already exist. The command grants it owner access, does not change its password, and refuses to overwrite existing settings. Use it only for the intended owner. After initialization, edit branding in **Admin → Settings**.

Use `--logo-path /images/logo.png` instead of `--logo-file` when retaining an asset already included in your public directory. A host file path is not automatically available inside a Docker container.

## Backups

For bundled PostgreSQL, create a SQL dump from the project directory:

```bash
docker compose -f compose.yaml -f compose.db.yaml exec -T db   pg_dump -U status -d statuspage > statuspage-backup.sql
```

Store database backups securely along with a separate protected copy of `.env` and the encryption key. Uploaded branding, staff accounts, monitoring configuration, incidents, and recorded results live in the database.

`docker compose down` keeps named volumes. **Do not use `down -v` unless you intend to delete the bundled database.**

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Bad Gateway | The web service is running, and your proxy targets host port 3000 or container port 5678 as appropriate. |
| Request origin is not allowed | `APP_URL` exactly matches the browser’s scheme, hostname, and port. Recreate the web container after editing `.env`. |
| Database connection failed | The connection string, password encoding, database permissions, and connectivity from inside the containers. |
| Setup is disabled | `SETUP_TOKEN` contains at least 32 characters and was loaded by the running web process. |
| Setup redirects to sign-in | An account already exists. Use that installation’s credentials; setup cannot reset ownership. |
| Monitors show no data | The worker is running, the monitor is enabled, its target is public, and the provider component names match the feed. |
| Migration service exited | Exit code 0 is normal. A nonzero exit code requires checking `docker compose logs migrate`. |
| Existing deployment has no Settings link | Apply the customization migration and explicitly designate its existing owner. |

Useful logs:

```bash
docker compose logs --tail=100 web
docker compose logs --tail=100 worker
docker compose logs migrate
```

## Development checks

```bash
yarn lint
node --import tsx --test tests/*.test.ts
yarn build
```

Database integration checks under `tests/*-db-check.ts` require a configured test database and roll back their temporary records. They are separate from ordinary unit tests.

## License and branding

This project is licensed under the [MIT License](LICENSE). The Nanite Networks Inc. name and logo are trademarks of Nanite Networks Inc. Use of the name or logo in your own branding is not permitted without permission.