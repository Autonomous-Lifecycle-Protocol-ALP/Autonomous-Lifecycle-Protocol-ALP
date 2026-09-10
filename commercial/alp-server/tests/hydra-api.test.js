import { beforeAll, afterAll, describe, test, expect } from 'vitest';
import request from 'supertest';

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.MONGO_URI = 'mongodb://localhost:27017/hydra-test';
  app = require('../server');
}, 120000);

describe('HYDRA API', () => {
  test('GET /api/hydra/health returns status', async () => {
    const res = await request(app).get('/api/hydra/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.agents).toBe(14);
    expect(res.body.products).toBe(24);
  });

  test('GET /api/hydra/agents returns agent list', async () => {
    const res = await request(app).get('/api/hydra/agents');
    expect(res.status).toBe(200);
    expect(res.body.agents).toHaveLength(14);
    expect(res.body.agents[0].id).toBe('engineer');
  });

  test('GET /api/hydra/agents/:id returns single agent', async () => {
    const res = await request(app).get('/api/hydra/agents/engineer');
    expect(res.status).toBe(200);
    expect(res.body.agent.id).toBe('engineer');
    expect(res.body.agent.name).toBe('Engineer Agent');
  });

  test('GET /api/hydra/agents/:id returns 404 for unknown agent', async () => {
    const res = await request(app).get('/api/hydra/agents/unknown');
    expect(res.status).toBe(404);
  });

  test('POST /api/hydra/tasks creates a task', async () => {
    const res = await request(app).post('/api/hydra/tasks').send({
      goal: 'deploy service',
      product: 'alp-platform',
      organizationId: 'org-1',
      userId: 'user-1',
      agentId: 'engineer',
    });
    expect(res.status).toBe(201);
    expect(res.body.task.status).toBe('pending');
    expect(res.body.task.id).toBeDefined();
  });

  test('POST /api/hydra/tasks returns 400 when missing fields', async () => {
    const res = await request(app).post('/api/hydra/tasks').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/hydra/tasks creates and GET /api/hydra/tasks/:id retrieves it', async () => {
    const createRes = await request(app).post('/api/hydra/tasks').send({
      goal: 'run tests',
      product: 'alp-platform',
      organizationId: 'org-1',
      userId: 'user-1',
      agentId: 'engineer',
    });
    expect(createRes.status).toBe(201);
    const taskId = createRes.body.task.id;

    const res = await request(app).get(`/api/hydra/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.task.id).toBe(taskId);
    expect(res.body.task.goal).toBe('run tests');
  });

  test('GET /api/hydra/tasks/:id returns 404 for unknown task', async () => {
    const res = await request(app).get('/api/hydra/tasks/nonexistent-id');
    expect(res.status).toBe(404);
  });

  test('GET /api/hydra/tasks lists all tasks', async () => {
    const res = await request(app).get('/api/hydra/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test('GET /api/hydra/tools lists tools', async () => {
    const res = await request(app).get('/api/hydra/tools');
    expect(res.status).toBe(200);
    expect(res.body.tools.length).toBeGreaterThan(10);
    expect(res.body.tools.some((t) => t.id === 'sast-scanner')).toBe(true);
  });

  test('GET /api/hydra/tools/:id returns tool metadata', async () => {
    const res = await request(app).get('/api/hydra/tools/sast-scanner');
    expect(res.status).toBe(200);
    expect(res.body.tool.id).toBe('sast-scanner');
    expect(res.body.tool.category).toBe('security');
  });

  test('POST /api/hydra/tools/:id/execute runs a tool', async () => {
    const res = await request(app).post('/api/hydra/tools/sast-scanner/execute').send({
      path: '/src',
      language: 'typescript',
    });
    expect(res.status).toBe(200);
    expect(res.body.toolId).toBe('sast-scanner');
    expect(res.body.result.findings.length).toBeGreaterThan(0);
  });

  test('POST /api/hydra/tools/:id/execute returns 404 for unknown tool', async () => {
    const res = await request(app).post('/api/hydra/tools/unknown/execute').send({});
    expect(res.status).toBe(404);
  });

  test('GET /api/hydra/products returns product list', async () => {
    const res = await request(app).get('/api/hydra/products');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  test('GET /api/hydra/products/:id/agents returns product agents', async () => {
    const res = await request(app).get('/api/hydra/products/alp-platform/agents');
    expect(res.status).toBe(200);
    expect(res.body.agents.length).toBeGreaterThan(0);
  });
});
