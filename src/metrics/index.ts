import { updateBasicMetrics } from './basicMetrics';
import { updateAdvancedMetrics } from './advancedMetrics';

export async function updateMetrics(): Promise<void> {
    await updateBasicMetrics();
    await updateAdvancedMetrics();
}