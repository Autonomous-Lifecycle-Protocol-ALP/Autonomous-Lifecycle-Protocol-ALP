import { describe, it, expect } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import telemetryRoutes from '../routes/telemetry.js';

const app = express();
app.use(express.json());
app.use('/api/telemetry', telemetryRoutes);

describe('Commercial Telemetry REST API', () => {
  it('GET /api/telemetry/stream returns system health and protocol events', async () => {
    const res = await supertest(app).get('/api/telemetry/stream');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.systemHealth.status).toBe('HEALTHY');
    expect(res.body.systemHealth.uptimePercentage).toBe(99.98);
    expect(res.body.events.length).toBeGreaterThan(0);
  });
});
