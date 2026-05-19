import express, { Request, Response } from "express";
import mongoose from "mongoose";
import client from "prom-client";
import "dotenv/config";
import { basicGauges } from "./metrics/basicMetrics";
import { advancedGauges } from "./metrics/advancedMetrics";

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

// Connect to MongoDB (adjust the URI as needed)
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/librechat";
const mongoPoolSize = parseInt(process.env.MONGO_POOL_SIZE || "50");
mongoose
  .connect(mongoURI, { maxPoolSize: mongoPoolSize })
  .then(() =>
    console.log(`Connected to MongoDB (maxPoolSize=${mongoPoolSize})`),
  )
  .catch((error: Error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

import { updateBasicMetricsTimed, updateAdvancedMetricsTimed } from "./metrics";
// Schedule basic and advanced updates on independent intervals to avoid
// advanced scrapes blocking the much cheaper basic ones.
setInterval(updateBasicMetricsTimed, refreshInterval);
setInterval(updateAdvancedMetricsTimed, advancedRefreshInterval);
import { envFlag } from "./metrics/util";
if (envFlag("LOG_TIMINGS", false)) {
  console.log(
    `[scheduler] basic every ${refreshInterval}ms, advanced every ${advancedRefreshInterval}ms`,
  );
}
updateBasicMetricsTimed();
updateAdvancedMetricsTimed();

// Expose the /metrics endpoint for Prometheus.
app.get("/metrics", async (req: Request, res: Response) => {
  try {
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
  } catch (error) {
    console.error("Error generating metrics:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Health check endpoint.
app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

// Start the Express server.
app.listen(port, () => {
  console.log(`Exporter listening on port ${port}`);
});
