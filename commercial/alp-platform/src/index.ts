import { VendorAdapterRegistry } from "./adapters/registry";
import { SoftwarePlanningEngine } from "./planning/software";
import { HardwarePlanningEngine } from "./planning/hardware";
import { VisualizationEngine } from "./visualization/engine";
import { LLMOrchestrator } from "./llm/orchestrator";
import { ProductPlanningEngine } from "./product/engine";
import { HardwareManager } from "./hardware/manager";
import { MCPClient } from "./tools/mcp-client";
import { AgentOrchestrator } from "./agents/orchestrator";
import { CodingAgent } from "./agents/coding-agent";
import { CostBudgetEngine } from "./budget/cost-engine";
import { MemoryManager } from "./memory/manager";
import { SafetyEvaluator } from "./safety/evaluator";
import { WorkflowEngine } from "./workflow/engine";
import { ResearchWorkbench } from "./research/workbench";
import { AuditLogger } from "./governance/audit-log";
import { CostManager } from "./governance/cost-manager";
import { VoiceMultimodalEngine } from "./multimodal/voice";
import { DistributedAgentNetwork } from "./distributed/network";
import { SelfImprovingCodebase } from "./self-improving/engine";
import { OpenAIProvider, AnthropicProvider, OllamaProvider } from "./llm/providers";
import {
  AWSVendorAdapter,
  AzureVendorAdapter,
  GCPVendorAdapter,
  OllamaVendorAdapter,
  NvidiaVendorAdapter,
  RaspberryPiVendorAdapter,
  JetsonVendorAdapter,
  AWSIoTVendorAdapter,
  IonQVendorAdapter,
  GitHubVendorAdapter,
  HuggingFaceVendorAdapter,
  DeepSeekVendorAdapter,
  GroqVendorAdapter,
  ScientificVendorAdapter,
  CybersecurityVendorAdapter,
  BusinessIntelligenceVendorAdapter,
} from "./adapters/vendors";
import {
  ReactFrameworkAdapter,
  VueFrameworkAdapter,
  SvelteFrameworkAdapter,
  NextJsFrameworkAdapter,
  DjangoFrameworkAdapter,
  SpringFrameworkAdapter,
  FlutterFrameworkAdapter,
  DotNetFrameworkAdapter,
} from "./adapters/frameworks";
import {
  ShadcnLibraryAdapter,
  TailwindLibraryAdapter,
  ReactQueryLibraryAdapter,
  TensorFlowLibraryAdapter,
  PyTorchLibraryAdapter,
  WebGLibraryAdapter,
  CryptoLibraryAdapter,
  StorageLibraryAdapter,
  TestingLibraryAdapter,
  IoTLibraryAdapter,
  QuantumLibraryAdapter,
} from "./adapters/libraries";

export class EnterprisePlatform {
  readonly vendors: VendorAdapterRegistry;
  readonly software: SoftwarePlanningEngine;
  readonly hardware: HardwarePlanningEngine;
  readonly visualization: VisualizationEngine;
  readonly llm: LLMOrchestrator;
  readonly products: ProductPlanningEngine;
  readonly devices: HardwareManager;
  readonly tools: MCPClient;
  readonly agents: AgentOrchestrator;
  readonly budget: CostBudgetEngine;
  readonly memory: MemoryManager;
  readonly coding: CodingAgent;
  readonly safety: SafetyEvaluator;
  readonly workflow: WorkflowEngine;
  readonly research: ResearchWorkbench;
  readonly audit: AuditLogger;
  readonly cost: CostManager;
  readonly voice: VoiceMultimodalEngine;
  readonly distributed: DistributedAgentNetwork;
  readonly selfImproving: SelfImprovingCodebase;

  constructor() {
    this.vendors = new VendorAdapterRegistry();
    this.software = new SoftwarePlanningEngine();
    this.hardware = new HardwarePlanningEngine();
    this.visualization = new VisualizationEngine();
    this.llm = new LLMOrchestrator();
    this.products = new ProductPlanningEngine();
    this.devices = new HardwareManager();
    this.tools = new MCPClient({ command: "", args: [] });
    this.agents = new AgentOrchestrator();
    this.budget = new CostBudgetEngine();
    this.memory = new MemoryManager();
    this.coding = new CodingAgent({ workspaceRoot: "" });
    this.safety = new SafetyEvaluator();
    this.workflow = new WorkflowEngine();
    this.research = new ResearchWorkbench();
    this.audit = new AuditLogger();
    this.cost = new CostManager();
    this.voice = new VoiceMultimodalEngine();
    this.distributed = new DistributedAgentNetwork();
    this.selfImproving = new SelfImprovingCodebase();

    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.vendors.registerVendor(new AWSVendorAdapter());
    this.vendors.registerVendor(new AzureVendorAdapter());
    this.vendors.registerVendor(new GCPVendorAdapter());
    this.vendors.registerVendor(new OllamaVendorAdapter());
    this.vendors.registerVendor(new NvidiaVendorAdapter());
    this.vendors.registerVendor(new RaspberryPiVendorAdapter());
    this.vendors.registerVendor(new JetsonVendorAdapter());
    this.vendors.registerVendor(new AWSIoTVendorAdapter());
    this.vendors.registerVendor(new IonQVendorAdapter());
    this.vendors.registerVendor(new GitHubVendorAdapter());
    this.vendors.registerVendor(new HuggingFaceVendorAdapter());
    this.vendors.registerVendor(new DeepSeekVendorAdapter());
    this.vendors.registerVendor(new GroqVendorAdapter());
    this.vendors.registerVendor(new ScientificVendorAdapter());
    this.vendors.registerVendor(new CybersecurityVendorAdapter());
    this.vendors.registerVendor(new BusinessIntelligenceVendorAdapter());

    this.vendors.registerFramework(new ReactFrameworkAdapter());
    this.vendors.registerFramework(new VueFrameworkAdapter());
    this.vendors.registerFramework(new SvelteFrameworkAdapter());
    this.vendors.registerFramework(new NextJsFrameworkAdapter());
    this.vendors.registerFramework(new DjangoFrameworkAdapter());
    this.vendors.registerFramework(new SpringFrameworkAdapter());
    this.vendors.registerFramework(new FlutterFrameworkAdapter());
    this.vendors.registerFramework(new DotNetFrameworkAdapter());

    this.vendors.registerLibrary(new ShadcnLibraryAdapter());
    this.vendors.registerLibrary(new TailwindLibraryAdapter());
    this.vendors.registerLibrary(new ReactQueryLibraryAdapter());
    this.vendors.registerLibrary(new TensorFlowLibraryAdapter());
    this.vendors.registerLibrary(new PyTorchLibraryAdapter());
    this.vendors.registerLibrary(new WebGLibraryAdapter());
    this.vendors.registerLibrary(new CryptoLibraryAdapter());
    this.vendors.registerLibrary(new StorageLibraryAdapter());
    this.vendors.registerLibrary(new TestingLibraryAdapter());
    this.vendors.registerLibrary(new IoTLibraryAdapter());
    this.vendors.registerLibrary(new QuantumLibraryAdapter());

    this.llm.registerProvider(
      new OpenAIProvider({
        id: "openai-default",
        name: "OpenAI",
        apiKey: process.env.OPENAI_API_KEY,
        models: [
          { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxOutput: 16384 },
          { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000, maxOutput: 16384 },
        ],
        defaultModel: "gpt-4o",
      }),
    );
    this.llm.registerProvider(
      new AnthropicProvider({
        id: "anthropic-default",
        name: "Anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY,
        models: [
          { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", contextWindow: 200000, maxOutput: 16384 },
          { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextWindow: 200000, maxOutput: 8192 },
        ],
        defaultModel: "claude-sonnet-4-20250514",
      }),
    );
    this.llm.registerProvider(
      new OllamaProvider({
        id: "ollama-default",
        name: "Ollama",
        endpoint: process.env.OLLAMA_ENDPOINT ?? "http://localhost:11434",
        models: [
          { id: "llama3.1", name: "Llama 3.1", contextWindow: 128000, maxOutput: 8192 },
          { id: "mistral", name: "Mistral", contextWindow: 32000, maxOutput: 4096 },
        ],
        defaultModel: "llama3.1",
      }),
    );
  }
}

export { VendorAdapterRegistry } from "./adapters/registry";
export { SoftwarePlanningEngine } from "./planning/software";
export { HardwarePlanningEngine } from "./planning/hardware";
export { VisualizationEngine } from "./visualization/engine";
export { LLMOrchestrator, ProviderHealth, LLMCompletionOptions, LLMCompletionResult } from "./llm/orchestrator";
export {
  LLMProvider,
  ProviderCompletionOptions,
  ProviderCompletionResult,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
} from "./llm/providers";
export { ProductPlanningEngine } from "./product/engine";
export { HardwareManager } from "./hardware/manager";
export { MCPClient, MCPTool, MCPToolResult, MCPClientOptions, MCPToolCallError, MCPConnectionError } from "./tools/mcp-client";
export { AgentOrchestrator, AgentTaskResult } from "./agents/orchestrator";
export { CostBudgetEngine } from "./budget/cost-engine";
export { MemoryManager } from "./memory/manager";
export { CodingAgent, CodingTask } from "./agents/coding-agent";
export { SafetyEvaluator } from "./safety/evaluator";
export { WorkflowEngine } from "./workflow/engine";
export { ResearchWorkbench } from "./research/workbench";
export { AuditLogger } from "./governance/audit-log";
export { CostManager } from "./governance/cost-manager";
export { VoiceMultimodalEngine } from "./multimodal/voice";
export { DistributedAgentNetwork } from "./distributed/network";
export { SelfImprovingCodebase } from "./self-improving/engine";

export type {
  VendorAdapter,
  FrameworkAdapter,
  LibraryAdapter,
  VendorManifest,
  SoftwareProject,
  HardwareDevice,
  HardwareSensor,
  ProductPlan,
  RoadmapMilestone,
  VisualizationScene,
  LLMProviderConfig,
  LLMAgentConfig,
  LLMModelConfig,
  ThreeScene,
  Plan3D,
  AgentTask,
  AgentSwarmRun,
  EditProposal,
  AdaptiveSignal,
  CostBudget,
  ModelCostEntry,
  ModelSelectionResult,
  MemoryEntry,
  MemoryQuery,
  MemoryContextWindow,
  SafetyPolicy,
  SafetyRule,
  SafetyContext,
  SafetyRuleResult,
  SafetyEvaluation,
  WorkflowStep,
  WorkflowDefinition,
  WorkflowRun,
  ResearchTask,
  AuditLogEntry,
  VoiceSession,
  MultimodalInput,
  AgentNode,
  CodeReview,
  PerformanceReport,
} from "./types";
