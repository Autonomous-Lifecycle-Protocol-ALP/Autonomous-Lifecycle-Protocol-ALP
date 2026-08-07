import { describe, it, expect } from "vitest";
import { EnterprisePlatform } from "../src/index";
import { OpenAIProvider } from "../src/llm/providers";

describe("EnterprisePlatform", () => {
  it("creates a platform with all engines initialized", () => {
    const platform = new EnterprisePlatform();
    expect(platform.vendors).toBeDefined();
    expect(platform.software).toBeDefined();
    expect(platform.hardware).toBeDefined();
    expect(platform.visualization).toBeDefined();
    expect(platform.llm).toBeDefined();
    expect(platform.products).toBeDefined();
    expect(platform.devices).toBeDefined();
    expect(platform.tools).toBeDefined();
    expect(platform.agents).toBeDefined();
    expect(platform.budget).toBeDefined();
    expect(platform.memory).toBeDefined();
    expect(platform.coding).toBeDefined();
    expect(platform.safety).toBeDefined();
    expect(platform.workflow).toBeDefined();
  });

  it("registers 13 vendor adapters by default", () => {
    const platform = new EnterprisePlatform();
    const vendors = platform.vendors.listVendors();
    expect(vendors.length).toBe(16);
  });

  it("registers 8 framework adapters by default", () => {
    const platform = new EnterprisePlatform();
    const frameworks = platform.vendors.listFrameworks();
    expect(frameworks.length).toBe(8);
  });

  it("registers 11 library adapters by default", () => {
    const platform = new EnterprisePlatform();
    const libraries = platform.vendors.listLibraries();
    expect(libraries.length).toBe(11);
  });

  it("creates a software project", () => {
    const platform = new EnterprisePlatform();
    const project = platform.software.createProject({
      id: "proj-1",
      name: "ALP Core",
      description: "Core protocol implementation",
      owner: "team",
      framework: "nextjs",
      libraries: ["react", "tailwind"],
      milestones: [],
      resources: [],
      status: "active",
    });
    expect(project.name).toBe("ALP Core");
    expect(project.status).toBe("active");
  });

  it("plans a hardware device", () => {
    const platform = new EnterprisePlatform();
    const device = platform.hardware.planDevice({
      id: "dev-1",
      name: "Edge Sensor A",
      kind: "sensor",
      vendor: "raspberrypi",
      status: "online",
      specs: { resolution: "1080p" },
      sensors: [],
    });
    expect(device.kind).toBe("sensor");
  });

  it("creates a product plan", () => {
    const platform = new EnterprisePlatform();
    const plan = platform.products.createPlan({
      id: "plan-1",
      name: "Enterprise ALP",
      description: "Full enterprise suite",
      tier: "enterprise",
      roadmap: [],
      dependencies: ["core"],
      estimatedCost: { usd: 500000, currency: "USD" },
      targetLaunch: "2026-12-01",
      status: "draft",
    });
    expect(plan.tier).toBe("enterprise");
  });

  it("registers and resolves an LLM provider", () => {
    const platform = new EnterprisePlatform();
    platform.llm.registerProvider(
      new OpenAIProvider({
        id: "openai-provider",
        name: "OpenAI",
        apiKey: "test-key",
        models: [
          {
            id: "gpt-4",
            name: "GPT-4",
            contextWindow: 8192,
            maxOutput: 4096,
          },
        ],
        defaultModel: "gpt-4",
      }),
    );
    expect(platform.llm.getProvider("openai-provider")?.id).toBe("openai-provider");
  });

  it("manages hardware devices", () => {
    const platform = new EnterprisePlatform();
    const device = platform.devices.register({
      id: "hw-1",
      name: "Jetson Nano",
      kind: "sbc",
      vendor: "nvidia-jetson",
      status: "provisioning",
      specs: { cpu: "4-core" },
      sensors: [],
    });
    expect(device.status).toBe("provisioning");
    platform.devices.setStatus("hw-1", "online");
    expect(platform.devices.getDevice("hw-1")?.status).toBe("online");
  });

  it("evaluates safety policies", async () => {
    const platform = new EnterprisePlatform();
    platform.safety.registerPolicy({
      id: "policy-1",
      name: "Custom policy",
      description: "Custom policy for testing",
      rules: [
        {
          id: "rule-custom",
          name: "Custom check",
          description: "Custom safety check",
          check: () => ({
            passed: true,
            severity: "low" as const,
            message: "Custom check passed",
          }),
        },
      ],
      severity: "low",
    });
    const result = await platform.safety.evaluate({
      action: "create_report",
      payload: { title: "Summary" },
    });
    expect(result.evaluationId).toBeDefined();
    expect(result.overallPassed).toBe(true);
  });

  it("manages workflows", () => {
    const platform = new EnterprisePlatform();
    platform.workflow.registerWorkflow({
      id: "wf-1",
      name: "Deploy pipeline",
      description: "Deploy to production",
      steps: [
        { id: "step-1", name: "Build", type: "task", config: {} },
        { id: "step-2", name: "Test", type: "task", config: {}, dependencies: ["step-1"] },
      ],
      triggers: ["push"],
    });
    const workflow = platform.workflow.getWorkflow("wf-1");
    expect(workflow?.name).toBe("Deploy pipeline");
    const run = platform.workflow.startRun("wf-1", { branch: "main" });
    expect(run?.status).toBe("running");
  });

  it("creates coding tasks", () => {
    const platform = new EnterprisePlatform();
    const task = platform.coding.createTask("Add user authentication", ["Tests pass", "Coverage > 80%"]);
    expect(task.status).toBe("pending");
    expect(task.goal).toBe("Add user authentication");
  });

  it("tracks LLM provider health", () => {
    const platform = new EnterprisePlatform();
    platform.llm.registerProvider(
      new OpenAIProvider({
        id: "openai-health",
        name: "OpenAI",
        apiKey: "test-key",
        models: [{ id: "gpt-4", name: "GPT-4", contextWindow: 8192, maxOutput: 4096 }],
        defaultModel: "gpt-4",
      }),
    );
    platform.llm.markProviderHealthy("openai-health", 120);
    const health = platform.llm.getProviderHealth("openai-health");
    expect(health?.healthy).toBe(true);
    expect(health?.latencyMs).toBe(120);
  });

  it("resolves provider with failover", async () => {
    const platform = new EnterprisePlatform();
    platform.llm.registerProvider(
      new OpenAIProvider({
        id: "provider-a",
        name: "Provider A",
        apiKey: "test-key",
        models: [{ id: "model-a", name: "Model A", contextWindow: 8192, maxOutput: 4096 }],
        defaultModel: "model-a",
      }),
    );
    platform.llm.registerAgent({
      id: "agent-1",
      name: "Test Agent",
      role: "coder",
      provider: "provider-a",
      model: "model-a",
      systemPrompt: "Test",
      tools: [],
      temperature: 0.7,
      maxTokens: 1024,
    });
    const resolved = await platform.llm.resolveProviderWithFailover("agent-1", { failover: true });
    expect(resolved?.provider.id).toBe("provider-a");
    expect(resolved?.model.id).toBe("model-a");
  });
});
