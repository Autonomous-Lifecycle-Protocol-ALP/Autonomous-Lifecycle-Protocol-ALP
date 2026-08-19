import express, { type Application, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import {
  Orchestrator,
  InMemoryEventBus,
  Scheduler,
  ContextEngine,
  SecurityKernel,
  TenantManager,
  BillingManager,
  AuditLogger,
  SandboxManager,
  KillSwitch,
  MemoryRetriever,
  EvolutionEngine,
  registerDefaultTools,
  agentRegistry,
  ModelRouter,
  sessionStore,
  QualityGateEngine,
  PRODUCTS,
  getProductConfig,
  getPersonasForProduct,
  PRODUCT_WORKFLOWS,
  getProductWorkflow,
} from "./index";

export interface HydraServerOptions {
  port?: number;
  startScheduler?: boolean;
  schedulerIntervalMs?: number;
}

export function createHydraServer(options: HydraServerOptions = {}): Application {
  const { startScheduler = true, schedulerIntervalMs = 1000 } = options;

  const app: Application = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  const eventBus = new InMemoryEventBus();
  const modelRouter = new ModelRouter();
  const toolRegistry = registerDefaultTools();
  const orchestrator = new Orchestrator(eventBus, {
    agentRegistry,
    modelRouter,
    toolRegistry,
  });
  const scheduler = new Scheduler(orchestrator, {
    maxConcurrent: 10,
    queueIntervalMs: schedulerIntervalMs,
  });
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

  if (startScheduler) {
    scheduler.start();
  }

  app.get("/api/hydra/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      runningTasks: scheduler.getRunningCount(),
    });
  });

  app.get("/api/hydra/agents", (_req: Request, res: Response) => {
    res.json(agentRegistry.list());
  });

  app.get("/api/hydra/agents/:id", (req: Request, res: Response) => {
    const persona = agentRegistry.get(req.params.id);
    if (!persona) {
      return res.status(404).json({ error: `Agent persona ${req.params.id} not found` });
    }
    res.json(persona);
  });

  app.post("/api/hydra/tasks", (req: Request, res: Response) => {
    try {
      const body = req.body;
      const task = orchestrator.createTask({
        goal: body.goal,
        product: body.product,
        organizationId: body.organizationId,
        userId: body.userId,
        agentId: body.agentId,
        priority: body.priority,
        payload: body.payload,
        maxRetries: body.maxRetries,
        teamId: body.teamId,
      });
      res.status(201).json(task);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error });
    }
  });

  app.post("/api/hydra/tasks/:id/run", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await orchestrator.runTask(req.params.id);
      res.json(run);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/hydra/tasks/:id", (req: Request, res: Response) => {
    const task = orchestrator.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }
    res.json(task);
  });

  app.get("/api/hydra/runs/:id", (req: Request, res: Response) => {
    const run = orchestrator.getRun(req.params.id);
    if (!run) {
      return res.status(404).json({ error: `Run ${req.params.id} not found` });
    }
    res.json(run);
  });

  app.post("/api/hydra/models/select", (req: Request, res: Response) => {
    const selection = modelRouter.select({
      taskType: req.body.taskType ?? "coding",
      contextSize: req.body.contextSize ?? 4000,
      budgetUsdPer1k: req.body.budgetUsdPer1k,
      latencyTargetMs: req.body.latencyTargetMs,
      preferredProvider: req.body.preferredProvider,
    });
    res.json(selection);
  });

  app.post("/api/hydra/memory", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      const entry = await sessionStore.put({
        type: body.type,
        key: body.key,
        value: body.value,
        importance: body.importance ?? "medium",
        scope: body.scope,
        source: body.source,
        ttl: body.ttl,
        tokensEstimate: body.tokensEstimate,
      });
      res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/hydra/memory", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entries = await sessionStore.query({
        type: req.query.type as string | undefined,
        scope: req.query.scope as string | undefined,
        key: req.query.key as string | undefined,
        importance: req.query.importance as any,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json(entries);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/hydra/security/check", (req: Request, res: Response) => {
    const { context, action, scope } = req.body;
    const granted = securityKernel.check(context, action, scope);
    res.json({ granted });
  });

  app.post("/api/hydra/projects/:id/graph", (req: Request, res: Response) => {
    const projectId = req.params.id;
    contextEngine.registerProject(projectId);
    if (req.body.nodes) {
      for (const node of req.body.nodes) {
        contextEngine.addDependency(projectId, { source: node, target: node, type: "imports" });
      }
    }
    res.status(201).json({ projectId, graph: contextEngine.getGraph(projectId) });
  });

  app.post("/api/hydra/projects/:id/dependencies", (req: Request, res: Response) => {
    contextEngine.addDependency(req.params.id, req.body);
    res.status(201).json({ registered: true });
  });

  app.get("/api/hydra/projects/:id/dependencies/affected", (req: Request, res: Response) => {
    const changedNode = req.query.changedNode as string;
    if (!changedNode) {
      return res.status(400).json({ error: "changedNode query parameter required" });
    }
    const affected = contextEngine.getAffectedNodes(req.params.id, changedNode);
    res.json({ affected });
  });

  app.post("/api/hydra/organizations", (req: Request, res: Response) => {
    const org = tenantManager.createOrganization(req.body.name, req.body.plan);
    res.status(201).json(org);
  });

  app.post("/api/hydra/organizations/:id/teams", (req: Request, res: Response) => {
    const team = tenantManager.createTeam(req.params.id, req.body.name);
    res.status(201).json(team);
  });

  app.post("/api/hydra/organizations/:id/users", (req: Request, res: Response) => {
    const user = tenantManager.addUser({
      email: req.body.email,
      name: req.body.name,
      organizationId: req.params.id,
      teamIds: req.body.teamIds ?? [],
      role: req.body.role ?? "member",
    });
    res.status(201).json(user);
  });

  app.get("/api/hydra/products", (_req: Request, res: Response) => {
    res.json(PRODUCTS);
  });

  app.get("/api/hydra/products/:id/agents", (req: Request, res: Response) => {
    const config = getProductConfig(req.params.id);
    if (!config) {
      return res.status(404).json({ error: `Product ${req.params.id} not found` });
    }
    res.json(getPersonasForProduct(req.params.id));
  });

  app.get("/api/hydra/tools", (_req: Request, res: Response) => {
    res.json(toolRegistry.list());
  });

  app.get("/api/hydra/tools/:id", (req: Request, res: Response) => {
    const tool = toolRegistry.get(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: `Tool ${req.params.id} not found` });
    }
    res.json({ id: tool.id, name: tool.name, description: tool.description, category: tool.category, requiredCapabilities: tool.requiredCapabilities });
  });

  app.post("/api/hydra/tools/:id/execute", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tool = toolRegistry.get(req.params.id);
      if (!tool) {
        return res.status(404).json({ error: `Tool ${req.params.id} not found` });
      }
      const result = await tool.execute(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/hydra/verification/check", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gateId, input } = req.body;
      const result = await qualityGateEngine.verify(gateId, input);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/hydra/workflows", (_req: Request, res: Response) => {
    res.json(PRODUCT_WORKFLOWS);
  });

  app.get("/api/hydra/workflows/:productId", (req: Request, res: Response) => {
    const workflow = getProductWorkflow(req.params.productId);
    if (!workflow) {
      return res.status(404).json({ error: `No workflow for product ${req.params.productId}` });
    }
    res.json(workflow);
  });

  app.post("/api/hydra/workflows/:productId/execute", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workflow = getProductWorkflow(req.params.productId);
      if (!workflow) {
        return res.status(404).json({ error: `No workflow for product ${req.params.productId}` });
      }
      const executed: { stepId: string; toolId: string; result: unknown }[] = [];
      for (const step of workflow.steps) {
        const tool = toolRegistry.get(step.toolId);
        if (!tool) {
          executed.push({ stepId: step.stepId, toolId: step.toolId, result: { error: `Tool ${step.toolId} not registered` } });
          if (step.required) break;
          continue;
        }
        try {
          const result = await tool.execute(req.body);
          executed.push({ stepId: step.stepId, toolId: step.toolId, result });
        } catch (err) {
          executed.push({ stepId: step.stepId, toolId: step.toolId, result: { error: err instanceof Error ? err.message : String(err) } });
          if (step.required) break;
        }
      }
      res.json({ productId: req.params.productId, workflow: workflow.name, executed });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/hydra/sandboxes/:id", (req: Request, res: Response) => {
    const destroyed = sandboxManager.destroy(req.params.id);
    if (!destroyed) {
      return res.status(404).json({ error: `Sandbox ${req.params.id} not found` });
    }
    res.json({ destroyed: true });
  });

  app.get("/api/hydra/sandboxes", (_req: Request, res: Response) => {
    res.json(sandboxManager.list());
  });

  app.post("/api/hydra/sandboxes", (req: Request, res: Response) => {
    sandboxManager
      .create(req.body)
      .then((sandbox) => res.status(201).json(sandbox))
      .catch((err) => res.status(400).json({ error: err instanceof Error ? err.message : String(err) }));
  });

  app.get("/api/hydra/audit", (_req: Request, res: Response) => {
    res.json(auditLogger.query({}));
  });

  app.post("/api/hydra/audit/log", (req: Request, res: Response) => {
    const entry = auditLogger.log(req.body);
    res.status(201).json(entry);
  });

  app.get("/api/hydra/killswitch", (_req: Request, res: Response) => {
    res.json({ active: killSwitch.listActive(), history: killSwitch.history() });
  });

  app.post("/api/hydra/killswitch/activate", (req: Request, res: Response) => {
    const { reason, scope, targetId, metadata } = req.body;
    const event = killSwitch.activate(reason, scope, targetId, metadata);
    res.status(201).json(event);
  });

  app.post("/api/hydra/killswitch/deactivate/:id", (req: Request, res: Response) => {
    const deactivated = killSwitch.deactivate(req.params.id);
    res.json({ deactivated });
  });

  app.get("/api/hydra/billing/usage", (req: Request, res: Response) => {
    const { organizationId, metric } = req.query;
    if (!organizationId) {
      return res.status(400).json({ error: "organizationId query parameter required" });
    }
    res.json(billingManager.getUsage(organizationId as string, metric as string | undefined));
  });

  app.post("/api/hydra/billing/usage", (req: Request, res: Response) => {
    const { organizationId, metric, amount, unit, costUsd, metadata } = req.body;
    const record = billingManager.recordUsage(organizationId, metric, amount, unit, costUsd, metadata);
    res.status(201).json(record);
  });

  app.get("/api/hydra/billing/invoices/:orgId", (req: Request, res: Response) => {
    res.json(billingManager.getInvoices(req.params.orgId));
  });

  app.get("/api/hydra/billing/subscription/:orgId", (req: Request, res: Response) => {
    const sub = billingManager.getSubscription(req.params.orgId);
    if (!sub) {
      return res.status(404).json({ error: "No subscription found" });
    }
    res.json(sub);
  });

  app.get("/api/hydra/memory/search", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { semantic, keyword, scope, type, limit } = req.query;
      const results = await memoryRetriever.search({
        semantic: semantic as string | undefined,
        keyword: keyword as string | undefined,
        scope: scope as string | undefined,
        type: type as string | undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json(results);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/hydra/evolution/candidates", (_req: Request, res: Response) => {
    res.json(evolutionEngine.getCandidates());
  });

  app.get("/api/hydra/evolution/candidates/:agentId", (req: Request, res: Response) => {
    res.json(evolutionEngine.getCandidates(req.params.agentId));
  });

  app.get("/api/hydra/evolution/evaluations", (_req: Request, res: Response) => {
    res.json(evolutionEngine.getBenchmarks());
  });

  app.post("/api/hydra/evolution/promote/:candidateId", (req: Request, res: Response) => {
    const promoted = evolutionEngine.promoteCandidate(req.params.candidateId);
    res.json({ promoted });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message });
  });

  return app;
}

export function startServer(port: number = 3000): void {
  createHydraServer().listen(port, () => {
    console.log(`HYDRA Main AI server listening on port ${port}`);
  });
}

export { createHydraServer as createServer };
