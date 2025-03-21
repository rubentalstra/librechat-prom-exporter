import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import client from 'prom-client';
import { updateMetrics } from './metrics';
import { basicGauges } from './metrics/basicMetrics';
import { advancedGauges } from './metrics/advancedMetrics';

const app = express();
const port = process.env.PORT || 3000;

// Create a Prometheus registry and collect default metrics.
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Register basic gauges.
for (const gauge of Object.values(basicGauges)) {
    register.registerMetric(gauge);
}

// Register advanced gauges.
for (const gauge of Object.values(advancedGauges)) {
    register.registerMetric(gauge);
}

// Connect to MongoDB (adjust the URI as needed)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/librechat';
mongoose
    .connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error: Error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Schedule metric updates every 30 seconds.
setInterval(updateMetrics, 30000);
updateMetrics(); // Initial update

// Expose the /metrics endpoint for Prometheus.
app.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

// Health check endpoint.
app.get('/health', (req: Request, res: Response) => {
    res.send('OK');
});

// Start the Express server.
app.listen(port, () => {
    console.log(`Exporter listening on port ${port}`);
});