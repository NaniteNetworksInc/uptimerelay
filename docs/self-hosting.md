# Self-hosting

One installation serves one organization. It has its own PostgreSQL database, owner account, branding, staff invitations and monitoring worker. A clean database starts with no accounts or service components. No organization-specific services are imported automatically.

## Configuration

Copy `.env.example` to `.env`. Generate independent random values for SETUP_TOKEN, AUTH_ENCRYPTION_KEY and the database password:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set APP_URL to the exact public origin (scheme, hostname, optional port), DATABASE_URL to the dedicated database, and AUTH_ENCRYPTION_KEY to a 64-character hex value. SETUP_TOKEN must contain at least 32 random characters. Never put tokens in URLs or commit `.env`.

Keep AUTH_ENCRYPTION_KEY unchanged and back it up securely with the database. Losing it prevents decryption of enrolled authenticator secrets. Different installations must use different keys, tokens and databases.

## Docker with your own PostgreSQL

Use a supported PostgreSQL server (the bundled configuration uses PostgreSQL 17). The database must be reachable from the containers. Dokploy-only container names work only when containers share that Docker network.

```bash
cp .env.example .env
# Fill in the real configuration before continuing.
docker compose up -d --build
docker compose logs migrate
```

Compose runs migrations once, then starts web and worker services. The web service listens on localhost port 3000 on the host; put Nginx or another HTTPS reverse proxy in front of it. Keep APP_URL aligned with the actual browser URL. No public registration is enabled.

## Docker with bundled PostgreSQL

Set POSTGRES_PASSWORD to a random hex password and DATABASE_URL to `postgresql://status:YOUR_PASSWORD@db:5432/statuspage`. Use the same password in both settings. Hex passwords avoid URL encoding issues. Do not use the `localhost` example URL inside these containers.

```bash
docker compose -f compose.yaml -f compose.db.yaml up -d --build
docker compose -f compose.yaml -f compose.db.yaml logs migrate
```

PostgreSQL is stored in the `postgres_data` named volume and has no published host port. Back up the database before upgrades; deleting its volume destroys its data.

## Create the owner

Visit `/admin/setup`. Enter the server's setup token, your organization/site name, and the owner's details. Choose a unique password of at least 12 characters. Concurrent setup requests are serialized by the singleton settings row; setup closes as soon as any staff account exists. A missing or weak setup token keeps setup disabled.

After setup, remove SETUP_TOKEN from `.env` and recreate the web container. In **Admin → Settings**, upload a logo/browser icon and choose colors, description and copyright. Images are stored in PostgreSQL, so restarts do not lose them. In **Staff**, invite colleagues. Only owners can edit branding or manage invitations; staff can manage components and incidents. Existing authenticator enrollments continue working if branding changes; only newly generated QR codes use the new name.

## Existing installations

Existing accounts default to the staff role in the additive migration. Setup stays closed; it never takes over an existing installation. After backing up and applying migrations, designate the existing owner and save initial branding using an explicit operator command:

```bash
yarn site:configure --name "Your Organization" --owner-email owner@example.com \
  --copyright "Your Organization, Inc." --logo-file /path/to/logo.png
```

This requires direct database access, refuses to overwrite existing settings, and does not create accounts or change passwords. It promotes only the named existing account. Do not run it with another person's email without authorization.

For an existing image already in your public directory, use `--logo-path /images/logo.png` instead of uploading its bytes with `--logo-file`. Keep that public asset in your deployment.

## Native Node.js deployment

Use Node.js 24 and Yarn Classic:

```bash
yarn install --frozen-lockfile
yarn contract:emit
yarn prisma db migrate --show
yarn prisma db migrate
yarn build
```

The app uses Next.js standalone output. Copy `public` into `.next/standalone/public` and `.next/static` into `.next/standalone/.next/static` before starting the standalone server. Export your environment variables (the standalone server does not automatically read the checkout's `.env` when launched from a different directory).

```bash
NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3000 node .next/standalone/server.js
```

Run `yarn monitor` as a separate managed process from the full checkout. See [monitoring.md](monitoring.md) for the systemd service. Nginx should proxy to the web process, never the worker.

## Optional examples

```bash
yarn services:import --example      # generic sample service groups
yarn services:import --providers    # third-party provider templates under Third Party
```

These commands deliberately write sample/template services to your database. They are never part of startup. Re-running imports restores missing fixture entries, including ones previously deleted in the admin panel.

## Upgrades

Back up the database and encryption key, review the release's migrations, then pull a tagged release and rebuild. Re-run the one-shot migration service before restarting web and worker. Schema changes are forward migrations; rolling back only the container image is not always safe. Keep private settings in `.env` and PostgreSQL rather than modifying application source.

## License

UptimeRelay is available under the [MIT License](../LICENSE). Installation-specific logos and trademarks remain the property of their respective owners.
