# syntax=docker/dockerfile:1.7

# Stage 1: Build TypeScript
FROM node:26-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
# Alpine's node image doesn't ship corepack; install it from npm before
# enabling it (pnpm docs also recommend the latest corepack to avoid the
# Node-bundled corepack's stale-signature issue).
RUN npm install -g corepack@latest && corepack enable

WORKDIR /app

# Workspace metadata first so the pnpm install layer is cache-friendly.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY website/package.json ./website/

# Install only the exporter workspace package (and its deps) — `--filter
# <pkg>...` follows the workspace dep graph but excludes the website,
# keeping the build image lean. --ignore-scripts skips postinstalls in
# the builder; we only need the binary tools (tsc) here.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "librechat-prom-exporter..." --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build

# Stage 2: Install production dependencies only
# Uses the same uid as the runtime base (chainguard uid 65532) so the
# files copied across already have correct ownership at runtime.
FROM node:26-alpine AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
# Alpine's node image doesn't ship corepack; install it from npm before
# enabling it (pnpm docs also recommend the latest corepack to avoid the
# Node-bundled corepack's stale-signature issue).
RUN npm install -g corepack@latest && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY website/package.json ./website/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --filter "librechat-prom-exporter..." --ignore-scripts && \
    rm -rf /tmp/* /var/cache/apk/* && \
    find /app/node_modules -name "test" -type d -prune -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -name "tests" -type d -prune -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -name "__tests__" -type d -prune -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -name "*.test.js" -delete 2>/dev/null || true && \
    find /app/node_modules -name "*.test.ts" -delete 2>/dev/null || true && \
    find /app/node_modules -name "*.md" -delete 2>/dev/null || true && \
    mkdir -p /app/logs && chown -R 65532:65532 /app

# Stage 3: Chainguard hardened minimal Node runtime
# Why Chainguard: their public images are rebuilt daily from source against
# the latest upstream CVE fixes, so we don't sit on a distroless base whose
# rebuild cadence trails Debian security patches by days/weeks. Currently
# tracks Node 26.x.
#
# Image conventions:
#   - default user: 65532 (nonroot)
#   - entrypoint:   /usr/bin/node
#   - no shell; HEALTHCHECK must use array-form invoking node directly
FROM cgr.dev/chainguard/node:latest AS runtime

# OCI image metadata. The CD pipeline overrides these via
# docker/metadata-action so the registry sees commit-pinned values; the
# defaults here cover local `docker build` and any non-CI consumer.
LABEL org.opencontainers.image.title="librechat-prom-exporter" \
      org.opencontainers.image.description="Prometheus exporter for LibreChat metrics — connects to a LibreChat MongoDB and exposes user, message, conversation, transaction, and cost metrics on /metrics." \
      org.opencontainers.image.vendor="Ruben Talstra" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/rubentalstra/librechat-prom-exporter" \
      org.opencontainers.image.url="https://github.com/rubentalstra/librechat-prom-exporter" \
      org.opencontainers.image.documentation="https://github.com/rubentalstra/librechat-prom-exporter#readme"

WORKDIR /app

COPY --from=builder --chown=65532:65532 /app/dist ./dist
COPY --from=deps --chown=65532:65532 /app/node_modules ./node_modules
COPY --from=deps --chown=65532:65532 /app/logs ./logs
COPY --chown=65532:65532 package.json ./

ENV NODE_ENV=production \
    PORT=9087

EXPOSE 9087

USER 65532

# Chainguard's ENTRYPOINT is already /usr/bin/node, so HEALTHCHECK CMD
# args become `node <args>`. Using array form keeps the shell out of the
# picture (Chainguard's minimal image has no shell).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["/usr/bin/node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||9087)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

# The base image's ENTRYPOINT is /usr/bin/node, so CMD is just the script.
CMD ["dist/index.js"]
