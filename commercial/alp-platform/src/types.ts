export interface VendorManifest {
  id: string;
  name: string;
  type: "cloud" | "onprem" | "edge" | "embedded" | "quantum" | "hybrid";
  region?: string;
  auth: {
    type: "api-key" | "oauth" | "saml" | "mtls" | "token";
    scopes?: string[];
  };
  endpoints: Record<string, string>;
  capabilities: string[];
  rateLimits?: { rpm?: number; tpm?: number };
}

export interface VendorAdapter {
  readonly vendor: VendorManifest;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  invoke<T = unknown>(service: string, payload: unknown): Promise<T>;
  health(): Promise<{ status: string; latencyMs: number }>;
}

export interface FrameworkAdapter {
  id: string;
  name: string;
  ecosystem: string;
  versions: string[];
  packageManager: "npm" | "pip" | "go" | "cargo" | "maven" | "nuget" | "composer" | "pub";
  detect(projectRoot: string): Promise<boolean>;
  scaffold(projectRoot: string, template: string): Promise<void>;
  build(projectRoot: string): Promise<{ artifacts: string[] }>;
  test(projectRoot: string): Promise<{ passed: number; failed: number }>;
  deploy(projectRoot: string, target: string): Promise<{ url: string }>;
}

export interface LibraryAdapter {
  id: string;
  name: string;
  category:
    | "ui"
    | "data"
    | "ml"
    | "crypto"
    | "graphics"
    | "audio"
    | "video"
    | "networking"
    | "storage"
    | "security"
    | "testing"
    | "build"
    | "iot"
    | "quantum"
    | "hardware";
  versions: string[];
  compatibleFrameworks: string[];
  install(projectRoot: string): Promise<void>;
  configure(projectRoot: string, config: Record<string, unknown>): Promise<void>;
}

export interface SoftwareProject {
  id: string;
  name: string;
  description: string;
  owner: string;
  framework: string;
  libraries: string[];
  milestones: Milestone[];
  resources: ResourceAllocation[];
  status: "planned" | "active" | "blocked" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  deliverables: string[];
}

export interface ResourceAllocation {
  id: string;
  type: "human" | "compute" | "storage" | "network" | "llm";
  vendor: string;
  amount: number;
  unit: string;
  allocatedAt: string;
}

export interface HardwareDevice {
  id: string;
  name: string;
  kind:
    | "sbc"
    | "sensor"
    | "actuator"
    | "camera"
    | "microphone"
    | "robot"
    | "drone"
    | "iot-gateway"
    | "edge-tpu"
    | "neuromorphic"
    | "qpu";
  vendor: string;
  status: "online" | "offline" | "error" | "provisioning";
  specs: Record<string, unknown>;
  sensors: HardwareSensor[];
  location?: { lat: number; lng: number; altitude?: number };
  lastSeen: string;
}

export interface HardwareSensor {
  id: string;
  name: string;
  type: string;
  unit: string;
  value?: number;
  lastReadingAt?: string;
}

export interface ProductPlan {
  id: string;
  name: string;
  description: string;
  tier: "community" | "pro" | "enterprise" | "custom";
  roadmap: RoadmapMilestone[];
  dependencies: string[];
  estimatedCost: { usd: number; currency: string };
  targetLaunch: string;
  status: "draft" | "approved" | "in_progress" | "shipped";
}

export interface RoadmapMilestone {
  id: string;
  name: string;
  description: string;
  quarter: string;
  features: string[];
  dependencies: string[];
  risk: "low" | "medium" | "high";
}

export interface VisualizationScene {
  id: string;
  name: string;
  mode: "2d" | "3d" | "ar" | "vr";
  engine: "three" | "react-flow" | "d3" | "native";
  entities: SceneEntity[];
  camera?: CameraConfig;
  lights?: LightConfig[];
}

export interface SceneEntity {
  id: string;
  type: "node" | "edge" | "device" | "agent" | "model" | "sensor";
  label: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  metadata: Record<string, unknown>;
}

export interface CameraConfig {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
}

export interface LightConfig {
  type: "ambient" | "directional" | "point" | "spot";
  color: string;
  intensity: number;
  position?: [number, number, number];
}

export interface LLMProviderConfig {
  id: string;
  vendor: string;
  provider: "openai" | "anthropic" | "ollama" | "azure" | "aws" | "gcp" | "local";
  apiKey?: string;
  endpoint?: string;
  models: LLMModelConfig[];
  defaultModel: string;
  rateLimits?: { rpm?: number; tpm?: number };
}

export interface LLMModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
}

export interface LLMAgentConfig {
  id: string;
  name: string;
  role: "coder" | "reviewer" | "tester" | "architect" | "planner" | "hardware" | "quantum";
  provider: string;
  model: string;
  fallbackProviders?: Array<{ provider: string; model: string }>;
  systemPrompt: string;
  tools: string[];
  temperature: number;
  maxTokens: number;
}

export interface ProviderHealth {
  providerId: string;
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  error?: string;
}

export interface LLMCompletionOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  failover?: boolean;
}

export interface LLMCompletionResult {
  text: string;
  provider: string;
  model: string;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
}

export interface ThreeScene {
  id: string;
  name: string;
  scene: unknown;
  camera: unknown;
  renderer: unknown;
  controls: unknown;
}

export interface Plan3D {
  id: string;
  name: string;
  entities: SceneEntity[];
  layout: "grid" | "freeform" | "force" | "circular";
  bounds: { width: number; height: number; depth: number };
}

export interface AgentTask {
  id: string;
  swarmId: string;
  parentTaskId?: string;
  role: "coder" | "reviewer" | "tester" | "architect" | "planner" | "researcher";
  prompt: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  result?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  tokensUsed?: number;
  costUsd?: number;
}

export interface AgentSwarmRun {
  swarmId: string;
  goal: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  maxConcurrent: number;
  tasks: AgentTask[];
  decisions: Array<Record<string, unknown>>;
  startedAt?: string;
  completedAt?: string;
}

export interface EditProposal {
  proposalId: string;
  swarmId: string;
  edits: Array<Record<string, unknown>>;
  rationale: string;
  status: "pending" | "approved" | "denied" | "rolled_back";
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface AdaptiveSignal {
  kind: "latency" | "error_rate" | "throughput" | "cost";
  value: number;
  metadata?: Record<string, unknown>;
  observedAt: string;
}

export interface CostBudget {
  id: string;
  taskId: string;
  maxTokens: number;
  maxCostUsd: number;
  usedTokens: number;
  usedCostUsd: number;
  provider: string;
  modelTier: string;
  createdAt: string;
}

export interface ModelCostEntry {
  provider: string;
  model: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  contextWindow: number;
  tier: "budget" | "standard" | "premium" | "frontier";
}

export interface ModelSelectionResult {
  provider: string;
  model: string;
  estimatedCostPer1k: number;
  reason: string;
}

export interface MemoryEntry {
  id: string;
  type: string;
  key: string;
  value: string;
  importance: "low" | "medium" | "high" | "critical";
  scope?: string;
  source?: string;
  ttl?: number;
  createdAt: string;
  updatedAt: string;
  tokensEstimate?: number;
}

export interface MemoryQuery {
  type?: string;
  scope?: string;
  key?: string;
  importance?: MemoryEntry["importance"];
  limit?: number;
}

export interface MemoryContextWindow {
  maxTokens: number;
  reservedSystemTokens: number;
  reservedResponseTokens: number;
}

export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  rules: SafetyRule[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface SafetyRule {
  id: string;
  name: string;
  description: string;
}

export interface SafetyContext {
  agentId?: string;
  swarmId?: string;
  taskId?: string;
  action: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SafetyRuleResult {
  passed: boolean;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  remediation?: string;
}

export interface SafetyEvaluation {
  evaluationId: string;
  context: SafetyContext;
  results: SafetyRuleResult[];
  overallPassed: boolean;
  evaluatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "task" | "condition" | "parallel" | "sequence" | "delay";
  config: Record<string, unknown>;
  dependencies?: string[];
  retries?: number;
  timeoutMs?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: string[];
}

export interface WorkflowRun {
  runId: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStep?: string;
  results: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface ResearchTask {
  id: string;
  type: "literature_review" | "data_analysis" | "hypothesis_test" | "figure_generation" | "manuscript";
  query: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: unknown;
  sources?: string[];
  createdAt: string;
  completedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  result: "success" | "failure";
  timestamp: string;
}

export interface VoiceSession {
  sessionId: string;
  status: "idle" | "listening" | "processing" | "speaking";
  transcript?: string;
  response?: string;
  startedAt?: string;
}

export interface MultimodalInput {
  type: "text" | "audio" | "image" | "video";
  data: string;
  mimeType?: string;
}

export interface AgentNode {
  nodeId: string;
  address: string;
  capabilities: string[];
  status: "online" | "offline" | "busy";
  lastSeen: string;
}

export interface CodeReview {
  file: string;
  issues: Array<{
    line?: number;
    severity: "info" | "warning" | "error";
    message: string;
    suggestion?: string;
  }>;
}

export interface PerformanceReport {
  file: string;
  metrics: {
    complexity: number;
    coverage: number;
    suggestions: string[];
  };
}
