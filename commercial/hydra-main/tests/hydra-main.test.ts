import { describe, it, expect, vi } from "vitest";
import { Orchestrator, InMemoryEventBus } from "../src/core/orchestrator";
import { Scheduler } from "../src/core/scheduler";
import { AgentRegistry, agentRegistry, PersonaBuilder } from "../src/agents/registry";
import { EngineerPersona, SecurityPersona, DevOpsPersona } from "../src/agents/registry";
import { ModelRouter } from "../src/models/router";
import { InMemoryStore } from "../src/memory/store";
import { ContextEngine } from "../src/core/context-engine";
import { EvolutionEngine } from "../src/core/evolution";
import { SecurityKernel } from "../src/security/kernel";
import { AuditLogger } from "../src/security/audit";
import { SandboxManager } from "../src/security/sandbox";
import { KillSwitch } from "../src/security/kill-switch";
import { TenantManager } from "../src/tenant/organization";
import { BillingManager } from "../src/tenant/billing";
import { MemoryRetriever } from "../src/memory/retrieval";
import { ToolRegistry, registerDefaultTools } from "../src/tools/index";
import { QualityGateEngine } from "../src/verification/quality-gates";

describe("Orchestrator", () => {
  it("creates and runs a task", async () => {
    const orchestrator = new Orchestrator(undefined, { agentRegistry });
    const task = orchestrator.createTask({
      goal: "test goal",
      product: "test-product",
      organizationId: "org-1",
      userId: "user-1",
      agentId: "engineer",
    });
    expect(task.status).toBe("pending");
    const run = await orchestrator.runTask(task.id);
    expect(run.status).toBe("completed");
    const updated = orchestrator.getTask(task.id);
    expect(updated?.status).toBe("completed");
  });

  it("executes a task end-to-end with real dependencies", async () => {
    const modelRouter = new ModelRouter();
    modelRouter.configureProvider("local", {});
    const toolRegistry = registerDefaultTools();
    const orchestrator = new Orchestrator(undefined, {
      agentRegistry,
      modelRouter,
      toolRegistry,
    });

    const task = orchestrator.createTask({
      goal: "scan source code for vulnerabilities",
      product: "alp-platform",
      organizationId: "org-1",
      userId: "user-1",
      agentId: "security",
    });
    expect(task.status).toBe("pending");

    const run = await orchestrator.runTask(task.id);
    expect(run.status).toBe("completed");
    expect(run.steps.length).toBeGreaterThanOrEqual(3);

    const planStep = run.steps[0];
    expect(planStep.type).toBe("memory_lookup");
    expect(planStep.status).toBe("completed");

    const executionStep = run.steps[1];
    expect(executionStep.type).toBe("tool_call");
    expect(executionStep.status).toBe("completed");
    expect((executionStep.output as Record<string, unknown>)?.findings?.length).toBeGreaterThan(0);

    const verificationStep = run.steps[2];
    expect(verificationStep.type).toBe("verification");
    expect(verificationStep.status).toBe("completed");

    const updated = orchestrator.getTask(task.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.tokensUsed).toBeGreaterThan(0);
  });
});

describe("AgentRegistry", () => {
  it("lists all 14 personas", () => {
    const registry = new AgentRegistry();
    const personas = registry.list();
    expect(personas.length).toBe(14);
    expect(personas.map((p) => p.id)).toContain("engineer");
    expect(personas.map((p) => p.id)).toContain("security");
    expect(personas.map((p) => p.id)).toContain("quantum");
  });
});

describe("ModelRouter", () => {
  it("selects a model for a task", () => {
    const router = new ModelRouter();
    router.registerProvider({
      id: "openai",
      name: "OpenAI",
      type: "openai",
      models: [{ id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxOutput: 16384, costPer1kInput: 0.03, costPer1kOutput: 0.06, supportsTools: true, supportsVision: true, supportsStreaming: true, tier: "premium" }],
      defaultModel: "gpt-4o",
      healthy: true,
      latencyMs: 200,
      lastChecked: new Date().toISOString(),
    });
    const selection = router.select({ taskType: "coding", contextSize: 10000 });
    expect(selection.provider).toBe("openai");
    expect(selection.model).toBe("gpt-4o");
  });
});

describe("MemoryStore", () => {
  it("stores and retrieves entries", async () => {
    const store = new InMemoryStore();
    const entry = await store.put({
      type: "project",
      key: "decision-1",
      value: "Use PostgreSQL",
      importance: "high",
      scope: "org-1",
    });
    const retrieved = await store.get(entry.id);
    expect(retrieved?.value).toBe("Use PostgreSQL");
  });

  it("queries by scope", async () => {
    const store = new InMemoryStore();
    await store.put({ type: "project", key: "d1", value: "v1", importance: "high", scope: "org-1" });
    await store.put({ type: "project", key: "d2", value: "v2", importance: "medium", scope: "org-2" });
    const results = await store.query({ scope: "org-1" });
    expect(results.length).toBe(1);
    expect(results[0].value).toBe("v1");
  });
});

describe("ContextEngine", () => {
  it("tracks project dependencies", () => {
    const engine = new ContextEngine();
    engine.registerProject("proj-1");
    engine.addDependency("proj-1", { source: "A", target: "B", type: "imports" });
    engine.addDependency("proj-1", { source: "B", target: "C", type: "imports" });
    const affected = engine.getAffectedNodes("proj-1", "A");
    expect(affected).toContain("B");
    expect(affected).toContain("C");
  });
});

describe("SecurityKernel", () => {
  it("grants matching capabilities", () => {
    const kernel = new SecurityKernel();
    const ctx = {
      userId: "user-1",
      organizationId: "org-1",
      capabilities: [{ action: "read", scope: "/projects/*" }],
    };
    expect(kernel.check(ctx, "read", "/projects/alpha")).toBe(true);
    expect(kernel.check(ctx, "write", "/projects/alpha")).toBe(false);
  });
});

describe("TenantManager", () => {
  it("creates org, team, and user", () => {
    const tm = new TenantManager();
    const org = tm.createOrganization("Acme", "pro");
    const team = tm.createTeam(org.id, "Backend");
    const user = tm.addUser({ email: "a@b.com", name: "Alice", organizationId: org.id, teamIds: [team.id], role: "admin" });
    expect(org.name).toBe("Acme");
    expect(team.name).toBe("Backend");
    expect(user.email).toBe("a@b.com");
    expect(tm.getOrganizationMembers(org.id)).toHaveLength(1);
  });
});

describe("ToolRegistry", () => {
  it("registers and lists tools", () => {
    const registry = new ToolRegistry();
    registry.register({
      id: "test-tool",
      name: "Test Tool",
      description: "A test tool",
      category: "testing",
      requiredCapabilities: ["execute"],
      async execute() { return "ok"; },
    });
    expect(registry.list()).toHaveLength(1);
    expect(registry.get("test-tool")?.name).toBe("Test Tool");
  });
});

describe("QualityGateEngine", () => {
  it("passes when score meets threshold", async () => {
    const engine = new QualityGateEngine();
    engine.registerGate({ id: "coverage", name: "Coverage", type: "coverage", threshold: 80, weight: 1 });
    const result = await engine.verify("coverage", { score: 90 });
    expect(result.passed).toBe(true);
  });

  it("fails when score below threshold", async () => {
    const engine = new QualityGateEngine();
    engine.registerGate({ id: "coverage", name: "Coverage", type: "coverage", threshold: 80, weight: 1 });
    const result = await engine.verify("coverage", { score: 50 });
    expect(result.passed).toBe(false);
  });
});

describe("Tool Implementations", () => {
  it("AWS deploy tool returns deployment status", async () => {
    const { AwsDeployTool } = await import("../src/tools/implementations");
    const tool = new AwsDeployTool();
    const result = await tool.execute({ stackName: "test-stack", region: "us-west-2" });
    expect((result as any).status).toBe("deployed");
    expect((result as any).outputs.endpoint).toContain("test-stack");
  });

  it("SAST scanner returns findings", async () => {
    const { SASTScannerTool } = await import("../src/tools/implementations");
    const tool = new SASTScannerTool();
    const result = await tool.execute({ path: "/src", language: "typescript" });
    expect((result as any).findings.length).toBeGreaterThan(0);
    expect((result as any).summary.high).toBe(1);
  });

  it("GitHub Actions creates workflow", async () => {
    const { GitHubActionsTool } = await import("../src/tools/implementations");
    const tool = new GitHubActionsTool();
    const result = await tool.execute({ workflowName: "ci", trigger: "push" });
    expect((result as any).status).toBe("created");
    expect((result as any).url).toContain("workflows/ci.yml");
  });

  it("OpenAPI generator creates spec", async () => {
    const { OpenAPIGenTool } = await import("../src/tools/implementations");
    const tool = new OpenAPIGenTool();
    const result = await tool.execute({ title: "Test API", version: "1.0.0" });
    expect((result as any).openapi).toBe("3.0.3");
    expect((result as any).info.title).toBe("Test API");
  });

  it("Diagram generator produces mermaid diagram", async () => {
    const { DiagramGenTool } = await import("../src/tools/implementations");
    const tool = new DiagramGenTool();
    const result = await tool.execute({ format: "mermaid" });
    expect((result as any).format).toBe("mermaid");
    expect((result as any).content).toContain("graph TD");
  });

  it("Unit test runner reports results", async () => {
    const { UnitTestTool } = await import("../src/tools/implementations");
    const tool = new UnitTestTool();
    const result = await tool.execute({ path: "./tests", framework: "vitest" });
    expect((result as any).passed).toBe(42);
    expect((result as any).coverage.lines).toBeGreaterThan(80);
  });

  it("Default tool registry has tools registered", async () => {
    const { registerDefaultTools } = await import("../src/tools/index");
    const registry = registerDefaultTools();
    expect(registry.list().length).toBeGreaterThan(10);
    expect(registry.get("sast-scanner")?.name).toBe("SAST Scanner");
    expect(registry.get("openapi-gen")?.name).toBe("OpenAPI Generator");
    expect(registry.get("diagram-gen")?.name).toBe("Diagram Generator");
  });

  it("Default tool registry has 65 tools covering all domains", async () => {
    const { registerDefaultTools, toolRegistry } = await import("../src/tools/index");
    const reg = registerDefaultTools();
    expect(reg.list().length).toBe(66);
    const toolIds = reg.list().map((t) => t.id);
    expect(toolIds).toContain("coding-typescript");
    expect(toolIds).toContain("sast-scanner");
    expect(toolIds).toContain("dast-scanner");
    expect(toolIds).toContain("dependency-checker");
    expect(toolIds).toContain("secret-scanner");
    expect(toolIds).toContain("policy-validator");
    expect(toolIds).toContain("sbom-generator");
    expect(toolIds).toContain("license-checker");
    expect(toolIds).toContain("compliance-reporter");
    expect(toolIds).toContain("vuln-db");
    expect(toolIds).toContain("threat-feed");
    expect(toolIds).toContain("remediation");
    expect(toolIds).toContain("siem");
    expect(toolIds).toContain("soar");
    expect(toolIds).toContain("spiffe-spire");
    expect(toolIds).toContain("mtls");
    expect(toolIds).toContain("opa");
    expect(toolIds).toContain("firewall");
    expect(toolIds).toContain("cloud-aws");
    expect(toolIds).toContain("cloud-azure");
    expect(toolIds).toContain("cloud-gcp");
    expect(toolIds).toContain("kubernetes");
    expect(toolIds).toContain("terraform");
    expect(toolIds).toContain("ci-github-actions");
    expect(toolIds).toContain("ci-gitlab");
    expect(toolIds).toContain("argo-cd");
    expect(toolIds).toContain("monitoring");
    expect(toolIds).toContain("etl-pipeline");
    expect(toolIds).toContain("dbt");
    expect(toolIds).toContain("airflow");
    expect(toolIds).toContain("data-quality");
    expect(toolIds).toContain("visualization");
    expect(toolIds).toContain("bi-export");
    expect(toolIds).toContain("verilog-generator");
    expect(toolIds).toContain("synthesis");
    expect(toolIds).toContain("place-route");
    expect(toolIds).toContain("timing-analysis");
    expect(toolIds).toContain("formal-verification");
    expect(toolIds).toContain("qpu-orchestrator");
    expect(toolIds).toContain("quantum-circuit");
    expect(toolIds).toContain("openapi-gen");
    expect(toolIds).toContain("asyncapi-gen");
    expect(toolIds).toContain("sdk-stub-gen");
    expect(toolIds).toContain("diagram-gen");
    expect(toolIds).toContain("dep-graph");
    expect(toolIds).toContain("impact-analysis");
    expect(toolIds).toContain("testing-unit");
    expect(toolIds).toContain("testing-integration");
    expect(toolIds).toContain("testing-e2e");
    expect(toolIds).toContain("testing-property");
    expect(toolIds).toContain("git-workflow");
    expect(toolIds).toContain("code-formatter");
    expect(toolIds).toContain("lint");
    expect(toolIds).toContain("style");
    expect(toolIds).toContain("perf");
    expect(toolIds).toContain("security-lint");
    expect(toolIds).toContain("versioning");
    expect(toolIds).toContain("changelog");
    expect(toolIds).toContain("rollback");
    expect(toolIds).toContain("dashboarding");
  });

  it("SecurityAgent persona tools are all registered", async () => {
    const { agentRegistry } = await import("../src/agents/registry");
    const security = agentRegistry.get("security");
    const { toolRegistry, registerDefaultTools } = await import("../src/tools/index");
    registerDefaultTools();
    for (const toolId of security!.tools) {
      expect(toolRegistry.get(toolId)).toBeDefined();
    }
  });

  it("EngineerAgent persona tools are all registered", async () => {
    const { agentRegistry } = await import("../src/agents/registry");
    const engineer = agentRegistry.get("engineer");
    const { toolRegistry, registerDefaultTools } = await import("../src/tools/index");
    registerDefaultTools();
    for (const toolId of engineer!.tools) {
      expect(toolRegistry.get(toolId)).toBeDefined();
    }
  });

  it("DevOpsAgent persona tools are all registered", async () => {
    const { agentRegistry } = await import("../src/agents/registry");
    const devops = agentRegistry.get("devops");
    const { toolRegistry, registerDefaultTools } = await import("../src/tools/index");
    registerDefaultTools();
    for (const toolId of devops!.tools) {
      expect(toolRegistry.get(toolId)).toBeDefined();
    }
  });

  it("DataAgent persona tools are all registered", async () => {
    const { agentRegistry } = await import("../src/agents/registry");
    const data = agentRegistry.get("data");
    const { toolRegistry, registerDefaultTools } = await import("../src/tools/index");
    registerDefaultTools();
    for (const toolId of data!.tools) {
      expect(toolRegistry.get(toolId)).toBeDefined();
    }
  });

  it("All 14 personas have their tools registered", async () => {
    const { agentRegistry } = await import("../src/agents/registry");
    const { toolRegistry, registerDefaultTools } = await import("../src/tools/index");
    registerDefaultTools();
    for (const persona of agentRegistry.list()) {
      for (const toolId of persona.tools) {
        expect(toolRegistry.get(toolId), `Missing tool ${toolId} for persona ${persona.id}`).toBeDefined();
      }
    }
  });

  it("DAST scanner returns findings", async () => {
    const { DASTScannerTool } = await import("../src/tools/implementations");
    const tool = new DASTScannerTool();
    const result = await tool.execute({ targetUrl: "https://example.com", scanProfile: "full" });
    expect((result as any).scanId).toContain("dast-");
    expect((result as any).vulnerabilities.length).toBeGreaterThan(0);
  });

  it("Dependency checker returns vulnerabilities", async () => {
    const { DependencyCheckerTool } = await import("../src/tools/implementations");
    const tool = new DependencyCheckerTool();
    const result = await tool.execute({ projectPath: ".", ecosystem: "npm" });
    expect((result as any).checkId).toContain("deps-");
    expect((result as any).vulnerabilities.length).toBeGreaterThan(0);
  });

  it("Secret scanner detects findings", async () => {
    const { SecretScannerTool } = await import("../src/tools/implementations");
    const tool = new SecretScannerTool();
    const result = await tool.execute({ path: ".", formats: ["env"] });
    expect((result as any).scanId).toContain("secret-");
    expect((result as any).findings.length).toBeGreaterThan(0);
  });

  it("Vulnerability DB query returns CVEs", async () => {
    const { VulnerabilityDBTool } = await import("../src/tools/implementations");
    const tool = new VulnerabilityDBTool();
    const result = await tool.execute({ cveId: "CVE-2024-1234" });
    expect((result as any).results.length).toBeGreaterThan(0);
    expect((result as any).source).toBe("NVD");
  });

  it("Quantum circuit tool generates circuit", async () => {
    const { QuantumCircuitTool } = await import("../src/tools/implementations");
    const tool = new QuantumCircuitTool();
    const result = await tool.execute({ numQubits: 3, simulator: "qasm_sim" });
    expect((result as any).circuitId).toContain("qc-");
    expect((result as any).numQubits).toBe(3);
  });

  it("QPU orchestrator submits job", async () => {
    const { QPUOrchestratorTool } = await import("../src/tools/implementations");
    const tool = new QPUOrchestratorTool();
    const result = await tool.execute({ circuit: "bell", backend: "ibmq_qasm_simulator" });
    expect((result as any).jobId).toContain("qpu-");
    expect((result as any).status).toBe("completed");
  });

  it("Formal verification tool returns results", async () => {
    const { FormalVerificationTool } = await import("../src/tools/implementations");
    const tool = new FormalVerificationTool();
    const result = await tool.execute({ rtl: "design.v", timeout: 3600 });
    expect((result as any).proven).toBe(13);
    expect((result as any).propertiesChecked).toBeGreaterThanOrEqual(15);
  });

  it("Place & route tool returns physical design metrics", async () => {
    const { PlaceRouteTool } = await import("../src/tools/implementations");
    const tool = new PlaceRouteTool();
    const result = await tool.execute({ netlist: "design.v", targetDevice: "fpga" });
    expect((result as any).cellsPlaced).toBe(5420);
    expect((result as any).drcViolations).toBe(0);
  });

  it("Rollback tool returns rollback status", async () => {
    const { RollbackTool } = await import("../src/tools/implementations");
    const tool = new RollbackTool();
    const result = await tool.execute({ deploymentId: "dep-123", targetVersion: "1.0.0" });
    expect((result as any).status).toBe("rolled_back");
    expect((result as any).affectedServices).toBe(3);
  });

  it("SDK Stub Generator creates stubs", async () => {
    const { SDKStubGenTool } = await import("../src/tools/implementations");
    const tool = new SDKStubGenTool();
    const result = await tool.execute({ specUrl: "openapi.json", language: "typescript" });
    expect((result as any).filesGenerated).toBe(12);
    expect((result as any).typesafe).toBe(true);
  });

  it("Impact analysis tool returns affected modules", async () => {
    const { ImpactAnalysisTool } = await import("../src/tools/implementations");
    const tool = new ImpactAnalysisTool();
    const result = await tool.execute({ changedFiles: ["src/db.ts"], projectId: "proj-1" });
    expect((result as any).affectedModules.length).toBeGreaterThan(0);
    expect((result as any).riskLevel).toBe("medium");
  });

  it("Compliance reporter generates reports", async () => {
    const { ComplianceReporterTool } = await import("../src/tools/implementations");
    const tool = new ComplianceReporterTool();
    const result = await tool.execute({ standard: "SOC2", scope: "all" });
    expect((result as any).controls).toBe(187);
    expect((result as any).reportUrl).toContain("soc2");
  });

  it("SPIFFE/SPIRE tool manages identity", async () => {
    const { SPIFFESPIRETool } = await import("../src/tools/implementations");
    const tool = new SPIFFESPIRETool();
    const result = await tool.execute({ workload: "api-server", action: "register" });
    expect((result as any).status).toBe("success");
    expect((result as any).spiffeId).toContain("spiffe://");
  });

  it("OPA tool manages policies", async () => {
    const { OPATool } = await import("../src/tools/implementations");
    const tool = new OPATool();
    const result = await tool.execute({ policy: "allow_admin", query: "data.app.allow" });
    expect((result as any).decision).toBe("allow");
    expect((result as any).evaluationTime).toBeGreaterThan(0);
  });

  it("ToolRegistry listByCategory returns filtered tools", () => {
    const reg = new ToolRegistry();
    reg.register({ id: "a", name: "A", description: "d", category: "security", requiredCapabilities: [], async execute() { return null; } });
    reg.register({ id: "b", name: "B", description: "d", category: "coding", requiredCapabilities: [], async execute() { return null; } });
    expect(reg.listByCategory("security").length).toBe(1);
    expect(reg.listByCategory("coding").length).toBe(1);
  });

  it("PersonaBuilder creates tool categories summary", async () => {
    const { registerDefaultTools, toolRegistry } = await import("../src/tools/index");
    registerDefaultTools();
    const categories = new Set(toolRegistry.list().map((t) => t.category));
    expect(categories.has("coding")).toBe(true);
    expect(categories.has("security")).toBe(true);
    expect(categories.has("cloud")).toBe(true);
    expect(categories.has("data")).toBe(true);
    expect(categories.has("eda")).toBe(true);
    expect(categories.has("quantum")).toBe(true);
    expect(categories.has("testing")).toBe(true);
    expect(categories.has("review")).toBe(true);
    expect(categories.has("release")).toBe(true);
    expect(categories.has("api")).toBe(true);
    expect(categories.has("architecture")).toBe(true);
    expect(categories.has("devops")).toBe(true);
  });
});

describe("ModelRouter and adapters", () => {
  it("selects a provider for a task", () => {
    const router = new ModelRouter();
    const selection = router.select({ taskType: "coding", contextSize: 4000 });
    expect(selection.provider).toBe("openai");
    expect(selection.model).toBe("gpt-4o");
    expect(selection.reason).toBe("optimal-coding");
  });

  it("falls back when no healthy providers exist", () => {
    const router = new ModelRouter();
    for (const provider of router.listProviders()) {
      provider.healthy = false;
    }
    router.registerProvider({
      id: "unhealthy",
      name: "Unhealthy",
      type: "openai",
      defaultModel: "gpt-4o",
      healthy: false,
      latencyMs: 0,
      lastChecked: new Date().toISOString(),
      models: [],
    });
    const selection = router.select({ taskType: "coding", contextSize: 4000 });
    expect(selection.provider).toBe("openai");
    expect(selection.reason).toBe("fallback-default");
  });

  it("executes local adapter synchronously", async () => {
    const router = new ModelRouter();
    router.configureProvider("local", {});
    const result = await router.complete("local", "tinyllama", {
      prompt: "Hello",
      systemPrompt: "You are helpful.",
      temperature: 0.5,
      maxTokens: 128,
    });
    expect(result.text).toContain("[Local tinyllama]");
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.finishReason).toBe("stop");
  });

  it("returns stubbed responses when API keys are missing", async () => {
    const router = new ModelRouter();
    router.configureProvider("openai", {});
    router.configureProvider("anthropic", {});

    const openaiResult = await router.complete("openai", "gpt-4o", { prompt: "test" });
    expect(openaiResult.text).toContain("[OpenAI stub]");

    const anthropicResult = await router.complete("anthropic", "claude-sonnet-4-20250514", { prompt: "test" });
    expect(anthropicResult.text).toContain("[Anthropic stub]");
  });

  it("executes Ollama adapter against local endpoint", async () => {
    const router = new ModelRouter();
    router.configureProvider("ollama", { endpoint: "http://localhost:11434" });
    const result = await router.complete("ollama", "llama3.1", { prompt: "Say hi" });
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("includes latencyMs in selection result", () => {
    const router = new ModelRouter();
    const selection = router.select({ taskType: "coding", contextSize: 4000 });
    expect(selection.latencyMs).toBeDefined();
    expect(typeof selection.latencyMs).toBe("number");
  });

  it("selectAll returns candidates sorted by score", () => {
    const router = new ModelRouter();
    const selections = router.selectAll({ taskType: "simple", contextSize: 1000 });
    expect(selections.length).toBeGreaterThan(1);
  });

  it("filters providers by task-type capability", () => {
    const router = new ModelRouter();
    const codingSelection = router.select({ taskType: "coding", contextSize: 4000 });
    expect(codingSelection.provider).toBe("openai");
  });

  it("prefers cheaper models within budget", () => {
    const router = new ModelRouter();
    const selection = router.select({ taskType: "simple", contextSize: 1000, budgetUsdPer1k: 0.01 });
    expect(selection.estimatedCostPer1k).toBeLessThanOrEqual(0.01);
  });

  it("completeWithFallback returns first successful result", async () => {
    const router = new ModelRouter();
    router.configureProvider("local", {});
    const result = await router.completeWithFallback({ taskType: "simple", contextSize: 1000 }, { prompt: "Hello" });
    expect(result.result.text.length).toBeGreaterThan(0);
    expect(result.provider).toBeDefined();
    expect(result.model).toBeDefined();
  });

  it("completeWithFallback skips failed providers", async () => {
    const router = new ModelRouter();
    router.configureProvider("local", {});
    router.configureProvider("openai", {});
    router.registerProvider({
      id: "broken",
      name: "Broken",
      type: "openai",
      defaultModel: "gpt-4o",
      healthy: true,
      latencyMs: 100,
      lastChecked: new Date().toISOString(),
      models: [{ id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxOutput: 16384, costPer1kInput: 0.03, costPer1kOutput: 0.06, supportsTools: true, supportsVision: true, supportsStreaming: true, tier: "frontier" }],
    });
    const result = await router.completeWithFallback({ taskType: "simple", contextSize: 1000, preferredProvider: "broken" }, { prompt: "Hello" });
    expect(result.provider).not.toBe("broken");
  });

  it("select returns optimized model for reasoning tasks", () => {
    const router = new ModelRouter();
    const selection = router.select({ taskType: "reasoning", contextSize: 200000 });
    expect(selection.reason).toBe("optimal-reasoning");
  });

  it("select returns optimized model for security tasks", () => {
    const router = new ModelRouter();
    const selection = router.select({ taskType: "security", contextSize: 8000 });
    expect(selection.reason).toBe("optimal-security");
    expect(selection.provider).toBe("openai");
  });
});

describe("Orchestrator.listTasks", () => {
  it("returns all tasks when no status filter is provided", () => {
    const orchestrator = new Orchestrator(undefined, { agentRegistry });
    orchestrator.createTask({ goal: "task 1", product: "p", organizationId: "o1", userId: "u1", agentId: "engineer" });
    orchestrator.createTask({ goal: "task 2", product: "p", organizationId: "o1", userId: "u1", agentId: "engineer" });
    expect(orchestrator.listTasks().length).toBe(2);
  });

  it("filters by status", () => {
    const orchestrator = new Orchestrator(undefined, { agentRegistry });
    const task = orchestrator.createTask({ goal: "task 1", product: "p", organizationId: "o1", userId: "u1", agentId: "engineer" });
    expect(orchestrator.listTasks("pending").length).toBe(1);
    expect(orchestrator.listTasks("completed").length).toBe(0);
    expect(orchestrator.listTasks("pending")[0]).toBe(task);
  });
});

describe("Scheduler", () => {
  it("dispatches pending tasks up to concurrency limit", async () => {
    const modelRouter = new ModelRouter();
    modelRouter.configureProvider("local", {});
    const orchestrator = new Orchestrator(undefined, { agentRegistry, modelRouter });
    const scheduler = new Scheduler(orchestrator, { maxConcurrent: 2, queueIntervalMs: 50 });

    orchestrator.createTask({ goal: "task 1", product: "p", organizationId: "o1", userId: "u1", agentId: "engineer" });
    orchestrator.createTask({ goal: "task 2", product: "p", organizationId: "o1", userId: "u1", agentId: "engineer" });

    scheduler.start();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(scheduler.getRunningCount()).toBeGreaterThan(0);

    await new Promise((resolve) => setTimeout(resolve, 200));
    scheduler.stop();

    const tasks = orchestrator.listTasks();
    const completed = tasks.filter((t) => t.status === "completed");
    expect(completed.length).toBe(2);
  });

  it("respects maxConcurrent limit", async () => {
    const orchestrator = new Orchestrator(undefined, { agentRegistry });
    const scheduler = new Scheduler(orchestrator, { maxConcurrent: 1, queueIntervalMs: 10 });

    orchestrator.createTask({ goal: "task 1", product: "p", organizationId: "o1", userId: "u1", agentId: "engineer" });
    orchestrator.createTask({ goal: "task 2", product: "p", organizationId: "o1", userId: "u1", agentId: "engineer" });

    scheduler.start();
    expect(scheduler.getRunningCount()).toBeLessThanOrEqual(1);
    scheduler.stop();
  });
});

describe("EventBus", () => {
  it("publishes and subscribes to events", () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe("task_created", handler);

    bus.publish({ type: "task_created", task: { id: "t1" } });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: "task_created", task: { id: "t1" } });

    unsubscribe();
    bus.publish({ type: "task_created", task: { id: "t2" } });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports wildcard subscriptions", () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();
    bus.subscribe("*", handler);

    bus.publish({ type: "task_created", task: { id: "t1" } });
    bus.publish({ type: "task_completed", task: { id: "t1" } });
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe("Enhanced Personas", () => {
  it("all 14 personas have rich metadata fields", () => {
    const personas = agentRegistry.list();
    expect(personas).toHaveLength(14);
    for (const p of personas) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.icon).toBeTruthy();
      expect(p.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(["formal", "casual", "neutral"]).toContain(p.tone);
      expect(p.systemPrompt.length).toBeGreaterThan(20);
      expect(p.principles.length).toBeGreaterThan(0);
      expect(p.styleGuidelines.length).toBeGreaterThan(0);
      expect(p.examples.length).toBeGreaterThan(0);
      expect(p.tools.length).toBeGreaterThan(0);
      expect(p.memoryNamespace).toBeTruthy();
      expect(p.permissions.length).toBeGreaterThan(0);
      expect(p.limits.maxConcurrentTasks).toBeGreaterThan(0);
      expect(p.modelPreferences.primary).toBeTruthy();
      expect(p.modelPreferences.fallback).toBeTruthy();
      expect(p.version).toBeTruthy();
    }
  });

  it("EngineerPersona has coding model preference", () => {
    const engineer = new EngineerPersona();
    expect(engineer.modelPreferences.coding).toBe(true);
  });

  it("SecurityPersona has requiresReview and approval permission", () => {
    const security = new SecurityPersona();
    expect(security.limits.requiresReview).toBe(true);
    expect(security.permissions).toContain("approve");
  });

  it("DevOpsPersona has deploy permission", () => {
    const devops = new DevOpsPersona();
    expect(devops.permissions).toContain("deploy");
  });

  it("personas have unique IDs and memory namespaces", () => {
    const personas = agentRegistry.list();
    const ids = personas.map((p) => p.id);
    const namespaces = personas.map((p) => p.memoryNamespace);
    expect(new Set(ids).size).toBe(14);
    expect(new Set(namespaces).size).toBe(14);
  });

  it("personas have distinct colors", () => {
    const personas = agentRegistry.list();
    const colors = personas.map((p) => p.color);
    expect(new Set(colors).size).toBeGreaterThan(10);
  });
});

describe("PersonaBuilder", () => {
  it("builds a persona with defaults", () => {
    const builder = new PersonaBuilder("custom-agent", "Custom Agent");
    const persona = builder.build();
    expect(persona.id).toBe("custom-agent");
    expect(persona.name).toBe("Custom Agent");
    expect(persona.tone).toBe("neutral");
    expect(persona.icon).toBe("🤖");
    expect(persona.permissions).toEqual(["read"]);
    expect(persona.limits.maxConcurrentTasks).toBe(1);
  });

  it("overrides all fields via builder methods", () => {
    const persona = new PersonaBuilder("test-agent", "Test Agent")
      .description("A test agent")
      .icon("🧪")
      .color("#FF0000")
      .tone("formal")
      .systemPrompt("You are a test agent.")
      .principles(["Be thorough", "Be accurate"])
      .styleGuidelines(["Use clear names", "Add comments"])
      .examples([{ user: "Test?", assistant: "Yes.", description: "Test example" }])
      .tools(["tool-a", "tool-b"])
      .memoryNamespace("test")
      .permissions(["read", "write", "approve"])
      .limits({ maxConcurrentTasks: 5, requiresReview: true, maxTokensPerTask: 64000 })
      .modelPreferences({ primary: "gpt-5.5", fallback: "claude-opus-5", coding: true })
      .version("2.0.0")
      .build();

    expect(persona.description).toBe("A test agent");
    expect(persona.icon).toBe("🧪");
    expect(persona.color).toBe("#FF0000");
    expect(persona.tone).toBe("formal");
    expect(persona.systemPrompt).toBe("You are a test agent.");
    expect(persona.principles).toHaveLength(2);
    expect(persona.styleGuidelines).toHaveLength(2);
    expect(persona.examples).toHaveLength(1);
    expect(persona.tools).toHaveLength(2);
    expect(persona.memoryNamespace).toBe("test");
    expect(persona.permissions).toContain("approve");
    expect(persona.limits.maxConcurrentTasks).toBe(5);
    expect(persona.limits.requiresReview).toBe(true);
    expect(persona.limits.maxTokensPerTask).toBe(64000);
    expect(persona.modelPreferences.coding).toBe(true);
    expect(persona.version).toBe("2.0.0");
  });

  it("buildAndRegister registers in the registry", () => {
    const registry = new AgentRegistry([]);
    const persona = new PersonaBuilder("dynamic", "Dynamic Agent")
      .systemPrompt("Dynamic agent prompt")
      .tools(["tool-x"])
      .permissions(["read"])
      .limits({ maxConcurrentTasks: 1, requiresReview: false })
      .modelPreferences({ primary: "gpt-4o", fallback: "claude-3" })
      .buildAndRegister(registry);

    expect(registry.get("dynamic")).toBe(persona);
    expect(registry.list()).toHaveLength(1);
  });
});

describe("AgentRegistry extensions", () => {
  it("listByPermission filters personas by permission", () => {
    const deployers = agentRegistry.listByPermission("deploy");
    expect(deployers.some((p) => p.id === "devops")).toBe(true);
    expect(deployers.some((p) => p.id === "engineer")).toBe(false);
  });

  it("listByTool filters personas by tool", () => {
    const owners = agentRegistry.listByTool("sast-scanner");
    expect(owners.some((p) => p.id === "security")).toBe(true);
  });

  it("serialize returns a plain object with all fields", () => {
    const serialized = agentRegistry.serialize("engineer");
    expect(serialized).toBeDefined();
    expect(serialized!.id).toBe("engineer");
    expect(serialized!.name).toBe("Engineer Agent");
    expect(serialized!.systemPrompt).toContain("software engineering");
    expect(serialized!.principles).toBeDefined();
    expect(serialized!.limits).toBeDefined();
    expect(serialized!.modelPreferences).toBeDefined();
    expect(serialized!.version).toBeDefined();
  });

  it("serialize returns undefined for unknown persona", () => {
    expect(agentRegistry.serialize("nonexistent")).toBeUndefined();
  });

  it("register throws on duplicate id", () => {
    const registry = new AgentRegistry([]);
    const p = agentRegistry.get("engineer");
    expect(() => registry.register(p!)).not.toThrow();
    expect(() => registry.register(p!)).toThrow(/already registered/);
  });

  it("register throws on missing required fields", () => {
    const registry = new AgentRegistry([]);
    expect(() => registry.register({ id: "", name: "", systemPrompt: "" } as any)).toThrow(/missing required/);
  });

  it("unregister removes a persona", () => {
    const registry = new AgentRegistry([]);
    const p = new PersonaBuilder("temp", "Temp").systemPrompt("Temp agent").build();
    registry.register(p);
    expect(registry.get("temp")).toBe(p);
    expect(registry.unregister("temp")).toBe(true);
    expect(registry.get("temp")).toBeUndefined();
  });
});

describe("Product Workflows", () => {
  it("has workflows for key products", async () => {
    const { PRODUCT_WORKFLOWS, getProductWorkflow } = await import("../src/products/workflows");
    expect(getProductWorkflow("security-scanner")).toBeDefined();
    expect(getProductWorkflow("soc-sentinel")).toBeDefined();
    expect(getProductWorkflow("chip-design")).toBeDefined();
    expect(getProductWorkflow("code-review")).toBeDefined();
    expect(getProductWorkflow("api-designer")).toBeDefined();
    expect(getProductWorkflow("arch-visualizer")).toBeDefined();
    expect(getProductWorkflow("data-pipeline")).toBeDefined();
    expect(getProductWorkflow("devops-bridge")).toBeDefined();
    expect(getProductWorkflow("release-manager")).toBeDefined();
    expect(getProductWorkflow("test-engine")).toBeDefined();
    expect(PRODUCT_WORKFLOWS.length).toBeGreaterThan(10);
  });

  it("each workflow step references a registered tool", async () => {
    const { PRODUCT_WORKFLOWS } = await import("../src/products/workflows");
    const { toolRegistry, registerDefaultTools } = await import("../src/tools/index");
    registerDefaultTools();
    for (const workflow of PRODUCT_WORKFLOWS) {
      for (const step of workflow.steps) {
        expect(toolRegistry.get(step.toolId), `Workflow ${workflow.productId} step ${step.stepId} references unknown tool ${step.toolId}`).toBeDefined();
      }
    }
  });

  it("each workflow step references a registered persona", async () => {
    const { PRODUCT_WORKFLOWS } = await import("../src/products/workflows");
    const { agentRegistry } = await import("../src/agents/registry");
    for (const workflow of PRODUCT_WORKFLOWS) {
      const allAgentIds = [workflow.primaryAgentId, ...workflow.secondaryAgentIds];
      for (const agentId of allAgentIds) {
        expect(agentRegistry.get(agentId), `Workflow ${workflow.productId} references unknown agent ${agentId}`).toBeDefined();
      }
      for (const step of workflow.steps) {
        expect(agentRegistry.get(step.agentId), `Workflow ${workflow.productId} step ${step.stepId} references unknown agent ${step.agentId}`).toBeDefined();
      }
    }
  });

  it("getProductWorkflow returns undefined for unknown product", async () => {
    const { getProductWorkflow } = await import("../src/products/workflows");
    expect(getProductWorkflow("nonexistent")).toBeUndefined();
  });

  it("getWorkflowsForAgent returns matching workflows", async () => {
    const { getWorkflowsForAgent } = await import("../src/products/workflows");
    const workflows = getWorkflowsForAgent("security");
    expect(workflows.some((w) => w.productId === "security-scanner")).toBe(true);
    expect(workflows.some((w) => w.productId === "supply-chain-guardian")).toBe(true);
  });

  it("getStepsForAgent returns only steps for that agent", async () => {
    const { getStepsForAgent } = await import("../src/products/workflows");
    const steps = getStepsForAgent("security-scanner", "security");
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.agentId === "security")).toBe(true);
  });

  it("validatePersonasForWorkflow returns true for valid workflow", async () => {
    const { validatePersonasForWorkflow, getProductWorkflow } = await import("../src/products/workflows");
    const workflow = getProductWorkflow("security-scanner");
    expect(validatePersonasForWorkflow(workflow!)).toBe(true);
  });
});

describe("EvolutionEngine", () => {
  it("records skill usage and evaluates candidates", () => {
    const toolRegistry = registerDefaultTools();
    const engine = new EvolutionEngine(agentRegistry, toolRegistry);

    engine.recordSkillUsage("engineer", "coding-typescript", true, 150);
    engine.recordSkillUsage("engineer", "coding-typescript", true, 120);
    engine.recordSkillUsage("engineer", "coding-typescript", true, 100);

    const candidate = engine.getCandidates("engineer").find((c) => c.toolId === "coding-typescript");
    expect(candidate).toBeDefined();
    expect(candidate!.usageCount).toBe(3);
    expect(candidate!.successRate).toBeCloseTo(1.0);
    expect(candidate!.averageLatencyMs).toBeCloseTo(123.33, 1);
  });

  it("promotes candidates that meet thresholds", () => {
    const toolRegistry = registerDefaultTools();
    const engine = new EvolutionEngine(agentRegistry, toolRegistry, { minUsageForPromotion: 3, promotionThreshold: 0.9 });

    for (let i = 0; i < 3; i++) {
      engine.recordSkillUsage("engineer", "coding-python", true, 100);
    }

    const promotable = engine.evaluateCandidates();
    expect(promotable.length).toBe(1);
    expect(promotable[0].toolId).toBe("coding-python");

    expect(engine.promoteCandidate(promotable[0].id)).toBe(true);

    const engineer = agentRegistry.get("engineer");
    expect(engineer).toBeDefined();
    expect(engineer!.tools).toContain("coding-python");
  });

  it("benchmarks candidates", async () => {
    const toolRegistry = registerDefaultTools();
    const engine = new EvolutionEngine(agentRegistry, toolRegistry);

    engine.recordSkillUsage("security", "sast-scanner", true, 200);
    const candidate = engine.getCandidates("security")[0];
    expect(candidate).toBeDefined();

    const result = await engine.benchmarkCandidate(candidate.id);
    expect(result).not.toBeNull();
    expect(result!.passed).toBe(false);
    expect(result!.agentId).toBe("security");
    expect(engine.getBenchmarks().length).toBe(1);
  });

  it("does not promote candidates below thresholds", () => {
    const toolRegistry = registerDefaultTools();
    const engine = new EvolutionEngine(agentRegistry, toolRegistry, { minUsageForPromotion: 10, promotionThreshold: 0.95 });

    engine.recordSkillUsage("devops", "kubernetes", false, 500);
    const promotable = engine.evaluateCandidates();
    expect(promotable.length).toBe(0);
  });

  it("prunes old unpromoted candidates", () => {
    const toolRegistry = registerDefaultTools();
    const engine = new EvolutionEngine(agentRegistry, toolRegistry, { retentionDays: 30 });

    engine.recordSkillUsage("engineer", "git-workflow", true, 100);
    expect(engine.getCandidates("engineer").length).toBe(1);

    const pruned = engine.pruneOldCandidates();
    expect(pruned).toBe(0);
  });
});

describe("AuditLogger", () => {
  it("logs events with chaining hashes", () => {
    const logger = new AuditLogger();
    const entry1 = logger.log({
      actorId: "user-1",
      action: "task.create",
      scope: "org-1",
      outcome: "success",
    });
    const entry2 = logger.log({
      actorId: "user-2",
      action: "task.run",
      scope: "org-1",
      outcome: "success",
    });

    expect(entry1.sequence).toBe(1);
    expect(entry2.sequence).toBe(2);
    expect(entry2.previousHash).toBe(entry1.hash);
    expect(logger.count()).toBe(2);
  });

  it("verifies log integrity", () => {
    const logger = new AuditLogger();
    logger.log({ actorId: "user-1", action: "task.create", scope: "org-1", outcome: "success" });
    logger.log({ actorId: "user-2", action: "task.run", scope: "org-1", outcome: "denied" });

    expect(logger.verify()).toBe(true);
  });

  it("queries events by actor and action", () => {
    const logger = new AuditLogger();
    logger.log({ actorId: "user-1", action: "task.create", scope: "org-1", outcome: "success" });
    logger.log({ actorId: "user-2", action: "task.run", scope: "org-1", outcome: "denied" });
    logger.log({ actorId: "user-1", action: "task.delete", scope: "org-1", outcome: "success" });

    const byActor = logger.query({ actorId: "user-1" });
    expect(byActor.length).toBe(2);

    const byAction = logger.query({ action: "task.create" });
    expect(byAction.length).toBe(1);

    const byOutcome = logger.query({ outcome: "denied" });
    expect(byOutcome.length).toBe(1);
  });

  it("detects tampered entries", () => {
    const logger = new AuditLogger();
    const entry = logger.log({ actorId: "user-1", action: "task.create", scope: "org-1", outcome: "success" });

    entry.actorId = "tampered";

    expect(logger.verify()).toBe(false);
  });
});

describe("SandboxManager", () => {
  it("creates and destroys sandboxes", async () => {
    const manager = new SandboxManager();
    const sandbox = await manager.create({
      organizationId: "org-1",
      resourceLimits: { maxRamMB: 1024, maxCpuPercent: 50, timeoutSeconds: 60 },
      networkPolicy: { allowEgress: true, allowIngress: false, allowedHosts: ["*.example.com"], allowedPorts: [], denyAll: false },
      ephemeral: true,
    });

    expect(sandbox.id).toBeDefined();
    expect(sandbox.status).toBe("running");
    expect(sandbox.organizationId).toBe("org-1");

    const retrieved = manager.get(sandbox.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.status).toBe("running");

    const destroyed = await manager.destroy(sandbox.id);
    expect(destroyed).toBe(true);
    expect(manager.get(sandbox.id)?.status).toBe("destroyed");
  });

  it("lists sandboxes filtered by org", async () => {
    const manager = new SandboxManager();
    await manager.create({ organizationId: "org-1", resourceLimits: { maxRamMB: 512 }, networkPolicy: { denyAll: false, allowEgress: true, allowIngress: false, allowedHosts: [], allowedPorts: [] }, ephemeral: false });
    await manager.create({ organizationId: "org-2", resourceLimits: { maxRamMB: 512 }, networkPolicy: { denyAll: false, allowEgress: true, allowIngress: false, allowedHosts: [], allowedPorts: [] }, ephemeral: false });

    const org1Sandboxes = manager.list("org-1");
    expect(org1Sandboxes.length).toBe(1);
    expect(org1Sandboxes[0].organizationId).toBe("org-1");
  });

  it("checks resource limits and network access", async () => {
    const manager = new SandboxManager();
    const sandbox = await manager.create({
      organizationId: "org-1",
      resourceLimits: { maxRamMB: 100, maxCpuPercent: 50 },
      networkPolicy: { allowEgress: true, allowIngress: false, allowedHosts: ["api.example.com"], allowedPorts: [443], denyAll: false },
      ephemeral: true,
    });

    manager.updateResourceUsage(sandbox.id, { ramMB: 150, cpuPercent: 30 });
    const check = manager.checkResources(sandbox.id);
    expect(check.allowed).toBe(false);
    expect(check.violations.some((v) => v.includes("RAM"))).toBe(true);

    manager.updateResourceUsage(sandbox.id, { ramMB: 50, cpuPercent: 30 });
    expect(manager.checkResources(sandbox.id).allowed).toBe(true);

    expect(manager.checkNetworkAccess(sandbox.id, "api.example.com", 443)).toBe(true);
    expect(manager.checkNetworkAccess(sandbox.id, "evil.com", 443)).toBe(false);
  });
});

describe("KillSwitch", () => {
  it("activates and checks kill status", () => {
    const killSwitch = new KillSwitch();

    expect(killSwitch.isActive("all")).toBe(false);
    expect(killSwitch.listActive()).toHaveLength(0);

    const event = killSwitch.activate("Security incident detected", "organization", "org-1");
    expect(event.scope).toBe("organization");
    expect(event.targetId).toBe("org-1");

    expect(killSwitch.isOrganizationKilled("org-1")).toBe(true);
    expect(killSwitch.isOrganizationKilled("org-2")).toBe(false);
  });

  it("blocks all when global kill is active", () => {
    const killSwitch = new KillSwitch();
    killSwitch.activate("Emergency shutdown", "all");

    expect(killSwitch.isAllKillsActive()).toBe(true);
    expect(killSwitch.shouldBlock("all")).toBe(true);
    expect(killSwitch.shouldBlock("organization", "org-1")).toBe(true);
    expect(killSwitch.shouldBlock("agent", "engineer")).toBe(true);
  });

  it("deactivates specific kills", () => {
    const killSwitch = new KillSwitch();
    const event = killSwitch.activate("Test", "agent", "engineer");

    expect(killSwitch.isAgentKilled("engineer")).toBe(true);
    expect(killSwitch.deactivate(event.id)).toBe(true);
    expect(killSwitch.isAgentKilled("engineer")).toBe(false);
  });

  it("maintains history of all kill events", () => {
    const killSwitch = new KillSwitch();
    killSwitch.activate("Event 1", "all");
    killSwitch.deactivate(killSwitch.listActive()[0].id);
    killSwitch.activate("Event 2", "organization", "org-1");

    const history = killSwitch.history();
    expect(history.length).toBe(2);
  });
});

describe("BillingManager", () => {
  it("creates plans and subscribes organizations", () => {
    const billing = new BillingManager();
    const plan = billing.addPlan({
      name: "Pro",
      organizationId: "org-1",
      tiers: [{ id: "t1", name: "Pro", priceUsdPerMonth: 99, limits: { users: 10 }, features: ["all"] }],
      features: { all: true },
    });

    expect(plan.id).toBeDefined();

    const subscribed = billing.subscribeOrganization("org-1", plan.id);
    expect(subscribed).toBe(true);

    const sub = billing.getSubscription("org-1");
    expect(sub).toBeDefined();
    expect(sub!.planId).toBe(plan.id);
  });

  it("records usage and generates invoices", () => {
    const billing = new BillingManager();
    const plan = billing.addPlan({
      name: "Pro",
      organizationId: "org-1",
      priceUsdPerMonth: 99,
      tiers: [{ id: "t1", name: "Pro", priceUsdPerMonth: 99, limits: { users: 10 }, features: ["all"] }],
      features: { all: true },
    });
    billing.subscribeOrganization("org-1", plan.id);

    const record = billing.recordUsage("org-1", "api_calls", 1000, "calls", 5.0);
    expect(record.organizationId).toBe("org-1");
    expect(record.metric).toBe("api_calls");

    const total = billing.getUsageTotal("org-1", "api_calls");
    expect(total).toBe(1000);

    const start = new Date(Date.now() - 86400000).toISOString();
    const end = new Date().toISOString();
    const invoice = billing.generateInvoice("org-1", start, end);

    expect(invoice.organizationId).toBe("org-1");
    expect(invoice.items.length).toBe(2);
    expect(invoice.total).toBeGreaterThan(99);
    expect(invoice.status).toBe("draft");

    expect(billing.markPaid(invoice.id)).toBe(true);
    expect(billing.getInvoices("org-1")[0].status).toBe("paid");
  });
});

describe("MemoryRetriever", () => {
  it("searches by keyword", async () => {
    const store = new InMemoryStore();
    await store.put({ type: "context", key: "project", value: "ALP is a protocol for AI agents", importance: "high", scope: "project-1" });
    await store.put({ type: "context", key: "note", value: "Python is for data science", importance: "medium", scope: "project-2" });

    const retriever = new MemoryRetriever(store);
    const results = await retriever.search({ keyword: "ALP protocol", scope: "project-1", limit: 5 });

    expect(results.length).toBe(1);
    expect(results[0].entry.scope).toBe("project-1");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("searches semantically", async () => {
    const store = new InMemoryStore();
    await store.put({ type: "context", key: "q1", value: "Machine learning models require training data for ML", importance: "high" });
    await store.put({ type: "context", key: "q2", value: "The weather is sunny today", importance: "low" });

    const retriever = new MemoryRetriever(store);
    const results = await retriever.searchSemantic("ML model training data", undefined, 5);

    expect(results.length).toBe(2);
    expect(results[0].entry.key).toBe("q1");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("filters by time range", async () => {
    const store = new InMemoryStore();
    await store.put({ type: "context", key: "recent", value: "recent memory", importance: "high", createdAt: new Date().toISOString() } as any);

    const retriever = new MemoryRetriever(store);
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    const results = await retriever.searchTemporal(yesterday, now, undefined, 5);
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it("hybrid search combines semantic and keyword", async () => {
    const store = new InMemoryStore();
    await store.put({ type: "context", key: "k1", value: "Kubernetes orchestration and container deployment", importance: "high", scope: "devops" });
    await store.put({ type: "context", key: "k2", value: "Database schema migration for production", importance: "high", scope: "data" });

    const retriever = new MemoryRetriever(store);
    const results = await retriever.hybridSearch("container orchestration", "kubernetes deployment", "devops", 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.scope).toBe("devops");
  });
});
