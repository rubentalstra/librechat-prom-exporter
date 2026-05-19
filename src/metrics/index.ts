import {updateBasicMetrics} from "./basicMetrics";
import {updateAdvancedMetrics} from "./advancedMetrics";
import {advancedGauges} from "./advancedMetrics";

const LOG_TIMINGS = process.env.LOG_TIMINGS === "1";

async function timed(group: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const durationSec = (Date.now() - start) / 1000;
    advancedGauges.exporterScrapeDurationSeconds.set(
      {metric_group: group},
      durationSec,
    );
    advancedGauges.exporterLastSuccessfulScrapeTimestamp.set(
      {metric_group: group},
      Math.floor(Date.now() / 1000),
    );
    if (LOG_TIMINGS) {
      console.log(`[timing] ${group} scrape took ${durationSec.toFixed(3)}s`);
    }
  } catch (err) {
    const durationSec = (Date.now() - start) / 1000;
    advancedGauges.exporterScrapeErrorsTotal.inc({metric_group: group});
    console.error(
      `[timing] ${group} scrape FAILED after ${durationSec.toFixed(3)}s:`,
      err,
    );
  }
}

let basicRunning = false;
let advancedRunning = false;

export async function updateBasicMetricsTimed(): Promise<void> {
  if (basicRunning) {
    console.log("[timing] basic scrape still running, skipping this tick");
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
    console.log("[timing] advanced scrape still running, skipping this tick");
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
