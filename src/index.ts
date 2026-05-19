import compression from "compression";
import "dotenv/config";
import express, { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import client from "prom-client";

import { advancedGauges } from "./metrics/advancedMetrics.js";
import { basicGauges } from "./metrics/basicMetrics.js";
import {
  updateAdvancedMetricsTimed,
  updateBasicMetricsTimed,
  waitForIdle,
} from "./metrics/index.js";
import { assertIndexes } from "./metrics/indexAssertions.js";
import { installTenantHooks } from "./metrics/tenantHooks.js";
import { envFlag } from "./metrics/util.js";
import { buildMetricsAuth } from "./middleware/metricsAuth.js";

const TENANT_ID = process.env.TENANT_ID;
if (TENANT_ID) {
  installTenantHooks(TENANT_ID);
  console.log(`Tenant scoping active: tenantId=${TENANT_ID}`);
}

const port = parseInt(process.env.PORT || "3000", 10);
const metricsPortEnv = process.env.METRICS_PORT;
const metricsPort = metricsPortEnv ? parseInt(metricsPortEnv, 10) : undefined;
const refreshInterval = parseInt(process.env.REFRESH_INTERVAL || "30000", 10);
const advancedRefreshInterval = parseInt(
  process.env.ADVANCED_REFRESH_INTERVAL || String(refreshInterval * 10),
  10,
);
const trustProxy = process.env.TRUST_PROXY || "loopback";
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || "120", 10);
const healthRateLimitMax = parseInt(
  process.env.HEALTH_RATE_LIMIT_MAX || "600",
  10,
);

const register = new client.Registry();
client.collectDefaultMetrics({ register });

for (const gauge of Object.values(basicGauges)) {
  register.registerMetric(gauge);
}
for (const gauge of Object.values(advancedGauges)) {
  register.registerMetric(gauge as client.Metric);
}

advancedGauges.exporterMongoConnected.set(0);
mongoose.connection.on("connected", () =>
  advancedGauges.exporterMongoConnected.set(1),
);
mongoose.connection.on("reconnected", () =>
  advancedGauges.exporterMongoConnected.set(1),
);
mongoose.connection.on("disconnected", () =>
  advancedGauges.exporterMongoConnected.set(0),
);
mongoose.connection.on("error", () =>
  advancedGauges.exporterMongoConnected.set(0),
);

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/librechat";
const mongoPoolSize = parseInt(process.env.MONGO_POOL_SIZE || "50", 10);
mongoose
  .connect(mongoURI, {
    maxPoolSize: mongoPoolSize,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log(`Connected to MongoDB (maxPoolSize=${mongoPoolSize})`);
    return assertIndexes();
  })
  .catch((error: Error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

const basicTimer = setInterval(updateBasicMetricsTimed, refreshInterval);
const advancedTimer = setInterval(
  updateAdvancedMetricsTimed,
  advancedRefreshInterval,
);
if (envFlag("LOG_TIMINGS", false)) {
  console.log(
    `[scheduler] basic every ${refreshInterval}ms, advanced every ${advancedRefreshInterval}ms`,
  );
}
updateBasicMetricsTimed();
updateAdvancedMetricsTimed();

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
  target.set("trust proxy", trustProxy);
  target.disable("x-powered-by");
  target.use(helmetMiddleware);
  target.use(compression());
  target.use(express.json({ limit: "10kb" }));
}

const metricsHandler: RequestHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
};

const healthHandler: RequestHandler = (
  _req: Request,
  res: Response,
): void => {
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

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error("Unhandled error:", err);
  res.status(500).send("Internal Server Error");
};

const metricsLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  limit: rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const healthLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  limit: healthRateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const servers: import("http").Server[] = [];

async function start(): Promise<void> {
  let metricsAuth: RequestHandler;
  try {
    metricsAuth = await buildMetricsAuth();
  } catch (err) {
    console.error("[metrics-auth] configuration error:", err);
    process.exit(1);
  }

  const primaryApp = express();
  applyBaseMiddleware(primaryApp);
  primaryApp.get("/health", healthLimiter, healthHandler);

  if (metricsPort && metricsPort !== port) {
    const metricsApp = express();
    applyBaseMiddleware(metricsApp);
    metricsApp.get("/metrics", metricsLimiter, metricsAuth, metricsHandler);
    metricsApp.use(errorHandler);
    primaryApp.use(errorHandler);

    servers.push(
      primaryApp.listen(port, () =>
        console.log(`Health endpoint listening on port ${port}`),
      ),
    );
    servers.push(
      metricsApp.listen(metricsPort, () =>
        console.log(`Metrics endpoint listening on port ${metricsPort}`),
      ),
    );
  } else {
    primaryApp.get("/metrics", metricsLimiter, metricsAuth, metricsHandler);
    primaryApp.use(errorHandler);
    servers.push(
      primaryApp.listen(port, () =>
        console.log(`Exporter listening on port ${port}`),
      ),
    );
  }
}

start();

let isShuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    console.warn(`[shutdown] received ${signal} during shutdown — exiting now`);
    process.exit(1);
  }
  isShuttingDown = true;
  console.log(`[shutdown] received ${signal} — draining`);
  clearInterval(basicTimer);
  clearInterval(advancedTimer);
  await Promise.all(
    servers.map(
      (s) => new Promise<void>((resolve) => s.close(() => resolve())),
    ),
  );
  await waitForIdle();
  try {
    await mongoose.disconnect();
  } catch (err) {
    console.error("[shutdown] mongoose.disconnect failed:", err);
  }
  console.log("[shutdown] complete");
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
