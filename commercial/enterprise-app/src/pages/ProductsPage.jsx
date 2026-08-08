import { Link } from "react-router-dom";
import { useEffect } from "react";
import { DashboardIcon, ServerIcon, SecurityIcon, ProductsIcon } from "../components/Icons.jsx";
import { trackCatalogView, trackProductClick } from "../utils/analytics.js";

const PRODUCTS = [
  {
    id: "cloud-workspace",
    name: "ALP Cloud Workspace",
    tagline: "Hosted, managed ALP development environments",
    category: "SaaS",
    tier: "Pro $49/dev/mo • Enterprise $999/org/mo",
    status: "Beta",
    description: "Pre-configured ALP environments with real-time collaboration, built-in CI/CD, and integrated deployment to cloud providers. Team workspaces with RBAC and snapshot/rollback.",
    features: ["Pre-configured environments", "Real-time collaboration", "Built-in CI/CD", "Multi-cloud deployment", "RBAC & snapshots"],
    integration: "Extends @workflow, @timeline, @contract for managed execution",
  },
  {
    id: "mobile-app",
    name: "ALP Mobile App",
    tagline: "On-the-go oversight for ALP swarms",
    category: "Mobile",
    tier: "Free • Pro $4.99/mo",
    status: "Planned",
    description: "iOS and Android companion app for reviewing agent decisions, approving HITL checkpoints, and monitoring swarm activity with push notifications.",
    features: ["HITL checkpoint approval", "Push notifications", "Swarm activity feed", "Agent performance dashboard", "Offline mode"],
    integration: "WebSocket API to ALP Event Mesh",
  },
  {
    id: "agent-studio",
    name: "ALP Agent Studio",
    tagline: "Low-code platform for building ALP agents",
    category: "Platform",
    tier: "Pro $99/mo • Enterprise Custom",
    status: "Alpha",
    description: "Visual drag-and-drop DAG designer, agent capability marketplace, model routing configuration, and A/B testing for custom ALP agents.",
    features: ["Visual DAG designer", "Capability marketplace", "Model routing config", "Testing sandbox", "A/B testing"],
    integration: "Integrates with @agent, @swarm_marketplace, @policy, @contract",
  },
  {
    id: "security-scanner",
    name: "ALP Security Scanner",
    tagline: "Automated security & compliance scanning",
    category: "Security",
    tier: "Pro $149/mo • Enterprise $2,499/mo",
    status: "Planned",
    description: "SAST/DAST scanning, dependency vulnerability checks, and policy-as-code integration that runs as a verification gate in ALP task pipelines.",
    features: ["SAST/DAST scanning", "Vulnerability detection", "SOC2/ISO27001/GDPR compliance", "Policy-as-code", "Remediation suggestions"],
    integration: "Adds verification steps to @task verify blocks, integrates with @contract",
  },
  {
    id: "analytics-bi",
    name: "ALP Analytics & BI",
    tagline: "Productivity metrics and cost optimization",
    category: "Analytics",
    tier: "Pro $79/mo • Enterprise $499/mo",
    status: "Planned",
    description: "Business intelligence dashboards for team productivity, cost tracking, agent performance analytics, and predictive resource planning.",
    features: ["Productivity metrics", "Cost tracking & optimization", "Agent performance", "Predictive planning", "BI tool export"],
    integration: "Reads from ALP Event Mesh, @analytics, @swarm_marketplace cost metering",
  },
  {
    id: "devops-bridge",
    name: "ALP DevOps Bridge",
    tagline: "CI/CD pipeline orchestration",
    category: "DevOps",
    tier: "Pro $199/mo • Enterprise Custom",
    status: "Planned",
    description: "Pre-built integrations with GitHub Actions, GitLab CI, CircleCI, Jenkins, and ArgoCD. Deployment orchestration with automated rollback on failed quality gates.",
    features: ["GitHub Actions, GitLab CI, CircleCI, Jenkins", "Multi-cloud deployment", "Environment management", "Auto rollback", "Deployment audit trail"],
    integration: "Reads @workflow, @timeline, uses @contract for boundary enforcement",
  },
  {
    id: "model-hub",
    name: "ALP AI Model Hub",
    tagline: "Curated marketplace of ALP-optimized AI models",
    category: "Marketplace",
    tier: "Free • Pro 15% fee",
    status: "Planned",
    description: "Pre-trained models optimized for ALP tasks (code review, test generation, documentation), with automatic routing for cost optimization.",
    features: ["Task-optimized models", "A/B testing", "Cost optimization routing", "Custom model registration", "Performance tracking"],
    integration: "Integrates with @agent model config, @swarm_marketplace metering, @policy governance",
  },
  {
    id: "data-pipeline-studio",
    name: "ALP Data Pipeline Studio",
    tagline: "Build and monitor data pipelines with ALP DAG orchestration",
    category: "Data Engineering",
    tier: "Enterprise Add-on +$2,000/mo",
    status: "Planned",
    description: "Visual data pipeline designer with schema validation, data quality gates, ML experiment tracking, and dbt/Airflow integration.",
    features: ["Visual pipeline designer", "Schema validation & evolution", "Data quality gates", "ML experiment tracking", "dbt/Airflow integration", "Data lineage visualization"],
    integration: "Creates @task/@workflow for pipeline orchestration; @contract for schema boundaries; @analytics for pipeline metrics",
  },
  {
    id: "hybrid-engineer",
    name: "ALP Hybrid Engineer AI",
    tagline: "Physical + software engineering agent",
    category: "Agent Persona",
    tier: "Pro $199/mo • Enterprise Custom",
    status: "Planned",
    description: "AI agent for firmware, CAD, FEA simulation, PCB layout, CNC tooling, manufacturing — fully ALP-native with digital twin sync.",
    features: ["Firmware generation (STM32, ESP32, Arduino)", "CAD design & BOM extraction", "FEA/CFD simulation", "CNC toolpaths & DFM checks", "IoT telemetry & anomaly detection", "Digital twin sync"],
    integration: "Creates @task/@workflow for hardware validation; @policy for safety-critical rules; @timeline for maintenance scheduling",
  },
  {
    id: "quantum-engineer",
    name: "ALP Quantum Engineering AI",
    tagline: "Quantum circuit design & QPU orchestration",
    category: "Agent Persona",
    tier: "Pro $299/mo • Enterprise Custom",
    status: "Planned",
    description: "AI agent for quantum circuit design, hybrid classical-quantum programming, and QPU workflow orchestration with error mitigation.",
    features: ["Quantum circuit design (Qiskit/Cirq/tket)", "QPU job orchestration (IBM, Rigetti, IonQ)", "Hybrid VQE/QAOA algorithms", "Quantum simulation & error mitigation", "Hardware-aware compilation", "ALP-native task coordination"],
    integration: "Creates @task for quantum jobs; @policy for QPU access control; @timeline for calibration scheduling; @vault for API key security",
  },
  {
    id: "chip-design-studio",
    name: "ALP Chip Design Studio",
    tagline: "ASIC/FPGA design from RTL to tape-out",
    category: "EDA Platform",
    tier: "Pro $499/mo • Enterprise Custom",
    status: "Planned",
    description: "Full-stack chip design environment — RTL generation, synthesis, place & route, timing closure, and formal verification.",
    features: ["RTL design (SystemVerilog/VHDL)", "Synthesis (Yosys, Genus)", "Place & route (OpenROAD, Innovus)", "Timing analysis (STA, PrimeTime)", "FPGA flow (Vivado, nextpnr)", "Formal verification"],
    integration: "Creates @task for RTL blocks; @workflow for synthesis→P&R→STA pipeline; @policy for DRC rules; @contract for interface compliance",
  },
  {
    id: "soc-sentinel",
    name: "ALP SOC Sentinel AI",
    tagline: "AI-powered security operations center",
    category: "AI Security Ops",
    tier: "Pro $299/mo • Enterprise Custom",
    status: "Planned",
    description: "Real-time threat detection, automated incident response, and attack surface monitoring for ALP-managed agent swarms and infrastructure.",
    features: ["Threat detection via event correlation", "Automated incident response", "Adversarial ML defense", "Attack surface monitoring", "SOC dashboard & forensics", "MITRE ATT&CK mapping"],
    integration: "Consumes @analytics for anomalies; @policy for response rules; @timeline for forensics; @vault for credential revocation",
  },
  {
    id: "threat-intel",
    name: "ALP Threat Intelligence Engine",
    tagline: "Proactive threat hunting & vulnerability prediction",
    category: "AI Agent",
    tier: "Pro $199/mo • Enterprise Custom",
    status: "Planned",
    description: "Proactive vulnerability discovery, adversarial behavior modeling, exploit prediction, and automated remediation task generation.",
    features: ["Vulnerability scanning (Trivy/Snyk/Grype)", "Threat hunting with IoCs", "Adversarial ML prediction", "External threat feed correlation", "Automated patching recommendations", "CVSS risk scoring"],
    integration: "Creates @task for remediation; feeds @policy for adaptive rules; uses @timeline for scheduled scans; consumes @contract for attack surface mapping",
  },
  {
    id: "zero-trust",
    name: "ALP Zero Trust Orchestrator",
    tagline: "Zero-trust network security for agent swarms",
    category: "Network Security",
    tier: "Pro $399/mo • Enterprise Custom",
    status: "Planned",
    description: "SPIFFE/SPIRE identity for every agent and task, mutual TLS everywhere, micro-segmentation via @contract, and continuous re-authentication.",
    features: ["SPIFFE/SPIRE agent identities", "Mutual TLS between all components", "Micro-segmentation via @contract", "Continuous authentication (15-min re-auth)", "OPA policy engine integration", "Audit trail with W3C Verifiable Credentials"],
    integration: "Enforces @contract as network policy; integrates @policy for authorization; @vault for certificate management; @timeline for audit logs; @analytics for trust metrics",
  },
];

export { PRODUCTS };
export default function ProductsPage() {
  useEffect(() => {
    trackCatalogView();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">ALP Product Suite</h1>
        <p className="text-gray-400 mt-2">The complete ecosystem for autonomous software, quantum, and physical engineering</p>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Existing Products</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="border border-gray-700 rounded-lg p-3 flex items-start gap-3 glass-dark">
            <DashboardIcon size="md" className="text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-sky-300">ALP CLI &amp; Parser</span>
              <span className="float-right text-gray-500">Open Source</span>
              <p className="text-xs text-gray-500 mt-1">Core protocol engine — parsing, DAG topological sort, CLI interface</p>
            </div>
          </div>
          <div className="border border-gray-700 rounded-lg p-3 flex items-start gap-3 glass-dark">
            <ServerIcon size="md" className="text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-sky-300">ALP SDKs (TS, Python, Go, Rust, Java)</span>
              <span className="float-right text-gray-500">Open Source</span>
              <p className="text-xs text-gray-500 mt-1">Multi-language SDK parity with full graph, workspace, and event mesh APIs</p>
            </div>
          </div>
          <div className="border border-gray-700 rounded-lg p-3 flex items-start gap-3 glass-dark">
            <ServerIcon size="md" className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-sky-300">SHAM IDE</span>
              <span className="float-right text-purple-400">Pro/Enterprise</span>
              <p className="text-xs text-gray-500 mt-1">Cross-platform desktop IDE — Monaco editor, agent manager, MCP browser</p>
            </div>
          </div>
          <div className="border border-gray-700 rounded-lg p-3 flex items-start gap-3 glass-dark">
            <ProductsIcon size="md" className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-sky-300">Swarm Marketplace</span>
              <span className="float-right text-purple-400">Pro/Enterprise</span>
              <p className="text-xs text-gray-500 mt-1">Autonomous agent skill registration, discovery, invocation, and metering</p>
            </div>
          </div>
          <div className="border border-gray-700 rounded-lg p-3 flex items-start gap-3 glass-dark">
            <ServerIcon size="md" className="text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-sky-300">ALP MCP Server</span>
              <span className="float-right text-gray-500">Open Source</span>
              <p className="text-xs text-gray-500 mt-1">52 MCP tools for Claude Desktop, Cursor, Windsurf integration</p>
            </div>
          </div>
          <div className="border border-gray-700 rounded-lg p-3 flex items-start gap-3 glass-dark">
            <DashboardIcon size="md" className="text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-sky-300">alp-vscode Extension</span>
              <span className="float-right text-gray-500">Open Source</span>
              <p className="text-xs text-gray-500 mt-1">Language server with IntelliSense, DAG visualizer, diagnostics</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Planned Products</h2>
        <p className="text-sm text-gray-400 mb-4">Products under development — building on the ALP open-core foundation</p>

        <div className="space-y-4">
          {PRODUCTS.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="block border border-gray-700 rounded-lg p-5 glass-dark hover:border-gray-500 transition-colors" onClick={() => trackProductClick(product.id, product.name, 'catalog_card')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/40 rounded-lg flex-shrink-0 mt-0.5">
                    {product.category === "Agent Persona" || product.category === "AI Agent" ? (
                      <SecurityIcon size="md" className="text-sky-400" />
                    ) : product.category === "Marketplace" ? (
                      <ProductsIcon size="md" className="text-purple-400" />
                    ) : (
                      <DashboardIcon size="md" className="text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-100">{product.name}</h3>
                    <p className="text-sm text-gray-400">{product.tagline}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  product.status === "Beta" ? "bg-blue-900/30 text-blue-300" :
                  product.status === "Alpha" ? "bg-purple-900/30 text-purple-300" :
                  "bg-gray-700/40 text-gray-400"
                }`}>
                  {product.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium block text-gray-300">{product.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Pricing</span>
                  <span className="font-medium block text-gray-300">{product.tier}</span>
                </div>
                <div>
                  <span className="text-gray-500">ALP Integration</span>
                  <span className="font-medium block text-xs text-gray-400">{product.integration}</span>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-3">{product.description}</p>

              <div className="flex flex-wrap gap-2">
                {product.features.map((f) => (
                  <span key={f} className="px-2 py-1 text-xs bg-gray-800/40 text-gray-300 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Revenue Impact Projection</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left pb-2 text-gray-300">Product</th>
                <th className="text-left pb-2 text-gray-300">Price</th>
                <th className="text-left pb-2 text-gray-300">Est. Customers (Year 1)</th>
                <th className="text-right pb-2 text-gray-300">Year 1 Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Cloud Workspace</td><td>$49–$999/mo</td><td>200 teams</td><td className="text-right">$2.4M</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Mobile App</td><td>$4.99/mo</td><td>5,000 users</td><td className="text-right">$300K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Agent Studio</td><td>$99/mo</td><td>150 teams</td><td className="text-right">$180K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Security Scanner</td><td>$149–$2,499/mo</td><td>80 teams</td><td className="text-right">$800K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Analytics &amp; BI</td><td>$79–$499/mo</td><td>300 teams</td><td className="text-right">$600K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP DevOps Bridge</td><td>$199/mo</td><td>100 teams</td><td className="text-right">$240K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP AI Model Hub</td><td>15% fee</td><td>2% of $5M usage</td><td className="text-right">$75K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Data Pipeline Studio</td><td>+$2,000/mo</td><td>10 teams</td><td className="text-right">$240K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Hybrid Engineer AI</td><td>$199/mo</td><td>200 teams</td><td className="text-right">$480K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Quantum Engineering AI</td><td>$299/mo</td><td>50 teams</td><td className="text-right">$180K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Chip Design Studio</td><td>$499/mo</td><td>30 teams</td><td className="text-right">$180K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP SOC Sentinel AI</td><td>$299/mo</td><td>150 teams</td><td className="text-right">$540K</td></tr>
              <tr className="border-b border-gray-700"><td className="py-2 text-gray-300">ALP Threat Intel Engine</td><td>$199/mo</td><td>250 teams</td><td className="text-right">$500K</td></tr>
              <tr><td className="py-2 text-gray-300">ALP Zero Trust Orchestrator</td><td>$399/mo</td><td>100 teams</td><td className="text-right">$480K</td></tr>
            </tbody>
          </table>
          <div className="border-t border-gray-700 pt-3 mt-3 text-right">
            <span className="font-bold text-lg text-sky-300">Total Year 1: $7.0M ARR</span>
          </div>
        </div>
      </div>
    </div>
  );
}

