# Build with the project's locked Yarn dependencies.
FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN if ! command -v yarn > /dev/null 2>&1; then npm install --global yarn@1.22.22 --no-audit --no-fund; fi
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive --registry https://registry.npmjs.org

COPY . .
# Contract emission/build need a valid URL, not a live database or production secrets.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build yarn contract:emit \
    && DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build yarn build

# Migration tools run once before web and worker services start.
FROM builder AS tooling
ENV NODE_ENV=production
USER node
CMD ["yarn", "prisma", "db", "migrate"]

# Node 24 executes the TypeScript worker directly, without tsx.
FROM builder AS worker
ENV NODE_ENV=production
USER node
CMD ["node", "scripts/monitor.ts"]

# Standalone output contains the server and its traced runtime dependencies.
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=5678 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 5678
CMD ["node", "server.js"]

