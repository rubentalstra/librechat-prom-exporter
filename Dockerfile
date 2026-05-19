# syntax=docker/dockerfile:1.7

# Stage 1: Build TypeScript
FROM node:25-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --prefer-offline --no-audit --silent

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Install production dependencies only
FROM node:25-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts --prefer-offline --no-audit --silent && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/* /root/.npm && \
    find /app/node_modules -name "test" -type d -prune -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -name "tests" -type d -prune -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -name "__tests__" -type d -prune -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -name "*.test.js" -delete 2>/dev/null || true && \
    find /app/node_modules -name "*.test.ts" -delete 2>/dev/null || true && \
    find /app/node_modules -name "*.md" -delete 2>/dev/null || true && \
    mkdir -p /app/logs && chown -R 1001:1001 /app

# Stage 3: Distroless runtime
# Build runs on Node 25 (current); runtime stays on the latest distroless
# image, which tracks Node LTS (24 as of May 2026 — distroless lags major
# releases). Our prod deps are pure JS, so Node 25 build artifacts run
# fine on Node 24 runtime. Switch to nodejs25-debian12 once it ships.
FROM gcr.io/distroless/nodejs24-debian12 AS runtime

WORKDIR /app

COPY --from=builder --chown=1001:1001 /app/dist ./dist
COPY --from=deps --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=deps --chown=1001:1001 /app/logs ./logs
COPY --chown=1001:1001 package.json ./

ENV NODE_ENV=production \
    PORT=9087

EXPOSE 9087

USER 1001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||9087)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["dist/index.js"]
