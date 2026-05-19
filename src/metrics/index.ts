import { updateBasicMetrics } from './basicMetrics';
import { updateAdvancedMetrics } from './advancedMetrics';
import { advancedGauges } from './advancedMetrics';

async function timed(group: string, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
        await fn();
        const durationSec = (Date.now() - start) / 1000;
        advancedGauges.exporterScrapeDurationSeconds.set({ metric_group: group }, durationSec);
        advancedGauges.exporterLastSuccessfulScrapeTimestamp.set(
            { metric_group: group },
            Math.floor(Date.now() / 1000),
        );
    } catch (err) {
        advancedGauges.exporterScrapeErrorsTotal.inc({ metric_group: group });
        console.error(`Error in ${group} metrics scrape:`, err);
    }
}

export async function updateMetrics(): Promise<void> {
    // Run both updates concurrently.
    await Promise.all([
        timed('basic', updateBasicMetrics),
        timed('advanced', updateAdvancedMetrics),
    ]);
}