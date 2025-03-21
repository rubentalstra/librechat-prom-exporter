import { updateBasicMetrics } from './basicMetrics';
import { updateAdvancedMetrics } from './advancedMetrics';

export async function updateMetrics(): Promise<void> {
    // Run both updates concurrently.
    await Promise.all([updateBasicMetrics(), updateAdvancedMetrics()]);
}