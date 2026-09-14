import { agentRegistry as defaultAgentRegistry } from "../agents/registry";
import type { AgentRegistry } from "../agents/registry";

export interface WorkflowStep {
  stepId: string;
  agentId: string;
  toolId: string;
  description: string;
  required: boolean;
  timeoutMs?: number;
}

export interface ProductWorkflow {
  productId: string;
  name: string;
  description: string;
  primaryAgentId: string;
  secondaryAgentIds: string[];
  steps: WorkflowStep[];
  qualityGateIds: string[];
  requiredCapabilities: string[];
}

const WORKFLOWS: Record<string, ProductWorkflow> = {
  "security-scanner": {
    productId: "security-scanner",
    name: "ALP Security Scanner Workflow",
    description: "Automated security scanning: SAST → DAST → Dependency Check → Secret Scan → Policy Validation → SBOM → Compliance Report",
    primaryAgentId: "security",
    secondaryAgentIds: ["engineer"],
    requiredCapabilities: ["security:scan", "code:read", "deps:read"],
    qualityGateIds: ["security-scan-complete", "vuln-threshold-met"],
    steps: [
      { stepId: "1-sast", agentId: "security", toolId: "sast-scanner", description: "Run SAST scan on source code", required: true, timeoutMs: 30000 },
      { stepId: "2-dast", agentId: "security", toolId: "dast-scanner", description: "Run DAST scan on running application", required: true, timeoutMs: 60000 },
      { stepId: "3-deps", agentId: "security", toolId: "dependency-checker", description: "Check dependencies for known vulnerabilities", required: true, timeoutMs: 30000 },
      { stepId: "4-secrets", agentId: "security", toolId: "secret-scanner", description: "Scan for hardcoded secrets and credentials", required: true, timeoutMs: 15000 },
      { stepId: "5-policy", agentId: "security", toolId: "policy-validator", description: "Evaluate infrastructure against security policies", required: false, timeoutMs: 15000 },
      { stepId: "6-sbom", agentId: "security", toolId: "sbom-generator", description: "Generate Software Bill of Materials", required: true, timeoutMs: 30000 },
      { stepId: "7-license", agentId: "security", toolId: "license-checker", description: "Check dependency licenses for compliance", required: false, timeoutMs: 15000 },
      { stepId: "8-compliance", agentId: "security", toolId: "compliance-reporter", description: "Generate SOC2/ISO27001 compliance report", required: false, timeoutMs: 60000 },
    ],
  },

  "soc-sentinel": {
    productId: "soc-sentinel",
    name: "SOC Sentinel AI Workflow",
    description: "Threat detection → Alert triage → Incident response → Dashboard update",
    primaryAgentId: "soc",
    secondaryAgentIds: ["security", "threat-intel"],
    requiredCapabilities: ["siem:read", "soar:execute", "soc:view"],
    qualityGateIds: ["threat-responded", "incident-escalated"],
    steps: [
      { stepId: "1-siem", agentId: "soc", toolId: "siem", description: "Query SIEM for anomalous events", required: true, timeoutMs: 30000 },
      { stepId: "2-threatintel", agentId: "threat-intel", toolId: "threat-feed", description: "Correlate events with threat feeds", required: true, timeoutMs: 30000 },
      { stepId: "3-incident", agentId: "soc", toolId: "soar", description: "Execute incident response playbook", required: true, timeoutMs: 60000 },
      { stepId: "4-dashboard", agentId: "soc", toolId: "dashboarding", description: "Update SOC dashboard with incident data", required: true, timeoutMs: 15000 },
    ],
  },

  "threat-intel": {
    productId: "threat-intel",
    name: "Threat Intelligence Engine Workflow",
    description: "Vuln DB query → Threat feed correlation → Exploit prediction → Remediation recommendation",
    primaryAgentId: "threat-intel",
    secondaryAgentIds: ["security"],
    requiredCapabilities: ["vuln:read", "threat:read"],
    qualityGateIds: ["threat-correlated", "remediation-provided"],
    steps: [
      { stepId: "1-vuln-db", agentId: "threat-intel", toolId: "vuln-db", description: "Query vulnerability databases for known CVEs", required: true, timeoutMs: 30000 },
      { stepId: "2-threat-feed", agentId: "threat-intel", toolId: "threat-feed", description: "Correlate with external threat feeds", required: true, timeoutMs: 30000 },
      { stepId: "3-remediation", agentId: "threat-intel", toolId: "remediation", description: "Generate remediation recommendations", required: true, timeoutMs: 30000 },
    ],
  },

  "zero-trust": {
    productId: "zero-trust",
    name: "Zero Trust Orchestrator Workflow",
    description: "SPIFFE identity → mTLS config → OPA policy → Firewall rules",
    primaryAgentId: "zero-trust",
    secondaryAgentIds: ["security"],
    requiredCapabilities: ["identity:manage", "mtls:configure", "network:manage"],
    qualityGateIds: ["identity-issued", "mtls-enabled"],
    steps: [
      { stepId: "1-spiffe", agentId: "zero-trust", toolId: "spiffe-spire", description: "Issue SPIFFE identities for workloads", required: true, timeoutMs: 30000 },
      { stepId: "2-mtls", agentId: "zero-trust", toolId: "mtls", description: "Configure mutual TLS between services", required: true, timeoutMs: 30000 },
      { stepId: "3-opa", agentId: "zero-trust", toolId: "opa", description: "Apply OPA authorization policies", required: true, timeoutMs: 30000 },
      { stepId: "4-firewall", agentId: "zero-trust", toolId: "firewall", description: "Apply micro-segmentation firewall rules", required: false, timeoutMs: 30000 },
    ],
  },

  "chip-design": {
    productId: "chip-design",
    name: "Chip Design Studio Workflow",
    description: "RTL generation → Synthesis → Place & Route → Timing Analysis → Formal Verification",
    primaryAgentId: "eda",
    secondaryAgentIds: ["engineer"],
    requiredCapabilities: ["eda:write", "eda:execute", "eda:verify"],
    qualityGateIds: ["rtl-generated", "timing-closure-met"],
    steps: [
      { stepId: "1-rtl", agentId: "eda", toolId: "verilog-generator", description: "Generate Verilog RTL from specification", required: true, timeoutMs: 60000 },
      { stepId: "2-synth", agentId: "eda", toolId: "synthesis", description: "Synthesize RTL to gate-level", required: true, timeoutMs: 120000 },
      { stepId: "3-pr", agentId: "eda", toolId: "place-route", description: "Place and route the design", required: true, timeoutMs: 300000 },
      { stepId: "4-timing", agentId: "eda", toolId: "timing-analysis", description: "Perform static timing analysis", required: true, timeoutMs: 60000 },
      { stepId: "5-formal", agentId: "eda", toolId: "formal-verification", description: "Formal verification of properties", required: true, timeoutMs: 600000 },
    ],
  },

  "quantum-engineer": {
    productId: "quantum-engineer",
    name: "Quantum Engineering AI Workflow",
    description: "Circuit design → Simulation → QPU submission → Result analysis",
    primaryAgentId: "quantum",
    secondaryAgentIds: ["engineer"],
    requiredCapabilities: ["quantum:write", "qpu:access"],
    qualityGateIds: ["circuit-simulated", "result-verified"],
    steps: [
      { stepId: "1-circuit", agentId: "quantum", toolId: "quantum-circuit", description: "Design quantum circuit", required: true, timeoutMs: 30000 },
      { stepId: "2-qpu", agentId: "quantum", toolId: "qpu-orchestrator", description: "Submit circuit to QPU hardware", required: true, timeoutMs: 120000 },
    ],
  },

  "test-engine": {
    productId: "test-engine",
    name: "Test Engine Workflow",
    description: "Test generation → Unit tests → Integration tests → E2E tests → Property tests → Coverage analysis",
    primaryAgentId: "test-engine",
    secondaryAgentIds: ["engineer"],
    requiredCapabilities: ["test:execute", "test:generate"],
    qualityGateIds: ["tests-passing", "coverage-met"],
    steps: [
      { stepId: "1-unit", agentId: "test-engine", toolId: "testing-unit", description: "Generate and run unit tests", required: true, timeoutMs: 60000 },
      { stepId: "2-integration", agentId: "test-engine", toolId: "testing-integration", description: "Run integration tests across services", required: true, timeoutMs: 120000 },
      { stepId: "3-e2e", agentId: "test-engine", toolId: "testing-e2e", description: "Execute end-to-end test flows", required: false, timeoutMs: 180000 },
      { stepId: "4-property", agentId: "test-engine", toolId: "testing-property", description: "Run property-based tests", required: false, timeoutMs: 120000 },
    ],
  },

  "code-review": {
    productId: "code-review",
    name: "Code Review Workflow",
    description: "Lint → Style check → Security lint → Performance review → Approve/reject",
    primaryAgentId: "code-review",
    secondaryAgentIds: ["security", "engineer"],
    requiredCapabilities: ["code:read", "security:lint", "perf:analyze"],
    qualityGateIds: ["code-clean", "security-pass"],
    steps: [
      { stepId: "1-lint", agentId: "code-review", toolId: "lint", description: "Run linter and style checks", required: true, timeoutMs: 30000 },
      { stepId: "2-style", agentId: "code-review", toolId: "style", description: "Check code style consistency", required: false, timeoutMs: 15000 },
      { stepId: "3-security", agentId: "security", toolId: "security-lint", description: "Run security-specific linting", required: true, timeoutMs: 30000 },
      { stepId: "4-perf", agentId: "code-review", toolId: "perf", description: "Detect performance anti-patterns", required: false, timeoutMs: 45000 },
    ],
  },

  "release-manager": {
    productId: "release-manager",
    name: "Release Manager Workflow",
    description: "Version → Changelog → Build → Deploy → Monitor → Rollback if needed",
    primaryAgentId: "release-manager",
    secondaryAgentIds: ["devops", "engineer"],
    requiredCapabilities: ["release:coordinate", "deploy:write"],
    qualityGateIds: ["version-valid", "build-healthy"],
    steps: [
      { stepId: "1-version", agentId: "release-manager", toolId: "versioning", description: "Determine semantic version bump", required: true, timeoutMs: 15000 },
      { stepId: "2-changelog", agentId: "release-manager", toolId: "changelog", description: "Generate changelog from commits", required: true, timeoutMs: 15000 },
      { stepId: "3-rollback", agentId: "release-manager", toolId: "rollback", description: "Prepare rollback plan (pre-provisional)", required: true, timeoutMs: 15000 },
    ],
  },

  "api-designer": {
    productId: "api-designer",
    name: "API Designer Workflow",
    description: "Design → OpenAPI spec → AsyncAPI spec → SDK stub generation → Breaking change detection",
    primaryAgentId: "api-designer",
    secondaryAgentIds: ["engineer", "architecture-visualizer"],
    requiredCapabilities: ["api:design", "api:generate"],
    qualityGateIds: ["contract-valid", "breaking-change-checked"],
    steps: [
      { stepId: "1-openapi", agentId: "api-designer", toolId: "openapi-gen", description: "Generate OpenAPI specification", required: true, timeoutMs: 30000 },
      { stepId: "2-asyncapi", agentId: "api-designer", toolId: "asyncapi-gen", description: "Generate AsyncAPI spec for event streams", required: false, timeoutMs: 30000 },
      { stepId: "3-sdk", agentId: "api-designer", toolId: "sdk-stub-gen", description: "Generate SDK stubs from specs", required: true, timeoutMs: 60000 },
    ],
  },

  "arch-visualizer": {
    productId: "arch-visualizer",
    name: "Architecture Visualizer Workflow",
    description: "Code analysis → Dependency graph → Diagram generation → Impact analysis",
    primaryAgentId: "architecture-visualizer",
    secondaryAgentIds: ["engineer", "api-designer"],
    requiredCapabilities: ["code:read", "deps:analyze", "diagram:write"],
    qualityGateIds: ["graph-complete", "diagram-rendered"],
    steps: [
      { stepId: "1-depgraph", agentId: "architecture-visualizer", toolId: "dep-graph", description: "Build project dependency graph", required: true, timeoutMs: 30000 },
      { stepId: "2-diagram", agentId: "architecture-visualizer", toolId: "diagram-gen", description: "Generate architecture diagram", required: true, timeoutMs: 45000 },
      { stepId: "3-impact", agentId: "architecture-visualizer", toolId: "impact-analysis", description: "Analyze change impact", required: false, timeoutMs: 30000 },
    ],
  },

  "data-pipeline": {
    productId: "data-pipeline",
    name: "Data Pipeline Studio Workflow",
    description: "Source → ETL → Transform (dbt) → Schedule (Airflow) → Quality check → BI export",
    primaryAgentId: "data",
    secondaryAgentIds: ["engineer"],
    requiredCapabilities: ["pipeline:write", "data:validate", "bi:connect"],
    qualityGateIds: ["pipeline-healthy", "data-quality-met"],
    steps: [
      { stepId: "1-etl", agentId: "data", toolId: "etl-pipeline", description: "Build ETL pipeline from source to destination", required: true, timeoutMs: 120000 },
      { stepId: "2-dbt", agentId: "data", toolId: "dbt", description: "Create dbt transformation models", required: true, timeoutMs: 60000 },
      { stepId: "3-airflow", agentId: "data", toolId: "airflow", description: "Schedule pipeline via Airflow DAG", required: true, timeoutMs: 30000 },
      { stepId: "4-quality", agentId: "data", toolId: "data-quality", description: "Validate data quality expectations", required: true, timeoutMs: 30000 },
      { stepId: "5-bi", agentId: "data", toolId: "bi-export", description: "Export to BI tools and generate visualization", required: false, timeoutMs: 30000 },
    ],
  },

  "analytics-bi": {
    productId: "analytics-bi",
    name: "Analytics & BI Workflow",
    description: "Data extraction → Visualization → Dashboard creation → Export",
    primaryAgentId: "data",
    secondaryAgentIds: ["engineer"],
    requiredCapabilities: ["data:read", "viz:write", "bi:connect"],
    qualityGateIds: ["chart-rendered", "dashboard-complete"],
    steps: [
      { stepId: "1-bi", agentId: "data", toolId: "bi-export", description: "Connect to BI data source and extract dataset", required: true, timeoutMs: 60000 },
      { stepId: "2-viz", agentId: "data", toolId: "visualization", description: "Generate charts and visualizations", required: true, timeoutMs: 30000 },
    ],
  },

  "devops-bridge": {
    productId: "devops-bridge",
    name: "DevOps Bridge Workflow",
    description: "CI setup → Infrastructure (Terraform) → Kubernetes deploy → ArgoCD sync → Monitoring",
    primaryAgentId: "devops",
    secondaryAgentIds: ["engineer"],
    requiredCapabilities: ["ci:write", "deploy:write", "iac:write"],
    qualityGateIds: ["pipeline-configured", "deployment-healthy"],
    steps: [
      { stepId: "1-ci", agentId: "devops", toolId: "ci-github-actions", description: "Set up GitHub Actions CI/CD pipeline", required: true, timeoutMs: 30000 },
      { stepId: "2-argo", agentId: "devops", toolId: "argo-cd", description: "Configure ArgoCD GitOps deployment", required: true, timeoutMs: 30000 },
      { stepId: "3-monitor", agentId: "devops", toolId: "monitoring", description: "Set up observability and alerts", required: false, timeoutMs: 30000 },
    ],
  },

  "cloud-workspace": {
    productId: "cloud-workspace",
    name: "Cloud Workspace Workflow",
    description: "Workspace creation → RBAC setup → CI/CD configuration → Health monitoring",
    primaryAgentId: "engineer",
    secondaryAgentIds: ["devops"],
    requiredCapabilities: ["workspace:create", "rbac:manage", "deploy:write"],
    qualityGateIds: ["workspace-ready", "ci-configured"],
    steps: [
      { stepId: "1-cloud", agentId: "devops", toolId: "cloud-aws", description: "Provision cloud workspace infrastructure", required: true, timeoutMs: 60000 },
      { stepId: "2-k8s", agentId: "devops", toolId: "kubernetes", description: "Set up Kubernetes namespace and RBAC", required: true, timeoutMs: 60000 },
      { stepId: "3-monitor", agentId: "devops", toolId: "monitoring", description: "Configure workspace monitoring", required: false, timeoutMs: 30000 },
    ],
  },

  "migration-engine": {
    productId: "migration-engine",
    name: "Migration Engine Workflow",
    description: "Code analysis → Impact analysis → Refactoring → Testing → Deployment",
    primaryAgentId: "engineer",
    secondaryAgentIds: ["architecture-visualizer", "devops"],
    requiredCapabilities: ["code:read", "code:write", "deps:analyze"],
    qualityGateIds: ["migration-analyzed", "tests-passing"],
    steps: [
      { stepId: "1-impact", agentId: "architecture-visualizer", toolId: "impact-analysis", description: "Analyze impact of migration", required: true, timeoutMs: 30000 },
      { stepId: "2-refactor", agentId: "engineer", toolId: "code-formatter", description: "Refactor code to new patterns", required: true, timeoutMs: 120000 },
      { stepId: "3-tests", agentId: "engineer", toolId: "testing-unit", description: "Verify refactor with unit tests", required: true, timeoutMs: 60000 },
      { stepId: "4-deploy", agentId: "devops", toolId: "argo-cd", description: "Deploy refactored code", required: false, timeoutMs: 60000 },
    ],
  },

  "docs-engine": {
    productId: "docs-engine",
    name: "Documentation Engine Workflow",
    description: "Code analysis → OpenAPI spec → Diagram generation → Documentation portal",
    primaryAgentId: "engineer",
    secondaryAgentIds: [],
    requiredCapabilities: ["code:read", "api:design", "diagram:write"],
    qualityGateIds: ["docs-generated", "specs-updated"],
    steps: [
      { stepId: "1-openapi", agentId: "engineer", toolId: "openapi-gen", description: "Generate OpenAPI spec from code", required: true, timeoutMs: 30000 },
      { stepId: "2-diagram", agentId: "engineer", toolId: "diagram-gen", description: "Generate architecture diagrams", required: true, timeoutMs: 45000 },
    ],
  },

  "supply-chain-guardian": {
    productId: "supply-chain-guardian",
    name: "Supply Chain Guardian Workflow",
    description: "SBOM generation → License check → Dependency scan → Provenance verification",
    primaryAgentId: "security",
    secondaryAgentIds: ["engineer"],
    requiredCapabilities: ["deps:read", "license:read", "sbom:write"],
    qualityGateIds: ["sbom-complete", "license-valid"],
    steps: [
      { stepId: "1-sbom", agentId: "security", toolId: "sbom-generator", description: "Generate Software Bill of Materials", required: true, timeoutMs: 30000 },
      { stepId: "2-license", agentId: "security", toolId: "license-checker", description: "Check license compliance", required: true, timeoutMs: 30000 },
      { stepId: "3-deps", agentId: "security", toolId: "dependency-checker", description: "Scan dependencies for vulnerabilities", required: true, timeoutMs: 60000 },
    ],
  },

  "perf-profiler": {
    productId: "perf-profiler",
    name: "Performance Profiler Workflow",
    description: "Runtime profiling → Bottleneck detection → Optimization suggestions",
    primaryAgentId: "engineer",
    secondaryAgentIds: ["devops"],
    requiredCapabilities: ["perf:analyze", "metric:read"],
    qualityGateIds: ["profile-complete", "bottleneck-identified"],
    steps: [
      { stepId: "1-perf", agentId: "engineer", toolId: "perf", description: "Run performance profiling and analysis", required: true, timeoutMs: 60000 },
      { stepId: "2-impact", agentId: "engineer", toolId: "impact-analysis", description: "Analyze optimization impact", required: false, timeoutMs: 30000 },
    ],
  },
};

export const PRODUCT_WORKFLOWS: ProductWorkflow[] = Object.values(WORKFLOWS);

export function getProductWorkflow(productId: string): ProductWorkflow | undefined {
  return WORKFLOWS[productId];
}

export function getWorkflowsForAgent(agentId: string): ProductWorkflow[] {
  return PRODUCT_WORKFLOWS.filter((w) => w.primaryAgentId === agentId || w.secondaryAgentIds.includes(agentId));
}

export function getStepsForAgent(workflowId: string, agentId: string): WorkflowStep[] {
  const workflow = getProductWorkflow(workflowId);
  if (!workflow) return [];
  return workflow.steps.filter((s) => s.agentId === agentId);
}

export function validatePersonasForWorkflow(workflow: ProductWorkflow, registry: AgentRegistry = defaultAgentRegistry): boolean {
  const allAgentIds = [workflow.primaryAgentId, ...workflow.secondaryAgentIds];
  return allAgentIds.every((id) => registry.get(id) !== undefined);
}
