import { useState } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { dataPipelineApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "data-pipeline-studio");

const PIPELINE_COMPONENTS = [
  { component: "Source Connectors", desc: " ingest from databases, APIs, streams, and file systems" },
  { component: "Transform Engine", desc: "SQL-based and code-based transformations with schema evolution" },
  { component: "Quality Gates", desc: "Data validation, anomaly detection, and freshness checks" },
  { component: "Sink Connectors", desc: "Deliver to data warehouses, lakes, and real-time stores" },
];

const DATA_QUALITY = [
  { check: "Schema Validation", desc: "Ensure data conforms to expected structure" },
  { check: "Null Detection", desc: "Identify missing or incomplete data" },
  { check: "Duplicate Detection", desc: "Find and handle duplicate records" },
  { check: "Freshness SLA", desc: "Monitor data latency and alert on breaches" },
];

const INTEGRATIONS = [
  { tool: "dbt", purpose: "Transform modeling" },
  { tool: "Airflow", purpose: "Orchestration" },
  { tool: "Great Expectations", purpose: "Data quality" },
  { tool: "Spark", purpose: "Large-scale processing" },
  { tool: "Kafka", purpose: "Streaming" },
  { tool: "Snowflake", purpose: "Warehouse" },
];

export default function DataPipelineStudioPage() {
  const [pipelines, setPipelines] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPipelines = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dataPipelineApi.listPipelines();
      setPipelines(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  };

  const createPipeline = async () => {
    setError("");
    try {
      const name = prompt("Pipeline name:");
      if (!name) return;
      await dataPipelineApi.createPipeline({ name, description: "", graph: {}, status: "draft" });
      await loadPipelines();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create pipeline");
    }
  };

  const loadRuns = async () => {
    try {
      const res = await dataPipelineApi.listRuns();
      setRuns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Pipelines</h2>
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
                <div className="text-xs text-gray-500">{p.status} • {p.schedule || "unscheduled"}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Pipeline Components</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {PIPELINE_COMPONENTS.map((comp) => (
            <div key={comp.component} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-sky-300">{comp.component}</h3>
              <p className="text-sm text-gray-400 mt-1">{comp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Data Quality Framework</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {DATA_QUALITY.map((dq) => (
            <div key={dq.check} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-200">{dq.check}</h3>
              <p className="text-sm text-gray-400 mt-1">{dq.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Integrations</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map((int) => (
            <div key={int.tool} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-sky-300">{int.tool}</div>
              <div className="text-xs text-gray-500 mt-1">{int.purpose}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-medium text-gray-200">Data Lineage</h3>
            <p className="text-sm text-gray-400 mt-1">Automated lineage inference from task graphs for full traceability.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🧪</div>
            <h3 className="font-medium text-gray-200">Experiment Tracking</h3>
            <p className="text-sm text-gray-400 mt-1">ML experiment tracking with model registry and versioning.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-medium text-gray-200">Schema Evolution</h3>
            <p className="text-sm text-gray-400 mt-1">ALP @contract enforced schema registry with migration automation.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">10+</div>
            <div className="text-xs text-gray-400 mt-1">Enterprise Customers</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">50+</div>
            <div className="text-xs text-gray-400 mt-1">Pipelines Managed</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">90%</div>
            <div className="text-xs text-gray-400 mt-1">Quality Gate Pass</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;5min</div>
            <div className="text-xs text-gray-400 mt-1">Pipeline Deployment</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
