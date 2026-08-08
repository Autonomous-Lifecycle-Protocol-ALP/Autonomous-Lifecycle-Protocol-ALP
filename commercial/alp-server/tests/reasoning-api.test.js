import { describe, it, expect } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import reasoningRoutes from '../routes/reasoning.js';

const app = express();
app.use(express.json());
app.use('/api/reasoning', reasoningRoutes);

describe('Commercial Reasoning Core REST API', () => {
  it('POST /api/reasoning/critique runs self-reflection critique', async () => {
    const res = await supertest(app)
      .post('/api/reasoning/critique')
      .send({
        content: '@policy name: "auth"\n!deprecated: "Use v2"\n@task id: "build"\n  status: [!]',
        targetType: 'SPEC',
        autoRefine: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report.overallScore).toBeLessThan(1.0);
    expect(res.body.report.defects.length).toBeGreaterThan(0);
    expect(res.body.refinedContent).toContain('[!] pending verification');
  });

  it('GET /api/reasoning/verify/:chainId verifies Merkle reasoning trace', async () => {
    const res = await supertest(app).get('/api/reasoning/verify/chain-8200');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.chainId).toBe('chain-8200');
    expect(res.body.verification.valid).toBe(true);
    expect(res.body.verification.stepCount).toBe(3);
    expect(res.body.steps.length).toBe(3);
  });

  it('POST /api/reasoning/negotiate resolves multi-agent task bids', async () => {
    const res = await supertest(app)
      .post('/api/reasoning/negotiate')
      .send({
        nodeIds: ['task-build', 'task-test'],
        bids: [
          { agentId: 'agent-fast', nodeId: 'task-build', capabilityScore: 0.8, estimatedCost: 100, riskScore: 0.1 },
          { agentId: 'agent-pro', nodeId: 'task-build', capabilityScore: 0.98, estimatedCost: 150, riskScore: 0.04 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.assignments.length).toBe(2);
    expect(res.body.assignments[0].winningAgentId).toBe('agent-pro');
  });
});
