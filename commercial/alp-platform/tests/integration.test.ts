import { describe, it, expect } from "vitest";
import { EnterprisePlatform } from "../src/index";
import { OpenAIProvider, AnthropicProvider } from "../src/llm/providers";

describe("Adapter Registry Integration", () => {
  it("lists all adapters from a single registry", () => {
    const platform = new EnterprisePlatform();
    const vendors = platform.vendors.listVendors();
    const frameworks = platform.vendors.listFrameworks();
    const libraries = platform.vendors.listLibraries();

    expect(vendors.length).toBe(16);
    expect(frameworks.length).toBe(8);
    expect(libraries.length).toBe(11);
    expect(vendors.length + frameworks.length + libraries.length).toBeGreaterThan(20);
  });

  it("resolves vendor by id", () => {
    const platform = new EnterprisePlatform();
    const aws = platform.vendors.getVendor("aws");
    expect(aws?.vendor.id).toBe("aws");
    expect(aws?.vendor.type).toBe("cloud");
  });

  it("resolves framework by id", () => {
    const platform = new EnterprisePlatform();
    const react = platform.vendors.getFramework("react");
    expect(react?.id).toBe("react");
    expect(react?.ecosystem).toBe("frontend");
  });

  it("resolves library by id", () => {
    const platform = new EnterprisePlatform();
    const tailwind = platform.vendors.getLibrary("tailwindcss");
    expect(tailwind?.id).toBe("tailwindcss");
    expect(tailwind?.category).toBe("ui");
  });

  it("creates a software project using a framework and libraries", () => {
    const platform = new EnterprisePlatform();
    const project = platform.software.createProject({
      id: "proj-integration",
      name: "Integration Test Project",
      description: "Tests adapter registry integration",
      owner: "test-team",
      framework: "react",
      libraries: ["tailwind", "tanstack-query"],
      milestones: [],
      resources: [],
      status: "active",
    });

    expect(project.framework).toBe("react");
    expect(project.libraries).toEqual(["tailwind", "tanstack-query"]);
  });

  it("plans hardware using vendor adapter", () => {
    const platform = new EnterprisePlatform();
    const device = platform.hardware.planDevice({
      id: "hw-integration",
      name: "Integration Device",
      kind: "sbc",
      vendor: "raspberrypi",
      status: "online",
      specs: { cpu: "4-core" },
      sensors: [],
    });

    expect(device.vendor).toBe("raspberrypi");
  });

  it("registers LLM providers and resolves agents", async () => {
    const platform = new EnterprisePlatform();
    platform.llm.registerProvider(
      new OpenAIProvider({
        id: "openai-integration",
        name: "OpenAI",
        apiKey: "test-key",
        models: [
          { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxOutput: 16384 },
        ],
        defaultModel: "gpt-4o",
      }),
    );

    platform.llm.registerAgent({
      id: "agent-integration",
      name: "Integration Agent",
      role: "coder",
      provider: "openai-integration",
      model: "gpt-4o",
      systemPrompt: "You are a test agent",
      tools: [],
      temperature: 0.7,
      maxTokens: 1024,
    });

    const provider = platform.llm.getProvider("openai-integration");
    expect(provider?.id).toBe("openai-integration");

    const resolved = await platform.llm.resolveProviderWithFailover("agent-integration");
    expect(resolved?.provider.id).toBe("openai-integration");
    expect(resolved?.model.id).toBe("gpt-4o");
  });

  it("falls back to alternate provider when primary is unhealthy", async () => {
    const platform = new EnterprisePlatform();
    platform.llm.registerProvider(
      new OpenAIProvider({
        id: "openai-fallback",
        name: "OpenAI Fallback",
        apiKey: "test-key",
        models: [
          { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxOutput: 16384 },
        ],
        defaultModel: "gpt-4o",
      }),
    );
    platform.llm.registerProvider(
      new AnthropicProvider({
        id: "anthropic-fallback",
        name: "Anthropic Fallback",
        apiKey: "test-key",
        models: [
          { id: "claude-sonnet", name: "Claude Sonnet", contextWindow: 200000, maxOutput: 16384 },
        ],
        defaultModel: "claude-sonnet",
      }),
    );

    platform.llm.registerAgent({
      id: "agent-fallback",
      name: "Fallback Agent",
      role: "coder",
      provider: "openai-fallback",
      model: "gpt-4o",
      fallbackProviders: [{ provider: "anthropic-fallback", model: "claude-sonnet" }],
      systemPrompt: "Test",
      tools: [],
      temperature: 0.7,
      maxTokens: 1024,
    });

    platform.llm.markProviderUnhealthy("openai-fallback", "rate limited");
    const resolved = await platform.llm.resolveProviderWithFailover("agent-fallback", { failover: true });
    expect(resolved?.provider.id).toBe("anthropic-fallback");
  });

  it("creates a product plan using project and device data", () => {
    const platform = new EnterprisePlatform();

    const project = platform.software.createProject({
      id: "proj-plan",
      name: "Plan Integration",
      description: "Integration test",
      owner: "team",
      framework: "nextjs",
      libraries: [],
      milestones: [],
      resources: [],
      status: "active",
    });

    const device = platform.hardware.planDevice({
      id: "hw-plan",
      name: "Plan Device",
      kind: "sensor",
      vendor: "nvidia-jetson",
      status: "online",
      specs: {},
      sensors: [],
    });

    const plan = platform.products.createPlan({
      id: "plan-integration",
      name: "Integration Plan",
      description: "Test product plan",
      tier: "enterprise",
      roadmap: [
        { id: "milestone-1", name: "Milestone 1", dueDate: "2026-12-01", status: "pending", deliverables: [] },
      ],
      dependencies: [],
      estimatedCost: { usd: 100000, currency: "USD" },
      targetLaunch: "2026-12-01",
      status: "draft",
    });

    expect(project.id).toBe("proj-plan");
    expect(device.id).toBe("hw-plan");
    expect(plan.id).toBe("plan-integration");
    expect(plan.tier).toBe("enterprise");
  });
});
