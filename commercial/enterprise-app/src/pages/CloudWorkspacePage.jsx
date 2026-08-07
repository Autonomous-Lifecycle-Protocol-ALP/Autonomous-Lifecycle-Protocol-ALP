import { useState } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { cloudApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "cloud-workspace");

const ENVIRONMENT_PRESETS = [
  { name: "Node.js + React", stack: "Node 24, React 19, TypeScript", runtime: "~8s cold start" },
  { name: "Python + FastAPI", stack: "Python 3.12, FastAPI, Pydantic", runtime: "~5s cold start" },
  { name: "Go Microservices", stack: "Go 1.24, gRPC, PostgreSQL", runtime: "~2s cold start" },
  { name: "Rust Systems", stack: "Rust 1.75, Tokio, SQLx", runtime: "~1s cold start" },
];

const COLLABORATION_FEATURES = [
  { title: "Real-time Editing", desc: "Multiple engineers work in the same workspace simultaneously with conflict-free merging" },
  { title: "Context Sharing", desc: "ALP memory and project context automatically synchronized across team members" },
  { title: "Review Workflows", desc: "Built-in HITL checkpoints for code review before task completion" },
  { title: "Snapshot & Rollback", desc: "Point-in-time snapshots of entire workspace state with one-click rollback" },
];

export default function CloudWorkspacePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspaces = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await cloudApi.list();
      setWorkspaces(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async () => {
    setError("");
    try {
      const name = prompt("Workspace name:");
      if (!name) return;
      await cloudApi.create({ name, runtime: "node", region: "us-east-1" });
      await loadWorkspaces();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create workspace");
    }
  };

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Your Workspaces</h2>
          <button onClick={createWorkspace} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Create Workspace</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadWorkspaces} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {workspaces.length === 0 && <p className="text-gray-500 text-sm">No workspaces yet.</p>}
          {workspaces.map((ws) => (
            <div key={ws._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{ws.name}</div>
                <div className="text-xs text-gray-500">{ws.runtime} • {ws.region} • {ws.status}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(ws.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Workspace Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Environment Presets</h3>
            <div className="space-y-3">
              {ENVIRONMENT_PRESETS.map((env) => (
                <div key={env.name} className="border border-gray-700 rounded-lg p-4">
                  <div className="font-medium text-gray-200">{env.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{env.stack}</div>
                  <div className="text-xs text-sky-400 mt-1">{env.runtime}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Collaboration</h3>
            <div className="space-y-3">
              {COLLABORATION_FEATURES.map((feat) => (
                <div key={feat.title} className="border border-gray-700 rounded-lg p-4">
                  <div className="font-medium text-gray-200">{feat.title}</div>
                  <p className="text-xs text-gray-400 mt-1">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Deployment Targets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["AWS", "Azure", "GCP", "DigitalOcean", "Docker", "Kubernetes", "Terraform", "Pulumi"].map((target) => (
            <div key={target} className="border border-gray-700 rounded-lg p-3 text-center">
              <span className="text-sm font-medium text-gray-300">{target}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium text-gray-200">Instant Provisioning</h3>
            <p className="text-sm text-gray-400 mt-1">Pre-warmed containers spin up in under 3 seconds with your exact stack.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-medium text-gray-200">Network Isolation</h3>
            <p className="text-sm text-gray-400 mt-1">Each workspace is network-isolated with encrypted volume mounts and WireGuard tunneling.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📸</div>
            <h3 className="font-medium text-gray-200">Snapshot & Rollback</h3>
            <p className="text-sm text-gray-400 mt-1">Point-in-time snapshots of entire workspace state with one-click rollback.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Use Cases</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Team Onboarding</h3>
            <p className="text-sm text-gray-400 mt-1">New engineers get a pre-configured environment with all dependencies and project context in minutes.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Sprint Prototyping</h3>
            <p className="text-sm text-gray-400 mt-1">Spin up disposable workspaces for spike solutions without polluting local environments.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Cross-Team Collaboration</h3>
            <p className="text-sm text-gray-400 mt-1">Multiple engineers work in the same workspace with real-time conflict-free merging.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Compliance Sandboxes</h3>
            <p className="text-sm text-gray-400 mt-1">Isolated environments for security testing and compliance validation.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">200+</div>
            <div className="text-xs text-gray-400 mt-1">Teams in Beta</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">80%</div>
            <div className="text-xs text-gray-400 mt-1">Weekly Active Ratio</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;200ms</div>
            <div className="text-xs text-gray-400 mt-1">Editor Round-trip p95</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">99.9%</div>
            <div className="text-xs text-gray-400 mt-1">Uptime SLA</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
