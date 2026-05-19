import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import client from "prom-client";
import "dotenv/config";
import { basicGauges } from "./metrics/basicMetrics.js";
import { advancedGauges } from "./metrics/advancedMetrics.js";
import {
  updateBasicMetricsTimed,
  updateAdvancedMetricsTimed,
  waitForIdle,
} from "./metrics/index.js";
import { envFlag } from "./metrics/util.js";
import { assertIndexes } from "./metrics/indexAssertions.js";
import { installTenantHooks } from "./metrics/tenantHooks.js";

const TENANT_ID = process.env.TENANT_ID;
if (TENANT_ID) {
  installTenantHooks(TENANT_ID);
  console.log(`Tenant scoping active: tenantId=${TENANT_ID}`);
}

const app = express();
const port = process.env.PORT || 3000;
const refreshInterval = parseInt(process.env.REFRESH_INTERVAL || "30000");
const advancedRefreshInterval = parseInt(
  process.env.ADVANCED_REFRESH_INTERVAL || String(refreshInterval * 10),
);

// Create a Prometheus registry and collect default metrics.
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Register basic gauges.
for (const gauge of Object.values(basicGauges)) {
  register.registerMetric(gauge);
}

// Register advanced gauges.
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
const mongoPoolSize = parseInt(process.env.MONGO_POOL_SIZE || "50");
mongoose
  .connect(mongoURI, {
    maxPoolSize: mongoPoolSize,
    // 5s vs the mongoose default of 30s so /health flips fast on outage
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

app.get("/metrics", async (_req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

const READY_STATE_LABEL: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};
app.get("/health", (_req: Request, res: Response) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.status(200).json({ status: "ok", mongo: "connected" });
  } else {
    res.status(503).json({
      status: "degraded",
      mongo: READY_STATE_LABEL[state] ?? `unknown(${state})`,
    });
  }
});

// Express error middleware: must be last and must have 4 params.
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error("Unhandled error:", err);
    res.status(500).send("Internal Server Error");
  },
);

const server = app.listen(port, () => {
  console.log(`Exporter listening on port ${port}`);
});

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
  await new Promise<void>((resolve) => server.close(() => resolve()));
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
