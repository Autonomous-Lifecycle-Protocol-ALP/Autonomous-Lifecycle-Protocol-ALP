import { useState } from "react";
import {
  SparklesIcon,
  SearchIcon,
  StarIcon,
  DownloadIcon,
  CheckCircleIcon,
  PlusIcon,
  CodeIcon,
  ShieldIcon,
  LayersIcon,
  ZapIcon,
  CopyIcon,
  ExternalLinkIcon
} from "../components/Icons.jsx";

const MARKETPLACE_ITEMS = [
  {
    id: "skill-auth-gate",
    name: "OAuth2 & RBAC Governance Gate",
    category: "Security",
    rating: 4.9,
    reviews: 128,
    invocations: 142000,
    author: "ALP Core Security",
    version: "v85.0",
    description: "Zero-trust policy gate enforcing OAuth2 JWT verification, scope matching, and Merkle claim trees.",
    installCmd: "npx @alp/cli install skill-auth-gate",
    mcpTools: ["alp_auth_verify", "alp_policy_check"],
    tags: ["OAuth2", "RBAC", "Zero-Trust", "JWT"],
  },
  {
    id: "skill-merkle-verify",
    name: "SHA-256 Merkle Trace Validator",
    category: "Governance",
    rating: 5.0,
    reviews: 240,
    invocations: 289000,
    author: "Reasoning Core Team",
    version: "v85.0",
    description: "Verifies execution step integrity against root SHA-256 Merkle proofs for deterministic AI trace auditing.",
    installCmd: "npx @alp/cli install skill-merkle-verify",
    mcpTools: ["alp_reason_verify", "alp_merkle_root"],
    tags: ["Merkle", "SHA-256", "Audit", "Verification"],
  },
  {
    id: "skill-firmware-gen",
    name: "STM32 & ESP32 Firmware Generator",
    category: "Hardware",
    rating: 4.8,
    reviews: 95,
    invocations: 84000,
    author: "Hybrid Engineer AI",
    version: "v85.0",
    description: "Generates production C/C++ firmware with HAL bindings, RTOS tasks, and digital twin state synchronization.",
    installCmd: "npx @alp/cli install skill-firmware-gen",
    mcpTools: ["alp_firmware_compile", "alp_twin_sync"],
    tags: ["Firmware", "STM32", "ESP32", "FreeRTOS"],
  },
  {
    id: "skill-quantum-vqe",
    name: "Hybrid VQE Quantum Compiler",
    category: "Quantum",
    rating: 4.9,
    reviews: 64,
    invocations: 32000,
    author: "Quantum AI Team",
    version: "v85.0",
    description: "Optimizes Variational Quantum Eigensolver circuits for IBM, Rigetti, and IonQ QPU targets with error mitigation.",
    installCmd: "npx @alp/cli install skill-quantum-vqe",
    mcpTools: ["alp_quantum_compile", "alp_qpu_submit"],
    tags: ["Quantum", "VQE", "Qiskit", "Cirq"],
  },
  {
    id: "skill-dbt-pipeline",
    name: "dbt & Airflow DAG Orchestrator",
    category: "Data Engineering",
    rating: 4.7,
    reviews: 82,
    invocations: 56000,
    author: "Data Engineering AI",
    version: "v85.0",
    description: "Builds and validates data transformation pipelines with schema lineage tracking and automated data quality checks.",
    installCmd: "npx @alp/cli install skill-dbt-pipeline",
    mcpTools: ["alp_dbt_run", "alp_airflow_dag"],
    tags: ["dbt", "Airflow", "ETL", "Data Lineage"],
  },
  {
    id: "skill-soc-agent",
    name: "SOC Threat Intelligence Correlation",
    category: "Security",
    rating: 4.9,
    reviews: 110,
    invocations: 98000,
    author: "SOC Sentinel AI",
    version: "v85.0",
    description: "Correlates swarm event logs against MITRE ATT&CK frameworks to detect and contain malicious payload attacks.",
    installCmd: "npx @alp/cli install skill-soc-agent",
    mcpTools: ["alp_threat_correlate", "alp_incident_contain"],
    tags: ["SOC", "MITRE ATT&CK", "Threat Intel", "SIEM"],
  },
];

const CATEGORIES = ["All", "Security", "Governance", "Hardware", "Quantum", "Data Engineering"];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Publish Form State
  const [pubName, setPubName] = useState("");
  const [pubCategory, setPubCategory] = useState("Security");
  const [pubDesc, setPubDesc] = useState("");

  const filteredItems = MARKETPLACE_ITEMS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleCopyCmd = (cmd, id) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium badge-glow">
          <SparklesIcon size="sm" /> Swarm Capabilities &amp; Skills Hub
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          ALP Autonomous Swarm Marketplace
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Discover, install, and share pre-built agent skills, MCP tools, and governance policies across the swarm ecosystem.
        </p>

        {/* Controls */}
        <div className="pt-4 flex flex-col md:flex-row justify-center items-center gap-4 max-w-3xl mx-auto">
          <div className="relative w-full md:w-96">
            <SearchIcon className="absolute left-3.5 top-3 text-slate-400" size="sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills, MCP tools, or frameworks..."
              className="w-full bg-slate-950/90 text-slate-200 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none custom-scrollbar"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-smooth whitespace-nowrap ${
                  category === cat
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPublishModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap"
          >
            <PlusIcon size="sm" /> Publish Skill
          </button>
        </div>
      </div>

      {/* Grid of Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="card-glass rounded-2xl p-6 space-y-4 hover:border-sky-500/50 transition-smooth flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/50 border border-sky-800/50 px-2.5 py-1 rounded-full">
                  {item.category}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <StarIcon size="sm" /> {item.rating} <span className="text-slate-500 font-normal text-[10px]">({item.reviews})</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-100">{item.name}</h3>
                <div className="text-[11px] text-slate-400 font-mono">By {item.author} • {item.version}</div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className="text-[10px] bg-slate-950/90 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono">
                <code className="text-sky-300 truncate mr-2">{item.installCmd}</code>
                <button
                  onClick={() => handleCopyCmd(item.installCmd, item.id)}
                  className="text-slate-400 hover:text-sky-300 transition"
                >
                  {copiedId === item.id ? "✓" : "Copy"}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-mono text-[11px]">
                  🔥 {item.invocations.toLocaleString()} runs
                </span>
                <button
                  onClick={() => setSelectedSkill(item)}
                  className="text-sky-400 hover:underline font-semibold text-xs flex items-center gap-1"
                >
                  Inspect Manifest <ExternalLinkIcon size="sm" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Skill Manifest Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-glass border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-sky-400 bg-sky-950/50 border border-sky-800/50 px-2.5 py-1 rounded-full">
                  {selectedSkill.category}
                </span>
                <h3 className="text-lg font-bold text-slate-100 pt-2">{selectedSkill.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Author: {selectedSkill.author} • Version: {selectedSkill.version}</p>
              </div>
              <button onClick={() => setSelectedSkill(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">{selectedSkill.description}</p>

            <div className="space-y-2">
              <div className="text-xs font-bold font-mono text-slate-200">Exposed MCP Tools ({selectedSkill.mcpTools.length})</div>
              <div className="space-y-1">
                {selectedSkill.mcpTools.map((t) => (
                  <div key={t} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-2">
                    <CodeIcon size="sm" /> {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSkill(null)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Skill Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowPublishModal(false);
            }}
            className="card-glass border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95"
          >
            <h3 className="text-base font-bold text-slate-100">Publish New Swarm Skill</h3>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Skill Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Kubernetes Manifest Validator"
                value={pubName}
                onChange={(e) => setPubName(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Category</label>
              <select
                value={pubCategory}
                onChange={(e) => setPubCategory(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="Security">Security</option>
                <option value="Governance">Governance</option>
                <option value="Hardware">Hardware</option>
                <option value="Quantum">Quantum</option>
                <option value="Data Engineering">Data Engineering</option>
              </select>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Description &amp; Overview</label>
              <textarea
                rows={3}
                required
                placeholder="Describe what your agent skill accomplishes..."
                value={pubDesc}
                onChange={(e) => setPubDesc(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-400 text-xs rounded-xl hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-xl"
              >
                Publish Skill
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
