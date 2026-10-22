# UptimeRelay v0.1.0 - Initial Public Release

UptimeRelay is a self-hosted status page for publishing service health and incident updates, with customizable branding and an invite-only staff dashboard.

## Included

- Public status page with grouped components and light/dark themes.
- Incident publishing with affected services and progress updates.
- HTTP/HTTPS, TCP, and compatible provider status-feed monitoring.
- Configurable monitoring intervals, timeouts, and failure thresholds.
- Optional 90-day check history, with unmeasured periods shown as no data.
- Component management, grouping, deletion, and uptime visibility controls.
- Invite-only staff accounts, password changes, authenticator 2FA, and recovery codes.
- Owner setup and branding settings for the site name, logo, icon, colors, and copyright.
- PostgreSQL migrations, Docker Compose deployment, and self-hosting documentation.
- MIT license.

## Self-hosting

Follow [README.md](README.md) to configure the environment, apply migrations, start the web app and monitoring worker, and create the first owner account.

Docker deployments can use the bundled PostgreSQL database or an external database. Native deployments require Node.js 24 and Yarn Classic 1.22.22. GitHub Actions is not required.

## Current limitations

- Alert delivery and scheduled maintenance publishing are not implemented yet.
- Each installation serves one organization.
- History percentages represent recorded check success, not time-weighted uptime.
- This is an early release; back up your database and authentication encryption key before upgrading.
