import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api.js";
import { WorkspaceIcon, CheckIcon, XIcon, ServerIcon } from "../components/Icons.jsx";

const STAT_CARDS = [
  { label: "Tasks", key: "tasksTotal", suffix: "", color: "text-gray-900", icon: ServerIcon },
  { label: "API Savings", key: "apiSavings", prefix: "$", color: "text-green-600", icon: CheckIcon },
  { label: "Success Rate", key: "successRate", suffix: "%", color: "text-blue-600", icon: CheckIcon },
  { label: "Last Activity", key: "lastActivity", type: "date", color: "text-gray-600", icon: WorkspaceIcon },
];

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", gitUrl: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/workspaces").then(({ data }) => setWorkspaces(data)).catch(() => setError("Failed to load workspaces")).finally(() => setLoading(false));
  }, []);

  const createWorkspace = async () => {
    try {
      await api.post("/workspaces", form);
      setShowCreate(false);
      setForm({ name: "", description: "", gitUrl: "" });
      const { data } = await api.get("/workspaces");
      setWorkspaces(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create workspace");
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800/40 text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-100">Workspaces</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <WorkspaceIcon size="sm" />
          Add Workspace
        </button>
      </div>

      {error && <div className="bg-red-900/40 text-red-300 p-3 rounded-lg text-sm">{error}</div>}

      {loading && <div className="text-center py-8 text-gray-400">Loading workspaces...</div>}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="glass-dark rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Create Workspace</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 text-gray-400 hover:text-gray-300 rounded"
              >
                <XIcon size="sm" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Workspace Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className={inputClass} />
              <input type="text" placeholder="Git Repository URL" value={form.gitUrl} onChange={(e) => setForm({...form, gitUrl: e.target.value})} className={inputClass} />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className={inputClass} rows={3} />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={createWorkspace} className="flex-1 bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700 transition-colors">Create</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-gray-700/40 text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!loading && workspaces.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <WorkspaceIcon size="xl" className="mx-auto mb-3 text-gray-500" />
          <p>No workspaces yet. Create one to get started.</p>
        </div>
      )}

      <div className="grid gap-4">
        {workspaces.map((ws) => {
          const successRate = ws.tasksTotal > 0
            ? ((ws.tasksTotal - ws.tasksFailed) / ws.tasksTotal * 100).toFixed(1)
            : "0.0";

          return (
            <div key={ws._id} className="glass-dark rounded-xl shadow-lg border border-gray-700/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-100">{ws.name}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  ws.status === "active" ? "bg-green-900/30 text-green-300" : "bg-gray-700/40 text-gray-400"
                }`}>
                  {ws.status || "active"}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{ws.description || "No description provided."}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Tasks</span>
                  <span className="block font-bold text-gray-200">{ws.tasksTotal}</span>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <span className="text-xs text-gray-500">API Savings</span>
                  <span className="block font-bold text-green-400">${ws.apiSavings?.toLocaleString() || 0}</span>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Success Rate</span>
                  <span className="block font-bold text-blue-400">{successRate}%</span>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Last Activity</span>
                  <span className="block font-bold text-sm text-gray-400">
                    {new Date(ws.lastActivity).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/ide/${ws._id}`)}
                className="w-full sm:w-auto px-4 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 transition-colors"
              >
                Open in IDE
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
