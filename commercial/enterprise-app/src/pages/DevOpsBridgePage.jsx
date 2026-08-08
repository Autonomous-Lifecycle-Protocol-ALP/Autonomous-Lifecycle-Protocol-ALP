import { AnalyticsIcon, LayersIcon } from "../components/Icons.jsx";
import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { devOpsApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "devops-bridge");

const CI_CD_INTEGRATIONS = [
  { name: "GitHub Actions", type: "CI/CD", features: "Workflow triggers, artifact management, secret injection" },
  { name: "GitLab CI", type: "CI/CD", features: "Pipeline orchestration, merge request automation" },
  { name: "CircleCI", type: "CI/CD", features: "Orb integration, workflow triggers" },
  { name: "Jenkins", type: "CI/CD", features: "Plugin support, pipeline as code" },
  { name: "ArgoCD", type: "GitOps", features: "Application delivery, progressive delivery" },
];

const DEPLOYMENT_STRATEGIES = [
  { strategy: "Blue/Green", desc: "Zero-d downtime deployments with instant rollback" },
  { strategy: "Canary", desc: "Gradual traffic shifting with automated health checks" },
  { strategy: "Rolling", desc: "Incremental pod replacement with configurable batch size" },
  { strategy: "Feature Flags", desc: "Progressive feature rollout with percentage-based targeting" },
];

const QUALITY_GATES = [
  { gate: "Tests", threshold: "100% pass rate" },
  { gate: "Lint", threshold: "Zero errors" },
  { gate: "Security", threshold: "No critical/high" },
  { gate: "Performance", threshold: "P95 < 200ms" },
];

export default function DevOpsBridgePage() {
  const [pipelines, setPipelines] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPipelines = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await devOpsApi.listPipelines();
      setPipelines(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  };

  const loadDeployments = async () => {
    try {
      const res = await devOpsApi.listDeployments();
      setDeployments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createPipeline = async () => {
    setError("");
    try {
      const name = prompt("Pipeline name:");
      if (!name) return;
      const provider = prompt("Provider (github, gitlab, circleci, jenkins, argocd):") || "github";
      await devOpsApi.createPipeline({ name, provider, config: {} });
      await loadPipelines();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create pipeline");
    }
  };

  const triggerPipeline = async (id) => {
    setError("");
    try {
      const environment = prompt("Deploy to environment (dev, staging, prod):") || "dev";
      const version = prompt("Version (e.g. v1.0.0):") || "latest";
      await devOpsApi.deploy(id, { environment, version });
      await loadPipelines();
      await loadDeployments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to trigger pipeline");
    }
  };

  useEffect(() => {
    loadPipelines();
    loadDeployments();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Your Pipelines</h2>
          <button onClick={createPipeline} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Create Pipeline</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadPipelines} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {pipelines.length === 0 && <p className="text-gray-500 text-sm">No pipelines yet.</p>}
          {pipelines.map((p) => (
            <div key={p._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{p.name}</div>
                <div className="text-xs text-gray-500">{p.provider} • {p.lastRunStatus || "pending"}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
                <button onClick={() => triggerPipeline(p._id)} className="bg-sky-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-sky-700">Deploy</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Recent Deployments</h2>
        <div className="space-y-2">
          {deployments.length === 0 && <p className="text-gray-500 text-sm">No deployments yet.</p>}
          {deployments.map((d) => (
            <div key={d._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{d.environment}</div>
                <div className="text-xs text-gray-500">v{d.version || "latest"} • {d.status}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">CI/CD Integrations</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CI_CD_INTEGRATIONS.map((integration) => (
            <div key={integration.name} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-sky-300">{integration.name}</div>
              <div className="text-xs text-gray-500 mt-1">{integration.type}</div>
              <p className="text-sm text-gray-400 mt-2">{integration.features}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Deployment Strategies</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {DEPLOYMENT_STRATEGIES.map((ds) => (
            <div key={ds.strategy} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-200">{ds.strategy}</h3>
              <p className="text-sm text-gray-400 mt-1">{ds.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Quality Gates</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUALITY_GATES.map((gate) => (
            <div key={gate.gate} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-gray-200">{gate.gate}</div>
              <div className="text-xs text-sky-400 mt-1">{gate.threshold}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="font-medium text-gray-200">Automated Rollback</h3>
            <p className="text-sm text-gray-400 mt-1">Instant rollback on failed quality gates with zero-downtime deployments.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-emerald-400"><LayersIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">Multi-Cloud</h3>
            <p className="text-sm text-gray-400 mt-1">Deploy to AWS, GCP, Azure, and Kubernetes with unified tooling.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-blue-400"><AnalyticsIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">Deployment Visibility</h3>
            <p className="text-sm text-gray-400 mt-1">Visual deployment timeline with audit trail and compliance reporting.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">100+</div>
            <div className="text-xs text-gray-400 mt-1">Teams in 90 Days</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;10s</div>
            <div className="text-xs text-gray-400 mt-1">Pipeline p95</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">99.5%</div>
            <div className="text-xs text-gray-400 mt-1">Success Rate</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">3+</div>
            <div className="text-xs text-gray-400 mt-1">CI Providers/Team</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
