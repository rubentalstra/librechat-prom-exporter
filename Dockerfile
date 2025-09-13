# Stage 1: Build the application
FROM node:23-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --silent

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Install production dependencies only
FROM node:23-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production --prefer-offline --no-audit --silent && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/* /root/.npm && \
    find /app/node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null || true

FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

COPY package.json ./

EXPOSE 9087

USER 1001

CMD ["dist/index.js"]