import { beforeAll, afterAll, describe, test, expect } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let app;
let token;
let orgId;
let userId;
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({ binary: { version: '8.2.6' } });
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret';

  await mongoose.connect(uri);

  const { Organization, User } = require('../models/Models');

  await Organization.deleteMany({});
  await User.deleteMany({});

  const org = await Organization.create({
    name: 'Test Org',
    slug: 'test-org',
    plan: 'enterprise',
  });

  const password = await bcrypt.hash('demo123', 10);
  const user = await User.create({
    email: 'test@example.com',
    name: 'Test User',
    password,
    organization: org._id,
    role: 'owner',
  });

  orgId = org._id;
  userId = user._id;
  token = jwt.sign({ userId: user._id, orgId: org._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  app = require('../server');
}, 120000);

afterAll(async () => {
  if (mongod) {
    await mongoose.disconnect();
    await mongod.stop();
  }
});

const getAuthHeaders = () => ({
  Authorization: `Bearer ${token}`,
});

describe('Mobile API', () => {
  test('POST /api/mobile/sessions creates a session', async () => {
    const res = await request(app)
      .post('/api/mobile/sessions')
      .set(getAuthHeaders())
      .send({ platform: 'ios', deviceId: 'device-1', appVersion: '1.0.0' });
    expect(res.status).toBe(201);
    expect(res.body.platform).toBe('ios');
  });

  test('GET /api/mobile/sessions returns sessions', async () => {
    const res = await request(app)
      .get('/api/mobile/sessions')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/mobile/sessions/:id/push creates a notification', async () => {
    const sessions = await request(app)
      .get('/api/mobile/sessions')
      .set(getAuthHeaders());
    const sessionId = sessions.body[0]._id;
    const res = await request(app)
      .post(`/api/mobile/sessions/${sessionId}/push`)
      .set(getAuthHeaders())
      .send({ title: 'Test', body: 'Hello' });
    expect(res.status).toBe(201);
  });
});

describe('Analytics BI API', () => {
  test('POST /api/analytics-bi/dashboards creates a dashboard', async () => {
    const res = await request(app)
      .post('/api/analytics-bi/dashboards')
      .set(getAuthHeaders())
      .send({ name: 'Test Dashboard', slug: 'test-dashboard', widgets: [], filters: [] });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Dashboard');
  });

  test('GET /api/analytics-bi/dashboards returns dashboards', async () => {
    const res = await request(app)
      .get('/api/analytics-bi/dashboards')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PUT /api/analytics-bi/dashboards/:id updates a dashboard', async () => {
    const dashboards = await request(app)
      .get('/api/analytics-bi/dashboards')
      .set(getAuthHeaders());
    const dashboardId = dashboards.body[0]._id;
    const res = await request(app)
      .put(`/api/analytics-bi/dashboards/${dashboardId}`)
      .set(getAuthHeaders())
      .send({ name: 'Updated Dashboard' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Dashboard');
  });

  test('DELETE /api/analytics-bi/dashboards/:id deletes a dashboard', async () => {
    const dashboards = await request(app)
      .get('/api/analytics-bi/dashboards')
      .set(getAuthHeaders());
    const dashboardId = dashboards.body[0]._id;
    const res = await request(app)
      .delete(`/api/analytics-bi/dashboards/${dashboardId}`)
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
  });
});

describe('DevOps API', () => {
  test('POST /api/devops/pipelines creates a pipeline', async () => {
    const res = await request(app)
      .post('/api/devops/pipelines')
      .set(getAuthHeaders())
      .send({ name: 'CI Pipeline', provider: 'github', config: {} });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('CI Pipeline');
  });

  test('GET /api/devops/pipelines returns pipelines', async () => {
    const res = await request(app)
      .get('/api/devops/pipelines')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/devops/pipelines/:id/deploy creates a deployment', async () => {
    const pipelines = await request(app)
      .get('/api/devops/pipelines')
      .set(getAuthHeaders());
    const pipelineId = pipelines.body[0]._id;
    const res = await request(app)
      .post(`/api/devops/pipelines/${pipelineId}/deploy`)
      .set(getAuthHeaders())
      .send({ environment: 'staging', version: '1.0.0' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('deploying');
  });
});

describe('Model Hub API', () => {
  test('POST /api/model-hub/models registers a model', async () => {
    const res = await request(app)
      .post('/api/model-hub/models')
      .set(getAuthHeaders())
      .send({ name: 'Test Model', slug: 'test-model', provider: 'openai', task: 'code-review', baseModel: 'gpt-4o' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Model');
  });

  test('GET /api/model-hub/models returns models', async () => {
    const res = await request(app)
      .get('/api/model-hub/models')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/model-hub/routing-rules creates a rule', async () => {
    const models = await request(app)
      .get('/api/model-hub/models')
      .set(getAuthHeaders());
    const modelId = models.body[0]._id;
    const res = await request(app)
      .post('/api/model-hub/routing-rules')
      .set(getAuthHeaders())
      .send({ name: 'Default Rule', task: 'general', models: [{ modelId, weight: 1 }] });
    expect(res.status).toBe(201);
  });
});

describe('Data Pipeline API', () => {
  test('POST /api/data-pipeline/pipelines creates a pipeline', async () => {
    const res = await request(app)
      .post('/api/data-pipeline/pipelines')
      .set(getAuthHeaders())
      .send({ name: 'ETL Pipeline', description: 'Test', graph: {}, status: 'draft' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('ETL Pipeline');
  });

  test('GET /api/data-pipeline/pipelines returns pipelines', async () => {
    const res = await request(app)
      .get('/api/data-pipeline/pipelines')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/data-pipeline/pipelines/:id/run creates a run', async () => {
    const pipelines = await request(app)
      .get('/api/data-pipeline/pipelines')
      .set(getAuthHeaders());
    const pipelineId = pipelines.body[0]._id;
    const res = await request(app)
      .post(`/api/data-pipeline/pipelines/${pipelineId}/run`)
      .set(getAuthHeaders());
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('queued');
  });
});

describe('Hybrid Engineer API', () => {
  test('POST /api/hybrid-engineer/projects creates a project', async () => {
    const res = await request(app)
      .post('/api/hybrid-engineer/projects')
      .set(getAuthHeaders())
      .send({ name: 'Motor Controller', description: '', platform: 'stm32', firmware: {}, bom: [], status: 'draft' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Motor Controller');
  });

  test('GET /api/hybrid-engineer/projects returns projects', async () => {
    const res = await request(app)
      .get('/api/hybrid-engineer/projects')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/hybrid-engineer/projects/:id/simulate creates a simulation', async () => {
    const projects = await request(app)
      .get('/api/hybrid-engineer/projects')
      .set(getAuthHeaders());
    const projectId = projects.body[0]._id;
    const res = await request(app)
      .post(`/api/hybrid-engineer/projects/${projectId}/simulate`)
      .set(getAuthHeaders())
      .send({ type: 'thermal', input: {} });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('queued');
  });
});

describe('Quantum Engineer API', () => {
  test('POST /api/quantum-engineer/circuits creates a circuit', async () => {
    const res = await request(app)
      .post('/api/quantum-engineer/circuits')
      .set(getAuthHeaders())
      .send({ name: 'Bell State', qubits: 2, provider: 'ibm', gates: [], status: 'draft' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Bell State');
  });

  test('GET /api/quantum-engineer/circuits returns circuits', async () => {
    const res = await request(app)
      .get('/api/quantum-engineer/circuits')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/quantum-engineer/circuits/:id/submit creates a job', async () => {
    const circuits = await request(app)
      .get('/api/quantum-engineer/circuits')
      .set(getAuthHeaders());
    const circuitId = circuits.body[0]._id;
    const res = await request(app)
      .post(`/api/quantum-engineer/circuits/${circuitId}/submit`)
      .set(getAuthHeaders())
      .send({ shots: 1024 });
    expect(res.status).toBe(201);
  });
});

describe('Chip Design API', () => {
  test('POST /api/chip-design/designs creates a design', async () => {
    const res = await request(app)
      .post('/api/chip-design/designs')
      .set(getAuthHeaders())
      .send({ name: 'RISC-V Core', technology: '28nm', status: 'rtl', rtl: {}, synthesis: {}, pnr: {}, sta: {} });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('RISC-V Core');
  });

  test('GET /api/chip-design/designs returns designs', async () => {
    const res = await request(app)
      .get('/api/chip-design/designs')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/chip-design/designs/:id/synthesize updates design status', async () => {
    const designs = await request(app)
      .get('/api/chip-design/designs')
      .set(getAuthHeaders());
    const designId = designs.body[0]._id;
    const res = await request(app)
      .post(`/api/chip-design/designs/${designId}/synthesize`)
      .set(getAuthHeaders())
      .send({ tool: 'yosys' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('synthesis');
  });
});

describe('SOC Sentinel API', () => {
  test('POST /api/soc-sentinel/alerts creates an alert', async () => {
    const res = await request(app)
      .post('/api/soc-sentinel/alerts')
      .set(getAuthHeaders())
      .send({ title: 'Suspicious Login', severity: 'medium', description: '', category: 'auth', status: 'open' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Suspicious Login');
  });

  test('GET /api/soc-sentinel/alerts returns alerts', async () => {
    const res = await request(app)
      .get('/api/soc-sentinel/alerts')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/soc-sentinel/alerts/:id/resolve resolves an alert', async () => {
    const alerts = await request(app)
      .get('/api/soc-sentinel/alerts')
      .set(getAuthHeaders());
    const alertId = alerts.body[0]._id;
    const res = await request(app)
      .post(`/api/soc-sentinel/alerts/${alertId}/resolve`)
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
  });
});

describe('Threat Intel API', () => {
  test('POST /api/threat-intel/reports creates a report', async () => {
    const res = await request(app)
      .post('/api/threat-intel/reports')
      .set(getAuthHeaders())
      .send({ title: 'Q3 Threat Report', status: 'draft', iocs: [], threatActors: [], affectedAssets: [], cvssScores: [], remediation: [] });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Q3 Threat Report');
  });

  test('GET /api/threat-intel/reports returns reports', async () => {
    const res = await request(app)
      .get('/api/threat-intel/reports')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/threat-intel/reports/:id/publish publishes a report', async () => {
    const reports = await request(app)
      .get('/api/threat-intel/reports')
      .set(getAuthHeaders());
    const reportId = reports.body[0]._id;
    const res = await request(app)
      .post(`/api/threat-intel/reports/${reportId}/publish`)
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
  });
});

describe('Zero Trust API', () => {
  test('POST /api/zero-trust/identities creates an identity', async () => {
    const res = await request(app)
      .post('/api/zero-trust/identities')
      .set(getAuthHeaders())
      .send({ subject: 'svc-data-plane', type: 'service', spiiffeId: 'spiffe://alp.io/service/svc-data-plane', policy: {} });
    expect(res.status).toBe(201);
    expect(res.body.subject).toBe('svc-data-plane');
  });

  test('GET /api/zero-trust/identities returns identities', async () => {
    const res = await request(app)
      .get('/api/zero-trust/identities')
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/zero-trust/identities/:id/authenticate updates identity', async () => {
    const identities = await request(app)
      .get('/api/zero-trust/identities')
      .set(getAuthHeaders());
    const identityId = identities.body[0]._id;
    const res = await request(app)
      .post(`/api/zero-trust/identities/${identityId}/authenticate`)
      .set(getAuthHeaders());
    expect(res.status).toBe(200);
    expect(res.body.lastAuthenticatedAt).toBeTruthy();
  });
});
