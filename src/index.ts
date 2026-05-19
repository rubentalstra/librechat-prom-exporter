import compression from "compression";
import express, { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import client from "prom-client";

import { getConfig } from "./config.js";
import { logger } from "./logger.js";
import { advancedGauges } from "./metrics/advancedMetrics.js";
import { basicGauges } from "./metrics/basicMetrics.js";
import { updateAdvancedMetricsTimed, updateBasicMetricsTimed, waitForIdle } from "./metrics/index.js";
import { assertIndexes } from "./metrics/indexAssertions.js";
import { installTenantHooks } from "./metrics/tenantHooks.js";
import { buildMetricsAuth } from "./middleware/metricsAuth.js";

const cfg = getConfig();
const log = logger();

if (cfg.TENANT_ID) {
  installTenantHooks(cfg.TENANT_ID);
  log.info({ tenantId: cfg.TENANT_ID }, "tenant scoping active");
}

const register = new client.Registry();
client.collectDefaultMetrics({ register });

for (const gauge of Object.values(basicGauges)) {
  register.registerMetric(gauge);
}
for (const gauge of Object.values(advancedGauges)) {
  register.registerMetric(gauge as client.Metric);
}

advancedGauges.exporterMongoConnected.set(0);
mongoose.connection.on("connected", () => advancedGauges.exporterMongoConnected.set(1));
mongoose.connection.on("reconnected", () => advancedGauges.exporterMongoConnected.set(1));
mongoose.connection.on("disconnected", () => advancedGauges.exporterMongoConnected.set(0));
mongoose.connection.on("error", () => advancedGauges.exporterMongoConnected.set(0));

mongoose
  .connect(cfg.MONGO_URI, {
    maxPoolSize: cfg.MONGO_POOL_SIZE,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    log.info({ maxPoolSize: cfg.MONGO_POOL_SIZE }, "connected to MongoDB");
    return assertIndexes();
  })
  .catch((err: Error) => {
    log.fatal({ err }, "MongoDB connection error");
    process.exit(1);
  });

const basicTimer = setInterval(updateBasicMetricsTimed, cfg.REFRESH_INTERVAL);
const advancedTimer = setInterval(updateAdvancedMetricsTimed, cfg.ADVANCED_REFRESH_INTERVAL);
if (cfg.LOG_TIMINGS) {
  log.info(
    {
      basicMs: cfg.REFRESH_INTERVAL,
      advancedMs: cfg.ADVANCED_REFRESH_INTERVAL,
    },
    "scheduler started",
  );
}
void updateBasicMetricsTimed();
void updateAdvancedMetricsTimed();

const READY_STATE_LABEL: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
});

function applyBaseMiddleware(target: express.Application): void {
  target.set("trust proxy", cfg.TRUST_PROXY);
  target.disable("x-powered-by");
  target.use(helmetMiddleware);
  target.use(compression());
  target.use(express.json({ limit: "10kb" }));
}

const metricsHandler: RequestHandler = async (_req: Request, res: Response): Promise<void> => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
};

const healthHandler: RequestHandler = (_req: Request, res: Response): void => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.status(200).json({ status: "ok", mongo: "connected" });
  } else {
    res.status(503).json({
      status: "degraded",
      mongo: READY_STATE_LABEL[state] ?? `unknown(${state})`,
    });
  }
};

const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  log.error({ err }, "unhandled error");
  res.status(500).send("Internal Server Error");
};

const metricsLimiter = rateLimit({
  windowMs: cfg.RATE_LIMIT_WINDOW_MS,
  limit: cfg.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const healthLimiter = rateLimit({
  windowMs: cfg.RATE_LIMIT_WINDOW_MS,
  limit: cfg.HEALTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const servers: import("http").Server[] = [];

async function start(): Promise<void> {
  let metricsAuth: RequestHandler;
  try {
    metricsAuth = await buildMetricsAuth();
  } catch (err) {
    log.fatal({ err }, "metrics-auth configuration error");
    process.exit(1);
  }

  const primaryApp = express();
  applyBaseMiddleware(primaryApp);
  primaryApp.get("/health", healthLimiter, healthHandler);

  if (cfg.METRICS_PORT && cfg.METRICS_PORT !== cfg.PORT) {
    const metricsApp = express();
    applyBaseMiddleware(metricsApp);
    metricsApp.get("/metrics", metricsLimiter, metricsAuth, metricsHandler);
    metricsApp.use(errorHandler);
    primaryApp.use(errorHandler);

    servers.push(primaryApp.listen(cfg.PORT, () => log.info({ port: cfg.PORT }, "health endpoint listening")));
    servers.push(
      metricsApp.listen(cfg.METRICS_PORT, () => log.info({ port: cfg.METRICS_PORT }, "metrics endpoint listening")),
    );
  } else {
    primaryApp.get("/metrics", metricsLimiter, metricsAuth, metricsHandler);
    primaryApp.use(errorHandler);
    servers.push(primaryApp.listen(cfg.PORT, () => log.info({ port: cfg.PORT }, "exporter listening")));
  }
}

void start();

let isShuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    log.warn({ signal }, "received signal during shutdown — exiting now");
    process.exit(1);
  }
  isShuttingDown = true;
  log.info({ signal }, "shutdown signal received — draining");
  clearInterval(basicTimer);
  clearInterval(advancedTimer);
  await Promise.all(servers.map((s) => new Promise<void>((resolve) => s.close(() => resolve()))));
  await waitForIdle();
  try {
    await mongoose.disconnect();
  } catch (err) {
    log.error({ err }, "mongoose.disconnect failed during shutdown");
  }
  log.info("shutdown complete");
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
