import express from "express";
import { Orchestrator } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { Scheduler } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { AgentRegistry } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { ModelRouter } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { ContextEngine } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { SecurityKernel } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { AuditLogger } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { SandboxManager } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { KillSwitch } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { TenantManager, BillingManager } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { MemoryRetriever, sessionStore } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { EvolutionEngine } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { ToolRegistry, toolRegistry, registerDefaultTools } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { QualityGateEngine } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import { PRODUCTS, getPersonasForProduct } from "@autonomous-lifecycle-protocol-alp/hydra-main";
import type { Task, SecurityContext } from "@autonomous-lifecycle-protocol-alp/hydra-main";

registerDefaultTools();

const router = express.Router();

const agentRegistry = new AgentRegistry();
const modelRouter = new ModelRouter();
const orchestrator = new Orchestrator(undefined, {
  agentRegistry,
  modelRouter,
  toolRegistry,
});
const scheduler = new Scheduler(orchestrator);
const contextEngine = new ContextEngine();
const securityKernel = new SecurityKernel();
const tenantManager = new TenantManager();
const billingManager = new BillingManager();
const auditLogger = new AuditLogger();
const sandboxManager = new SandboxManager();
const killSwitch = new KillSwitch();
const memoryRetriever = new MemoryRetriever(sessionStore);
const qualityGateEngine = new QualityGateEngine();
const evolutionEngine = new EvolutionEngine(agentRegistry, toolRegistry);

scheduler.start();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    runtime: "hydra-main",
    version: "1.0.0",
    agents: agentRegistry.list().length,
    products: PRODUCTS.length,
    timestamp: new Date().toISOString(),
  });
});

router.get("/agents", (req, res) => {
  res.json({ agents: agentRegistry.list() });
});

router.get("/agents/:id", (req, res) => {
  const agent = agentRegistry.get(req.params.id);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  res.json({ agent });
});

router.get("/tasks", (req, res) => {
  const { status } = req.query;
  const tasks = orchestrator.listTasks(status as Task["status"]);
  res.json({ tasks });
});

router.post("/tasks", (req, res) => {
  const { goal, product, organizationId, userId, agentId, payload, maxRetries } = req.body;
  if (!goal || !product || !organizationId || !userId || !agentId) {
    return res.status(400).json({ error: "goal, product, organizationId, userId, and agentId are required" });
  }
  const task = orchestrator.createTask({
    goal,
    product,
    organizationId,
    userId,
    agentId,
    payload,
    maxRetries,
  });
  res.status(201).json({ task });
});

router.post("/tasks/:id/run", async (req, res) => {
  try {
    const run = await orchestrator.runTask(req.params.id);
    res.json({ run });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/tasks/:id", (req, res) => {
  const task = orchestrator.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json({ task });
});

router.get("/runs/:id", (req, res) => {
  const run = orchestrator.getRun(req.params.id);
  if (!run) return res.status(404).json({ error: "Run not found" });
  res.json({ run });
});

router.post("/models/select", (req, res) => {
  const { taskType, contextSize, budgetUsdPer1k, latencyTargetMs, preferredProvider } = req.body;
  const selection = modelRouter.select({
    taskType: taskType || "simple",
    contextSize: contextSize || 1000,
    budgetUsdPer1k,
    latencyTargetMs,
    preferredProvider,
  });
  res.json({ selection });
});

router.post("/memory", async (req, res) => {
  const entry = await toolRegistry.get("memory-store")?.execute({ action: "put", ...req.body });
  res.status(201).json({ entry });
});

router.get("/memory", async (req, res) => {
  const { type, scope, limit } = req.query;
  const entries = await toolRegistry.get("memory-store")?.execute({
    action: "query",
    type: type as string,
    scope: scope as string,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ entries: entries || [] });
});

router.post("/security/check", (req, res) => {
  const { userId, organizationId, action, scope, capabilities } = req.body;
  const context = { userId, organizationId, capabilities: capabilities || [] };
  const allowed = securityKernel.check(context, action, scope);
  res.json({ allowed });
});

router.post("/projects/:id/graph", (req, res) => {
  contextEngine.registerProject(req.params.id);
  res.json({ message: `Project ${req.params.id} registered` });
});

router.post("/projects/:id/dependencies", (req, res) => {
  const { source, target, type } = req.body;
  contextEngine.addDependency(req.params.id, { source, target, type });
  res.json({ message: "Dependency added" });
});

router.get("/projects/:id/dependencies/affected", (req, res) => {
  const { node } = req.query;
  const affected = contextEngine.getAffectedNodes(req.params.id, node as string);
  res.json({ affected });
});

router.post("/organizations", (req, res) => {
  const { name, plan } = req.body;
  const org = tenantManager.createOrganization(name, plan);
  res.status(201).json({ organization: org });
});

router.post("/organizations/:id/teams", (req, res) => {
  const { name } = req.body;
  const team = tenantManager.createTeam(req.params.id, name);
  res.status(201).json({ team });
});

router.post("/organizations/:id/users", (req, res) => {
  const user = tenantManager.addUser(req.body);
  res.status(201).json({ user });
});

router.get("/products", (req, res) => {
  res.json({ products: PRODUCTS });
});

router.get("/products/:id/agents", (req, res) => {
  const agents = getPersonasForProduct(req.params.id);
  res.json({ agents });
});

router.get("/tools", async (req, res) => {
  try {
    const tools = toolRegistry.list().map((t) => ({ id: t.id, name: t.name, description: t.description, category: t.category }));
    res.json({ tools });
  } catch (err) {
    res.status(500).json({ error: "Failed to load tools", details: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/tools/:id", async (req, res) => {
  try {
    const tool = toolRegistry.get(req.params.id);
    if (!tool) return res.status(404).json({ error: "Tool not found" });
    res.json({ tool: { id: tool.id, name: tool.name, description: tool.description, category: tool.category } });
  } catch (err) {
    res.status(500).json({ error: "Failed to load tool", details: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/tools/:id/execute", async (req, res) => {
  try {
    const tool = toolRegistry.get(req.params.id);
    if (!tool) return res.status(404).json({ error: "Tool not found" });
    const result = await tool.execute(req.body || {});
    res.json({ toolId: tool.id, result });
  } catch (err) {
    res.status(500).json({ error: "Tool execution failed", details: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/verification/check", async (req, res) => {
  const { gateId, score } = req.body;
  const result = await qualityGateEngine.verify(gateId, { score });
  res.json({ result });
});

router.get("/audit", (_req, res) => {
  res.json({ events: auditLogger.query({}) });
});

router.post("/audit/log", (req, res) => {
  const entry = auditLogger.log(req.body);
  res.status(201).json({ entry });
});

router.get("/audit/verify", (_req, res) => {
  res.json({ valid: auditLogger.verify() });
});

router.get("/sandboxes", (_req, res) => {
  res.json({ sandboxes: sandboxManager.list() });
});

router.post("/sandboxes", (req, res) => {
  sandboxManager
    .create(req.body)
    .then((sandbox) => res.status(201).json({ sandbox }))
    .catch((err) => res.status(400).json({ error: err instanceof Error ? err.message : String(err) }));
});

router.delete("/sandboxes/:id", (req, res) => {
  const destroyed = sandboxManager.destroy(req.params.id);
  if (!destroyed) return res.status(404).json({ error: "Sandbox not found" });
  res.json({ destroyed: true });
});

router.get("/killswitch", (_req, res) => {
  res.json({ active: killSwitch.listActive(), history: killSwitch.history() });
});

router.post("/killswitch/activate", (req, res) => {
  const { reason, scope, targetId, metadata } = req.body;
  const event = killSwitch.activate(reason, scope, targetId, metadata);
  res.status(201).json({ event });
});

router.post("/killswitch/deactivate/:id", (req, res) => {
  const deactivated = killSwitch.deactivate(req.params.id);
  res.json({ deactivated });
});

router.get("/billing/usage", (req, res) => {
  const { organizationId, metric } = req.query;
  if (!organizationId) return res.status(400).json({ error: "organizationId required" });
  res.json({ usage: billingManager.getUsage(organizationId as string, metric as string) });
});

router.post("/billing/usage", (req, res) => {
  const { organizationId, metric, amount, unit, costUsd, metadata } = req.body;
  const record = billingManager.recordUsage(organizationId, metric, amount, unit, costUsd, metadata);
  res.status(201).json({ record });
});

router.get("/billing/invoices/:orgId", (req, res) => {
  res.json({ invoices: billingManager.getInvoices(req.params.orgId) });
});

router.get("/billing/subscription/:orgId", (req, res) => {
  const sub = billingManager.getSubscription(req.params.orgId);
  if (!sub) return res.status(404).json({ error: "No subscription found" });
  res.json({ subscription: sub });
});

router.get("/memory/search", async (req, res) => {
  const { semantic, keyword, scope, type, limit } = req.query;
  const results = await memoryRetriever.search({
    semantic: semantic as string | undefined,
    keyword: keyword as string | undefined,
    scope: scope as string | undefined,
    type: type as string | undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ results });
});

router.post("/security/check", (req, res) => {
  const { context, action, scope: secScope } = req.body;
  const granted = securityKernel.check(context as SecurityContext, action, secScope);
  res.json({ granted });
});

router.get("/evolution/candidates", (_req, res) => {
  res.json({ candidates: evolutionEngine.getCandidates() });
});

router.get("/evolution/candidates/:agentId", (req, res) => {
  res.json({ candidates: evolutionEngine.getCandidates(req.params.agentId) });
});

router.get("/evolution/evaluations", (_req, res) => {
  res.json({ evaluations: evolutionEngine.getBenchmarks() });
});

router.post("/evolution/promote/:candidateId", (req, res) => {
  const promoted = evolutionEngine.promoteCandidate(req.params.candidateId);
  res.json({ promoted });
});

export default router;
