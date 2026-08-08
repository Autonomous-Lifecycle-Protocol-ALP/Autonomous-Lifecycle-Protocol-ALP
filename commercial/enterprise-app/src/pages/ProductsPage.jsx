import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DashboardIcon,
  ServerIcon,
  SecurityIcon,
  ProductsIcon,
  SearchIcon,
  FilterIcon,
  SparklesIcon,
  LayersIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ZapIcon
} from "../components/Icons.jsx";
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

const CATEGORIES = ["All", "SaaS", "Platform", "Security", "DevOps", "Analytics", "Agent Persona", "EDA Platform"];

export { PRODUCTS };

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    trackCatalogView();
  }, []);

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium badge-glow">
          <SparklesIcon size="sm" /> 14 Commercial Enterprise Studios
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          ALP Autonomous Product Ecosystem
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Open-core autonomous engineering platform for software, quantum, hardware, and physical systems.
        </p>

        {/* Search & Category Filter Controls */}
        <div className="pt-4 flex flex-col md:flex-row justify-center items-center gap-4 max-w-3xl mx-auto">
          <div className="relative w-full md:w-96">
            <SearchIcon className="absolute left-3.5 top-3 text-slate-400" size="sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, technologies, or integrations..."
              className="w-full bg-slate-950/90 text-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none custom-scrollbar shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-smooth whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Open Source Foundation Cards */}
      <div className="card-glass rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <DashboardIcon className="text-sky-400" />
          <span>Open-Core Protocol Foundation (Free &amp; Open Source)</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-1 hover:border-sky-500/40 transition">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sky-300">ALP CLI &amp; Core Engine</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">Open Source</span>
            </div>
            <p className="text-slate-400 text-[11px]">Topological DAG sorting, Merkle reasoning verification, multi-language parser</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-1 hover:border-sky-500/40 transition">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sky-300">Polyglot SDKs (TS, Go, Py, Rust, Java)</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">Open Source</span>
            </div>
            <p className="text-slate-400 text-[11px]">100% feature-parity graph execution, event mesh, and policy gate APIs</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-1 hover:border-sky-500/40 transition">
            <div className="flex justify-between items-center">
              <span className="font-bold text-indigo-300">SHAM Desktop IDE</span>
              <span className="text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded font-mono">Pro / Enterprise</span>
            </div>
            <p className="text-slate-400 text-[11px]">Cross-platform desktop packaging (macOS DMG, Linux AppImage, Windows MSI)</p>
          </div>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ProductsIcon className="text-indigo-400" />
            <span>Commercial Enterprise Product Suite ({filteredProducts.length})</span>
          </h2>
          {searchQuery && (
            <span className="text-xs text-slate-400">
              Showing results for &ldquo;<span className="text-sky-300 font-semibold">{searchQuery}</span>&rdquo;
            </span>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="card-glass text-center py-12 rounded-2xl text-slate-400 text-sm">
            No products found matching your search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                onClick={() => trackProductClick(product.id, product.name, "catalog_card")}
                className="card-glass rounded-2xl p-6 space-y-4 hover:border-sky-500/50 group transition-smooth flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-sky-400 group-hover:border-sky-500/40 transition">
                        {product.category === "Security" ? (
                          <SecurityIcon size="md" />
                        ) : product.category === "SaaS" ? (
                          <ServerIcon size="md" />
                        ) : (
                          <LayersIcon size="md" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-sky-300 transition">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-400">{product.tagline}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border ${
                        product.status === "Beta"
                          ? "bg-sky-950/50 text-sky-300 border-sky-800/60"
                          : product.status === "Alpha"
                          ? "bg-purple-950/50 text-purple-300 border-purple-800/60"
                          : "bg-slate-900/60 text-slate-400 border-slate-800"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {product.features.map((f) => (
                      <span key={f} className="text-[11px] bg-slate-950/90 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-lg">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{product.tier}</span>
                  <span className="text-sky-400 font-semibold group-hover:translate-x-1 transition-smooth flex items-center gap-1">
                    View Details &amp; Sandbox <ArrowRightIcon size="sm" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
