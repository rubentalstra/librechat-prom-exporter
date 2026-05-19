import { getConfig } from "../config.js";
import { logger } from "../logger.js";

import { advancedGauges, updateAdvancedMetrics } from "./advancedMetrics.js";
import { updateBasicMetrics } from "./basicMetrics.js";

async function timed(group: string, fn: () => Promise<void>): Promise<void> {
  const log = logger();
  const start = Date.now();
  try {
    await fn();
    const durationSec = (Date.now() - start) / 1000;
    advancedGauges.exporterScrapeDurationSeconds.set({ metric_group: group }, durationSec);
    advancedGauges.exporterLastSuccessfulScrapeTimestamp.set({ metric_group: group }, Math.floor(Date.now() / 1000));
    if (getConfig().LOG_TIMINGS) {
      log.info({ group, durationSec }, `${group} scrape completed`);
    }
  } catch (err) {
    const durationSec = (Date.now() - start) / 1000;
    advancedGauges.exporterScrapeErrorsTotal.inc({ metric_group: group });
    log.error({ group, durationSec, err }, `${group} scrape failed`);
  }
}

let basicRunning = false;
let advancedRunning = false;

export async function updateBasicMetricsTimed(): Promise<void> {
  if (basicRunning) {
    logger().warn("basic scrape still running, skipping this tick");
    return;
  }
  basicRunning = true;
  try {
    await timed("basic", updateBasicMetrics);
  } finally {
    basicRunning = false;
  }
}

export async function updateAdvancedMetricsTimed(): Promise<void> {
  if (advancedRunning) {
    logger().warn("advanced scrape still running, skipping this tick");
    return;
  }
  advancedRunning = true;
  try {
    await timed("advanced", updateAdvancedMetrics);
  } finally {
    advancedRunning = false;
  }
}

export async function updateMetrics(): Promise<void> {
  await Promise.all([updateBasicMetricsTimed(), updateAdvancedMetricsTimed()]);
}

export async function waitForIdle(timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!basicRunning && !advancedRunning) {
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
}
