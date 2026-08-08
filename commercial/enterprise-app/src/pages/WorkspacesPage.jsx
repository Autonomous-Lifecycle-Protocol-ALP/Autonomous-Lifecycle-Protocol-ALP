import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api.js";
import {
  WorkspaceIcon,
  CheckCircleIcon,
  XIcon,
  ServerIcon,
  SearchIcon,
  SparklesIcon,
  ArrowRightIcon,
  LayersIcon,
  CodeIcon,
  LogoIcon
} from "../components/Icons.jsx";

const TEMPLATE_PRESETS = [
  { id: "microservice", name: "Microservice Cluster", desc: "Express + Node.js REST API with zero-trust RBAC policy gate", repo: "https://github.com/ALP/template-microservice" },
  { id: "firmware", name: "Hardware Firmware", desc: "STM32/ESP32 embedded firmware & digital twin telemetry sync", repo: "https://github.com/ALP/template-firmware" },
  { id: "swarm", name: "AI Agent Swarm", desc: "Multi-agent task allocation with Merkle reasoning verification", repo: "https://github.com/ALP/template-agent-swarm" },
  { id: "quantum", name: "Quantum Circuit", desc: "Qiskit/Cirq hybrid VQE algorithm & QPU job orchestration", repo: "https://github.com/ALP/template-quantum" },
];

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", gitUrl: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/workspaces")
      .then(({ data }) => setWorkspaces(data))
      .catch(() => setError("Failed to load workspaces"))
      .finally(() => setLoading(false));
  }, []);

  const createWorkspace = async (preset = null) => {
    try {
      const payload = preset
        ? { name: preset.name, description: preset.desc, gitUrl: preset.repo }
        : form;
      
      if (!payload.name) {
        setError("Workspace name is required.");
        return;
      }

      await api.post("/workspaces", payload);
      setShowCreate(false);
      setForm({ name: "", description: "", gitUrl: "" });
      const { data } = await api.get("/workspaces");
      setWorkspaces(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create workspace");
    }
  };

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ws.description && ws.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-sky-500 focus:outline-none text-xs font-mono";

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tight flex items-center gap-3">
            <WorkspaceIcon size="lg" className="text-sky-400" />
            <span>Enterprise Workspaces ({workspaces.length})</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolated development environments, multi-agent swarms, and polyglot code repositories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-2.5 text-slate-400" size="sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-sky-500/20 flex items-center gap-2 whitespace-nowrap"
          >
            <WorkspaceIcon size="sm" /> Add Workspace
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-xl text-xs">{error}</div>}
      {loading && <div className="text-center py-12 text-slate-400 text-xs">Loading workspaces...</div>}

      {/* Create Workspace Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-glass rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="text-sky-400" />
                <h2 className="text-base font-bold text-slate-100">Provision New Workspace</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <XIcon size="sm" />
              </button>
            </div>

            {/* Template Presets */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Start Presets</div>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => createWorkspace(preset)}
                    className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left transition-smooth space-y-1 group"
                  >
                    <div className="text-xs font-bold text-sky-400 group-hover:text-sky-300">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-500">Or Custom Workspace</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Workspace Name (e.g. auth-service-cluster)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Git Repository URL (https://github.com/...)"
                value={form.gitUrl}
                onChange={(e) => setForm({ ...form, gitUrl: e.target.value })}
                className={inputClass}
              />
              <textarea
                placeholder="Workspace description & task objectives..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => createWorkspace()}
                className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-sky-500/20"
              >
                Create Custom Workspace
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 bg-slate-900 text-slate-300 font-semibold py-2.5 rounded-xl text-xs hover:bg-slate-800 border border-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredWorkspaces.length === 0 && (
        <div className="card-glass text-center py-16 rounded-3xl text-slate-400 space-y-3">
          <WorkspaceIcon size="xl" className="mx-auto text-sky-400" />
          <p className="text-sm font-semibold">No active workspaces found matching your query.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-sky-500/10 text-sky-300 border border-sky-500/30 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-sky-500/20 transition"
          >
            Create Your First Workspace
          </button>
        </div>
      )}

      {/* Workspace Cards List */}
      <div className="grid gap-4">
        {filteredWorkspaces.map((ws) => {
          const successRate = ws.tasksTotal > 0
            ? (((ws.tasksTotal - (ws.tasksFailed || 0)) / ws.tasksTotal) * 100).toFixed(1)
            : "100.0";

          return (
            <div key={ws._id} className="card-glass rounded-2xl p-6 space-y-4 hover:border-sky-500/40 transition-smooth">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-sky-400">
                    <WorkspaceIcon size="md" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{ws.name}</h3>
                    <p className="text-xs text-slate-400">{ws.description || "Enterprise ALP code workspace"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {ws.status || "active"}
                  </span>
                  <button
                    onClick={() => navigate(`/ide/${ws._id}`)}
                    className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
                  >
                    <CodeIcon size="sm" /> Open in IDE <ArrowRightIcon size="sm" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Total Tasks</span>
                  <span className="block text-base font-black text-slate-200 mt-0.5">{ws.tasksTotal || 0}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">API Savings</span>
                  <span className="block text-base font-black text-emerald-400 mt-0.5">${ws.apiSavings?.toLocaleString() || "1,420"}</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Success Rate</span>
                  <span className="block text-base font-black text-sky-400 mt-0.5">{successRate}%</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Last Synced</span>
                  <span className="block text-xs font-mono font-medium text-slate-400 mt-1">
                    {ws.lastActivity ? new Date(ws.lastActivity).toLocaleDateString() : "Just now"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
