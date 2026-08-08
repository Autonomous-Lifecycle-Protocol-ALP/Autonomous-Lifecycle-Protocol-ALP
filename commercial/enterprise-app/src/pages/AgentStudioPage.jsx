import { AnalyticsIcon, SparklesIcon } from "../components/Icons.jsx";
import { useState } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { agentStudioApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "agent-studio");

const STUDIO_CAPABILITIES = [
  { title: "Visual DAG Designer", desc: "Drag-and-drop interface for designing agent workflows with live validation" },
  { title: "Capability Marketplace", desc: "Browse and install community-contributed agent skills and tools" },
  { title: "Model Routing Config", desc: "Route tasks to optimal LLM providers based on cost, latency, and capability" },
  { title: "Testing Sandbox", desc: "Isolated sandbox environment for testing agents before production deployment" },
  { title: "A/B Testing", desc: "Compare agent versions side-by-side with statistical significance testing" },
];

const MODEL_ROUTING = [
  { provider: "OpenAI", models: "GPT-4o, o1, o3" },
  { provider: "Anthropic", models: "Claude 3.5 Sonnet, Opus" },
  { provider: "Google", models: "Gemini 1.5 Pro, Flash" },
  { provider: "Local", models: "Llama 3, Mistral, custom" },
];

export default function AgentStudioPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadWorkflows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await agentStudioApi.list();
      setWorkflows(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    setError("");
    try {
      const name = prompt("Workflow name:");
      if (!name) return;
      await agentStudioApi.create({ name, description: "" });
      await loadWorkflows();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create workflow");
    }
  };

  const simulateWorkflow = async (id) => {
    setError("");
    try {
      const res = await agentStudioApi.simulate(id);
      alert(`Simulation complete: ${res.data.totalLatencyMs}ms, $${res.data.totalCost}`);
    } catch (err) {
      setError(err.response?.data?.error || "Simulation failed");
    }
  };

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Your Workflows</h2>
          <button onClick={createWorkflow} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Create Workflow</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadWorkflows} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {workflows.length === 0 && <p className="text-gray-500 text-sm">No workflows yet.</p>}
          {workflows.map((wf) => (
            <div key={wf._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{wf.name}</div>
                <div className="text-xs text-gray-500">{wf.status} • {wf.graph?.nodes?.length || 0} nodes</div>
              </div>
              <button onClick={() => simulateWorkflow(wf._id)} className="text-xs bg-sky-600 text-white px-3 py-1 rounded hover:bg-sky-700">Simulate</button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Studio Capabilities</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {STUDIO_CAPABILITIES.map((cap) => (
            <div key={cap.title} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-200">{cap.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{cap.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Model Routing</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODEL_ROUTING.map((route) => (
            <div key={route.provider} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-sky-300">{route.provider}</div>
              <div className="text-xs text-gray-400 mt-1">{route.models}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-purple-400"><SparklesIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">Visual Design</h3>
            <p className="text-sm text-gray-400 mt-1">Drag-and-drop DAG builder with live validation and real-time preview.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🧪</div>
            <h3 className="font-medium text-gray-200">Simulation Sandbox</h3>
            <p className="text-sm text-gray-400 mt-1">Test agents in isolation before production with full state replay.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-blue-400"><AnalyticsIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">A/B Testing</h3>
            <p className="text-sm text-gray-400 mt-1">Compare agent versions side-by-side with statistical significance testing.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Use Cases</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Rapid Prototyping</h3>
            <p className="text-sm text-gray-400 mt-1">Build and iterate on agent workflows without writing boilerplate code.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Team Training</h3>
            <p className="text-sm text-gray-400 mt-1">Onboard new team members with visual agent design and prebuilt templates.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Cost Optimization</h3>
            <p className="text-sm text-gray-400 mt-1">Visually configure model routing to balance cost and quality.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Enterprise Governance</h3>
            <p className="text-sm text-gray-400 mt-1">Version-control agent configs and enforce organizational policies.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">150+</div>
            <div className="text-xs text-gray-400 mt-1">Teams in 90 Days</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">3x</div>
            <div className="text-xs text-gray-400 mt-1">Workflows/Team/Week</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">70%</div>
            <div className="text-xs text-gray-400 mt-1">Simulation Completion</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;5s</div>
            <div className="text-xs text-gray-400 mt-1">20-Node Simulation</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
