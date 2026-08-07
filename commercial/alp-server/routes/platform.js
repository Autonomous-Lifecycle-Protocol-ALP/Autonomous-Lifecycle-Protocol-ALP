const express = require('express');
const { EnterprisePlatform } = require('@autonomous-lifecycle-protocol-alp/platform');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');
const { PlatformProject, PlatformDevice, PlatformPlan } = require('../models/Models');

const router = express.Router();
const platform = new EnterprisePlatform();

router.use(middleware.auth);

router.get('/vendors', asyncHandler((req, res) => {
  res.json(platform.vendors.listVendors());
}));

router.get('/frameworks', asyncHandler((req, res) => {
  res.json(platform.vendors.listFrameworks());
}));

router.get('/libraries', asyncHandler((req, res) => {
  res.json(platform.vendors.listLibraries());
}));

router.get('/projects', asyncHandler(async (req, res) => {
  const projects = await PlatformProject.find({ organization: req.orgId });
  res.json(projects);
}));

router.post('/projects', asyncHandler(async (req, res) => {
  const project = await PlatformProject.create({
    ...req.body,
    organization: req.orgId,
  });
  res.status(201).json(project);
}));

router.get('/projects/:id', asyncHandler(async (req, res) => {
  const project = await PlatformProject.findOne({ _id: req.params.id, organization: req.orgId });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
}));

router.put('/projects/:id', asyncHandler(async (req, res) => {
  const project = await PlatformProject.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
}));

router.delete('/projects/:id', asyncHandler(async (req, res) => {
  const project = await PlatformProject.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.status(204).send();
}));

router.get('/devices', asyncHandler(async (req, res) => {
  const devices = await PlatformDevice.find({ organization: req.orgId });
  res.json(devices);
}));

router.post('/devices', asyncHandler(async (req, res) => {
  const device = await PlatformDevice.create({
    ...req.body,
    organization: req.orgId,
  });
  res.status(201).json(device);
}));

router.get('/devices/:id', asyncHandler(async (req, res) => {
  const device = await PlatformDevice.findOne({ _id: req.params.id, organization: req.orgId });
  if (!device) return res.status(404).json({ message: 'Device not found' });
  res.json(device);
}));

router.put('/devices/:id', asyncHandler(async (req, res) => {
  const device = await PlatformDevice.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!device) return res.status(404).json({ message: 'Device not found' });
  res.json(device);
}));

router.delete('/devices/:id', asyncHandler(async (req, res) => {
  const device = await PlatformDevice.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
  if (!device) return res.status(404).json({ message: 'Device not found' });
  res.status(204).send();
}));

router.get('/plans', asyncHandler(async (req, res) => {
  const plans = await PlatformPlan.find({ organization: req.orgId });
  res.json(plans);
}));

router.post('/plans', asyncHandler(async (req, res) => {
  const plan = await PlatformPlan.create({
    ...req.body,
    organization: req.orgId,
  });
  res.status(201).json(plan);
}));

router.get('/plans/:id', asyncHandler(async (req, res) => {
  const plan = await PlatformPlan.findOne({ _id: req.params.id, organization: req.orgId });
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  res.json(plan);
}));

router.put('/plans/:id', asyncHandler(async (req, res) => {
  const plan = await PlatformPlan.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  res.json(plan);
}));

router.delete('/plans/:id', asyncHandler(async (req, res) => {
  const plan = await PlatformPlan.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  res.status(204).send();
}));

router.get('/llm/providers', asyncHandler((req, res) => {
  res.json(platform.llm.listProviders());
}));

router.get('/llm/agents', asyncHandler((req, res) => {
  res.json(platform.llm.listAgents());
}));

router.get('/llm/providers/health', asyncHandler((req, res) => {
  res.json(platform.llm.listProviderHealth());
}));

router.post('/llm/complete', asyncHandler(async (req, res) => {
  const { agentId, prompt, options } = req.body;
  const result = await platform.llm.complete(agentId, prompt, options);
  if (!result) return res.status(404).json({ message: 'Agent or provider not found' });
  res.json(result);
}));

router.post('/workflows', asyncHandler((req, res) => {
  platform.workflow.registerWorkflow(req.body);
  res.status(201).json({ message: 'Workflow registered' });
}));

router.get('/workflows', asyncHandler((req, res) => {
  res.json(platform.workflow.listWorkflows());
}));

router.get('/workflows/:id', asyncHandler((req, res) => {
  const workflow = platform.workflow.getWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
  res.json(workflow);
}));

router.post('/workflows/start', asyncHandler((req, res) => {
  const { workflowId, context } = req.body;
  const run = platform.workflow.startRun(workflowId, context);
  if (!run) return res.status(404).json({ message: 'Workflow not found' });
  res.status(201).json(run);
}));

router.get('/workflows/runs/:runId', asyncHandler((req, res) => {
  const run = platform.workflow.getRun(req.params.runId);
  if (!run) return res.status(404).json({ message: 'Run not found' });
  res.json(run);
}));

router.post('/workflows/runs/:runId/execute', asyncHandler(async (req, res) => {
  const run = await platform.workflow.executeAll(req.params.runId);
  if (!run) return res.status(404).json({ message: 'Run not found' });
  res.json(run);
}));

router.post('/workflows/runs/:runId/complete', asyncHandler((req, res) => {
  const { stepId, result } = req.body;
  const run = platform.workflow.completeStep(req.params.runId, stepId, result);
  if (!run) return res.status(404).json({ message: 'Run not found' });
  res.json(run);
}));

router.post('/workflows/runs/:runId/fail', asyncHandler((req, res) => {
  const { error } = req.body;
  const run = platform.workflow.failRun(req.params.runId, error);
  if (!run) return res.status(404).json({ message: 'Run not found' });
  res.json(run);
}));

router.post('/workflows/runs/:runId/cancel', asyncHandler((req, res) => {
  const run = platform.workflow.cancelRun(req.params.runId);
  if (!run) return res.status(404).json({ message: 'Run not found' });
  res.json(run);
}));

router.post('/research', asyncHandler((req, res) => {
  const { type, query } = req.body;
  const task = platform.research.createTask(type, query);
  res.status(201).json(task);
}));

router.get('/research', asyncHandler((req, res) => {
  res.json(platform.research.listTasks());
}));

router.post('/research/:id/execute', asyncHandler(async (req, res) => {
  const result = await platform.research.execute(req.params.id);
  if (!result) return res.status(404).json({ message: 'Research task not found' });
  res.json(result);
}));

router.post('/audit', asyncHandler((req, res) => {
  const entry = platform.audit.log(req.body);
  res.status(201).json(entry);
}));

router.get('/audit', asyncHandler((req, res) => {
  const { actor, action, startDate, endDate, limit } = req.query;
  const entries = platform.audit.getEntries({
    actor: typeof actor === 'string' ? actor : undefined,
    action: typeof action === 'string' ? action : undefined,
    startDate: typeof startDate === 'string' ? startDate : undefined,
    endDate: typeof endDate === 'string' ? endDate : undefined,
    limit: typeof limit === 'string' ? Number(limit) : undefined,
  });
  res.json(entries);
}));

router.post('/voice/sessions', asyncHandler((req, res) => {
  const session = platform.voice.startSession(req.body);
  res.status(201).json(session);
}));

router.post('/voice/sessions/:id/input', asyncHandler((req, res) => {
  const result = platform.voice.processInput(req.params.id, req.body);
  res.json(result);
}));

router.post('/distributed/nodes', asyncHandler((req, res) => {
  platform.distributed.registerNode(req.body);
  res.status(201).json({ message: 'Node registered' });
}));

router.get('/distributed/nodes', asyncHandler((req, res) => {
  res.json(platform.distributed.listNodes());
}));

router.post('/distributed/nodes/:id/heartbeat', asyncHandler(async (req, res) => {
  const alive = await platform.distributed.heartbeat(req.params.id);
  res.json({ alive });
}));

router.post('/distributed/tasks', asyncHandler((req, res) => {
  const task = platform.distributed.dispatchTask(req.body);
  if (!task) return res.status(400).json({ message: 'No available nodes' });
  res.status(201).json(task);
}));

router.post('/distributed/tasks/:id/run', asyncHandler(async (req, res) => {
  const task = await platform.distributed.runTask(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
}));

router.post('/safety/evaluate', asyncHandler(async (req, res) => {
  const result = await platform.safety.evaluate(req.body);
  res.status(201).json(result);
}));

router.get('/safety/policies', asyncHandler((req, res) => {
  res.json(platform.safety.getPolicies());
}));

router.post('/coding/tasks', asyncHandler((req, res) => {
  const { goal, successCriteria } = req.body;
  const task = platform.coding.createTask(goal, successCriteria);
  res.status(201).json(task);
}));

router.post('/coding/tasks/:id/execute', asyncHandler(async (req, res) => {
  const task = await platform.coding.execute(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
}));

router.get('/coding/tasks', asyncHandler((req, res) => {
  res.json(platform.coding.getActiveTasks());
}));

router.post('/self-improving/analyze', asyncHandler((req, res) => {
  const result = platform.selfImproving.analyzeCodebase(req.body?.path);
  res.json(result);
}));

router.post('/self-improving/fix', asyncHandler((req, res) => {
  const result = platform.selfImproving.applyFixes(req.body?.reviewId);
  res.json(result);
}));

router.post('/memory/query', asyncHandler((req, res) => {
  const results = platform.memory.query(req.body);
  res.json(results);
}));

router.get('/memory/context', asyncHandler((req, res) => {
  const context = platform.memory.getContextWindow();
  res.json(context);
}));

module.exports = router;
