const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    runtime: 'hydra-main',
    version: '1.0.0',
    agents: 14,
    products: 21,
    timestamp: new Date().toISOString(),
  });
});

router.get('/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'engineer', name: 'Engineer Agent', domain: 'General software engineering' },
      { id: 'security', name: 'Security Agent', domain: 'AppSec, vulnerability scanning' },
      { id: 'devops', name: 'DevOps Agent', domain: 'Infrastructure and deployment' },
      { id: 'data', name: 'Data Agent', domain: 'Data engineering and analytics' },
      { id: 'eda', name: 'Chip/EDA Agent', domain: 'Hardware design' },
      { id: 'quantum', name: 'Quantum Agent', domain: 'Quantum computing' },
      { id: 'soc', name: 'SOC Agent', domain: 'Security operations' },
      { id: 'threat-intel', name: 'Threat Intel Agent', domain: 'Threat intelligence' },
      { id: 'zero-trust', name: 'Zero Trust Agent', domain: 'Network security' },
      { id: 'test-engine', name: 'Test Engine Agent', domain: 'Test generation and orchestration' },
      { id: 'code-review', name: 'Code Review Agent', domain: 'Code review and style' },
      { id: 'release-manager', name: 'Release Manager Agent', domain: 'Release orchestration' },
      { id: 'api-designer', name: 'API Designer Agent', domain: 'API design and contracts' },
      { id: 'architecture-visualizer', name: 'Architecture Visualizer Agent', domain: 'Architecture docs' },
    ],
  });
});

router.get('/agents/:id', (req, res) => {
  const agents = {
    engineer: { id: 'engineer', name: 'Engineer Agent', domain: 'General software engineering' },
    security: { id: 'security', name: 'Security Agent', domain: 'AppSec, vulnerability scanning' },
    devops: { id: 'devops', name: 'DevOps Agent', domain: 'Infrastructure and deployment' },
    data: { id: 'data', name: 'Data Agent', domain: 'Data engineering and analytics' },
    eda: { id: 'eda', name: 'Chip/EDA Agent', domain: 'Hardware design' },
    quantum: { id: 'quantum', name: 'Quantum Agent', domain: 'Quantum computing' },
    soc: { id: 'soc', name: 'SOC Agent', domain: 'Security operations' },
    'threat-intel': { id: 'threat-intel', name: 'Threat Intel Agent', domain: 'Threat intelligence' },
    'zero-trust': { id: 'zero-trust', name: 'Zero Trust Agent', domain: 'Network security' },
    'test-engine': { id: 'test-engine', name: 'Test Engine Agent', domain: 'Test generation and orchestration' },
    'code-review': { id: 'code-review', name: 'Code Review Agent', domain: 'Code review and style' },
    'release-manager': { id: 'release-manager', name: 'Release Manager Agent', domain: 'Release orchestration' },
    'api-designer': { id: 'api-designer', name: 'API Designer Agent', domain: 'API design and contracts' },
    'architecture-visualizer': { id: 'architecture-visualizer', name: 'Architecture Visualizer Agent', domain: 'Architecture docs' },
  };
  const agent = agents[req.params.id];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agent });
});

router.post('/tasks', (req, res) => {
  const { goal, product, organizationId, userId, agentId, payload, maxRetries } = req.body;
  if (!goal || !product || !organizationId || !userId || !agentId) {
    return res.status(400).json({ error: 'goal, product, organizationId, userId, and agentId are required' });
  }
  const task = {
    id: `task-${Date.now()}`,
    goal,
    product,
    organizationId,
    userId,
    agentId,
    payload,
    maxRetries: maxRetries || 3,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  res.status(201).json({ task });
});

router.post('/tasks/:id/run', async (req, res) => {
  res.json({
    run: {
      id: `run-${Date.now()}`,
      taskId: req.params.id,
      status: 'completed',
      result: { message: 'Task executed (stub)' },
      completedAt: new Date().toISOString(),
    },
  });
});

router.get('/tasks/:id', (req, res) => {
  res.json({
    task: {
      id: req.params.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
});

router.get('/runs/:id', (req, res) => {
  res.json({
    run: {
      id: req.params.id,
      status: 'completed',
      result: { message: 'Run completed (stub)' },
      completedAt: new Date().toISOString(),
    },
  });
});

router.post('/models/select', (req, res) => {
  const { taskType, contextSize, budgetUsdPer1k, latencyTargetMs, preferredProvider } = req.body;
  res.json({
    selection: {
      provider: preferredProvider || 'openai',
      model: 'gpt-4o',
      reason: 'Default selection (stub)',
      estimatedCostPer1k: budgetUsdPer1k || 0.03,
      estimatedLatencyMs: latencyTargetMs || 500,
    },
  });
});

router.post('/memory', async (req, res) => {
  const entry = {
    id: `mem-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  res.status(201).json({ entry });
});

router.get('/memory', (req, res) => {
  const { type, scope, limit } = req.query;
  res.json({
    entries: [],
    filters: { type, scope, limit },
  });
});

router.post('/security/check', (req, res) => {
  const { action, scope, capabilities } = req.body;
  const allowed = capabilities && capabilities.some((c) => c.action === '*' || c.action === action);
  res.json({ allowed });
});

router.post('/projects/:id/graph', (req, res) => {
  res.json({ message: `Project ${req.params.id} registered` });
});

router.post('/projects/:id/dependencies', (req, res) => {
  res.json({ message: 'Dependency added' });
});

router.get('/projects/:id/dependencies/affected', (req, res) => {
  res.json({ affected: [] });
});

router.post('/organizations', (req, res) => {
  const { name, plan } = req.body;
  res.status(201).json({
    organization: {
      id: `org-${Date.now()}`,
      name,
      plan: plan || 'free',
      createdAt: new Date().toISOString(),
    },
  });
});

router.post('/organizations/:id/teams', (req, res) => {
  const { name } = req.body;
  res.status(201).json({
    team: {
      id: `team-${Date.now()}`,
      organizationId: req.params.id,
      name,
      createdAt: new Date().toISOString(),
    },
  });
});

router.post('/organizations/:id/users', (req, res) => {
  const user = {
    id: `user-${Date.now()}`,
    ...req.body,
    organizationId: req.params.id,
    createdAt: new Date().toISOString(),
  };
  res.status(201).json({ user });
});

router.get('/products', (req, res) => {
  res.json({
    products: [
      { id: 'alp-platform', name: 'ALP Platform', personas: ['engineer', 'security', 'devops'] },
      { id: 'alp-server', name: 'ALP Server', personas: ['engineer', 'devops'] },
      { id: 'hydra-main', name: 'HYDRA Main AI', personas: ['engineer', 'architecture-visualizer'] },
    ],
  });
});

router.get('/products/:id/agents', (req, res) => {
  res.json({
    productId: req.params.id,
    agents: ['engineer', 'security', 'devops'],
  });
});

router.post('/verification/check', async (req, res) => {
  const { gateId, score } = req.body;
  const result = {
    gateId,
    passed: typeof score === 'number' && score >= 0.8,
    score,
    threshold: 0.8,
    message: typeof score === 'number' && score >= 0.8 ? 'Passed' : 'Failed',
  };
  res.json({ result });
});

let toolRegistryPromise = null;
function getToolRegistry() {
  if (!toolRegistryPromise) {
    toolRegistryPromise = import('@autonomous-lifecycle-protocol-alp/hydra-main').then((m) => m.registerDefaultTools?.() || m.toolRegistry);
  }
  return toolRegistryPromise;
}

router.get('/tools', async (req, res) => {
  try {
    const registry = await getToolRegistry();
    const tools = registry.list().map((t) => ({ id: t.id, name: t.name, description: t.description, category: t.category }));
    res.json({ tools });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tools', details: err.message });
  }
});

router.get('/tools/:id', async (req, res) => {
  try {
    const registry = await getToolRegistry();
    const tool = registry.get(req.params.id);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    res.json({ tool: { id: tool.id, name: tool.name, description: tool.description, category: tool.category } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tool', details: err.message });
  }
});

router.post('/tools/:id/execute', async (req, res) => {
  try {
    const registry = await getToolRegistry();
    const tool = registry.get(req.params.id);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    const result = await tool.execute(req.body || {});
    res.json({ toolId: tool.id, result });
  } catch (err) {
    res.status(500).json({ error: 'Tool execution failed', details: err.message });
  }
});

module.exports = router;
