import { agentRegistry } from "../agents/registry";
import type { AgentPersona } from "../agents/base";

export interface ProductConfig {
  id: string;
  name: string;
  primaryAgentId: string;
  secondaryAgentIds: string[];
  toolIds: string[];
}

export const PRODUCTS: ProductConfig[] = [
  { id: "cloud-workspace", name: "ALP Cloud Workspace", primaryAgentId: "engineer", secondaryAgentIds: ["devops"], toolIds: ["cloud-aws", "collaboration"] },
  { id: "mobile-app", name: "ALP Mobile App", primaryAgentId: "engineer", secondaryAgentIds: [], toolIds: ["mobile-build", "push-notifications"] },
  { id: "agent-studio", name: "ALP Agent Studio", primaryAgentId: "engineer", secondaryAgentIds: [], toolIds: ["agent-builder", "visual-designer"] },
  { id: "security-scanner", name: "ALP Security Scanner", primaryAgentId: "security", secondaryAgentIds: ["engineer"], toolIds: ["sast-scanner", "dast-scanner", "policy-validator"] },
  { id: "analytics-bi", name: "ALP Analytics & BI", primaryAgentId: "data", secondaryAgentIds: ["engineer"], toolIds: ["bi-export", "visualization"] },
  { id: "devops-bridge", name: "ALP DevOps Bridge", primaryAgentId: "devops", secondaryAgentIds: ["engineer"], toolIds: ["ci-github-actions", "ci-gitlab", "argo-cd"] },
  { id: "model-hub", name: "ALP AI Model Hub", primaryAgentId: "engineer", secondaryAgentIds: [], toolIds: ["model-routing", "cost-optimization"] },
  { id: "data-pipeline", name: "ALP Data Pipeline Studio", primaryAgentId: "data", secondaryAgentIds: ["engineer"], toolIds: ["pipeline-designer", "dbt", "airflow"] },
  { id: "chip-design", name: "ALP Chip Design Studio", primaryAgentId: "eda", secondaryAgentIds: ["engineer"], toolIds: ["verilog-generator", "synthesis", "formal-verification"] },
  { id: "soc-sentinel", name: "ALP SOC Sentinel AI", primaryAgentId: "soc", secondaryAgentIds: ["security", "threat-intel"], toolIds: ["siem", "soar", "dashboarding"] },
  { id: "threat-intel", name: "ALP Threat Intelligence Engine", primaryAgentId: "threat-intel", secondaryAgentIds: ["security"], toolIds: ["vuln-db", "threat-feed", "remediation"] },
  { id: "zero-trust", name: "ALP Zero Trust Orchestrator", primaryAgentId: "zero-trust", secondaryAgentIds: ["security"], toolIds: ["spiffe-spire", "mtls", "opa"] },
  { id: "test-engine", name: "ALP Test Engine", primaryAgentId: "test-engine", secondaryAgentIds: ["engineer"], toolIds: ["testing-unit", "testing-integration", "testing-e2e", "testing-property"] },
  { id: "code-review", name: "ALP Code Review", primaryAgentId: "code-review", secondaryAgentIds: ["security", "engineer"], toolIds: ["lint", "style", "perf", "security-lint"] },
  { id: "release-manager", name: "ALP Release Manager", primaryAgentId: "release-manager", secondaryAgentIds: ["devops", "engineer"], toolIds: ["versioning", "changelog", "rollback"] },
  { id: "perf-profiler", name: "ALP Performance Profiler", primaryAgentId: "engineer", secondaryAgentIds: ["devops"], toolIds: ["profiling", "bottleneck-detection"] },
  { id: "api-designer", name: "ALP API Designer", primaryAgentId: "api-designer", secondaryAgentIds: ["engineer", "architecture-visualizer"], toolIds: ["openapi-gen", "asyncapi-gen", "sdk-stub-gen"] },
  { id: "arch-visualizer", name: "ALP Architecture Visualizer", primaryAgentId: "architecture-visualizer", secondaryAgentIds: ["engineer", "api-designer"], toolIds: ["diagram-gen", "dep-graph", "impact-analysis"] },
  { id: "migration-engine", name: "ALP Migration Engine", primaryAgentId: "engineer", secondaryAgentIds: ["architecture-visualizer", "devops"], toolIds: ["legacy-modernizer", "refactoring"] },
  { id: "docs-engine", name: "ALP Documentation Engine", primaryAgentId: "engineer", secondaryAgentIds: [], toolIds: ["api-refs", "doc-portal", "inline-docs"] },
  { id: "supply-chain-guardian", name: "ALP Supply Chain Guardian", primaryAgentId: "security", secondaryAgentIds: ["engineer"], toolIds: ["sbom-generator", "license-checker"] },
  { id: "alp-platform", name: "ALP Platform", primaryAgentId: "engineer", secondaryAgentIds: ["security", "devops"], toolIds: [] },
  { id: "alp-server", name: "ALP Server", primaryAgentId: "engineer", secondaryAgentIds: ["devops"], toolIds: [] },
  { id: "hydra-main", name: "HYDRA Main AI", primaryAgentId: "engineer", secondaryAgentIds: ["architecture-visualizer"], toolIds: [] },
];

export function getProductConfig(productId: string): ProductConfig | undefined {
  return PRODUCTS.find((p) => p.id === productId);
}

export function getPersonasForProduct(productId: string): AgentPersona[] {
  const config = getProductConfig(productId);
  if (!config) return [];
  const ids = [config.primaryAgentId, ...config.secondaryAgentIds];
  return ids.map((id) => agentRegistry.get(id)).filter(Boolean) as AgentPersona[];
}
