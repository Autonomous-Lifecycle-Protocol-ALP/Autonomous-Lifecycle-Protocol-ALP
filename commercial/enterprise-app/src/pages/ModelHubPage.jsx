import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { modelHubApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "model-hub");

const MODEL_CATEGORIES = [
  { category: "Code Review", models: "CodeLlama, StarCoder, DeepSeek-Coder", tasks: "Pull request review, code quality scoring" },
  { category: "Test Generation", models: "CodeLlama, GPT-4o", tasks: "Unit test generation, edge case coverage" },
  { category: "Documentation", models: "Claude 3.5, GPT-4o", tasks: "API docs, README generation, changelog" },
  { category: "Refactoring", models: "DeepSeek-Coder, StarCoder", tasks: "Code smell detection, pattern application" },
];

const ROUTING_STRATEGIES = [
  { strategy: "Cost-Optimized", desc: "Route simple tasks to cheaper models, reserve premium models for complex reasoning" },
  { strategy: "Latency-Optimized", desc: "Fast models for real-time tasks, batch processing for background jobs" },
  { strategy: "Quality-First", desc: "Use highest-quality model for critical tasks regardless of cost" },
];

export default function ModelHubPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadModels = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await modelHubApi.listModels();
      setModels(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load models");
    } finally {
      setLoading(false);
    }
  };

  const createModel = async () => {
    setError("");
    try {
      const name = prompt("Model name:");
      if (!name) return;
      const task = prompt("Task (e.g., code-review):") || "general";
      await modelHubApi.createModel({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), provider: "custom", task, baseModel: "unknown" });
      await loadModels();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create model");
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Registered Models</h2>
          <button onClick={createModel} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Register Model</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadModels} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {models.length === 0 && <p className="text-gray-500 text-sm">No models registered.</p>}
          {models.map((m) => (
            <div key={m._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{m.name}</div>
                <div className="text-xs text-gray-500">{m.provider} • {m.task} • {m.baseModel}</div>
              </div>
              <span className="text-xs text-gray-400">{m.fineTuned ? "Fine-tuned" : "Base"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Model Categories</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {MODEL_CATEGORIES.map((cat) => (
            <div key={cat.category} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-sky-300">{cat.category}</h3>
              <div className="text-xs text-gray-500 mt-1">{cat.models}</div>
              <p className="text-sm text-gray-400 mt-2">{cat.tasks}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Routing Optimization</h2>
        <div className="space-y-4">
          {ROUTING_STRATEGIES.map((rs) => (
            <div key={rs.strategy} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-200">{rs.strategy}</h3>
              <p className="text-sm text-gray-400 mt-1">{rs.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium text-gray-200">Cost Savings</h3>
            <p className="text-sm text-gray-400 mt-1">Automatic routing reduces costs by up to 20% vs manual model selection.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-medium text-gray-200">Task Optimization</h3>
            <p className="text-sm text-gray-400 mt-1">ALP-optimized models tuned for code review, testing, and documentation.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-medium text-gray-200">Performance Tracking</h3>
            <p className="text-sm text-gray-400 mt-1">Model leaderboards with user feedback loops and continuous improvement.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">50+</div>
            <div className="text-xs text-gray-400 mt-1">Models Listed</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;100ms</div>
            <div className="text-xs text-gray-400 mt-1">Routing Decision p99</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">20%</div>
            <div className="text-xs text-gray-400 mt-1">Cost Savings</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">$5M</div>
            <div className="text-xs text-gray-400 mt-1">GMV Target Year 1</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
