import { SavingsIcon } from "../components/Icons.jsx";
import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { analyticsBiApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "analytics-bi");

const ANALYTICS_MODULES = [
  { name: "Team Productivity", desc: "Track sprint velocity, cycle time, and throughput across teams" },
  { name: "Cost Tracking", desc: "Real-time LLM API spend, infrastructure costs, and optimization recommendations" },
  { name: "Agent Performance", desc: "Per-agent success rate, token efficiency, and quality metrics" },
  { name: "Predictive Planning", desc: "Forecast resource needs and identify bottlenecks before they impact delivery" },
];

const REPORT_TYPES = [
  { report: "Sprint Velocity", freq: "Per sprint" },
  { report: "Cost Attribution", freq: "Daily" },
  { report: "Agent ROI", freq: "Weekly" },
  { report: "Quality Trends", freq: "Per release" },
];

const DATA_SOURCES = [
  { source: "ALP Event Mesh", type: "Real-time" },
  { source: "Git Provider", type: "Webhook" },
  { source: "LLM Providers", type: "API" },
  { source: "Infrastructure", type: "Metrics" },
];

export default function AnalyticsBiPage() {
  const [dashboards, setDashboards] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboards = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await analyticsBiApi.listDashboards();
      setDashboards(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load dashboards");
    } finally {
      setLoading(false);
    }
  };

  const createDashboard = async () => {
    setError("");
    try {
      const name = prompt("Dashboard name:");
      if (!name) return;
      await analyticsBiApi.createDashboard({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), widgets: [], filters: [] });
      await loadDashboards();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create dashboard");
    }
  };

  const loadReports = async () => {
    try {
      const res = await analyticsBiApi.listReports();
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createReport = async () => {
    setError("");
    try {
      const name = prompt("Report name:");
      if (!name) return;
      await analyticsBiApi.createReport({ name, type: "adhoc", format: "json", parameters: {} });
      await loadReports();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create report");
    }
  };

  useEffect(() => {
    loadDashboards();
    loadReports();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Dashboards</h2>
          <button onClick={createDashboard} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Create Dashboard</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadDashboards} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {dashboards.length === 0 && <p className="text-gray-500 text-sm">No dashboards yet.</p>}
          {dashboards.map((d) => (
            <div key={d._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{d.name}</div>
                <div className="text-xs text-gray-500">{d.slug} • {d.widgets?.length || 0} widgets</div>
              </div>
              <span className="text-xs text-gray-400">{d.isPublic ? "Public" : "Private"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Analytics Modules</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {ANALYTICS_MODULES.map((mod) => (
            <div key={mod.name} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-sky-300">{mod.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{mod.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Reports</h2>
          <button onClick={createReport} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Create Report</button>
        </div>
        <button onClick={loadReports} className="text-sm text-sky-400 mb-3">Refresh</button>
        <div className="space-y-2">
          {reports.length === 0 && <p className="text-gray-500 text-sm">No reports yet.</p>}
          {reports.map((r) => (
            <div key={r._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{r.name}</div>
                <div className="text-xs text-gray-500">{r.type} • {r.format}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(r.generatedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Data Sources</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DATA_SOURCES.map((ds) => (
            <div key={ds.source} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-gray-200">{ds.source}</div>
              <div className="text-xs text-sky-400 mt-1">{ds.type}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-medium text-gray-200">Predictive Planning</h3>
            <p className="text-sm text-gray-400 mt-1">Forecast completion dates and resource needs before they impact delivery.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-emerald-400"><SavingsIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">Cost Optimization</h3>
            <p className="text-sm text-gray-400 mt-1">Identify overspending and get actionable recommendations to reduce API spend.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📤</div>
            <h3 className="font-medium text-gray-200">BI Export</h3>
            <p className="text-sm text-gray-400 mt-1">Export to Tableau, Looker, and Power BI with pre-built templates.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">300+</div>
            <div className="text-xs text-gray-400 mt-1">Teams in 90 Days</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;3s</div>
            <div className="text-xs text-gray-400 mt-1">Dashboard Load p95</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">20%</div>
            <div className="text-xs text-gray-400 mt-1">API Spend Reduction</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">10+</div>
            <div className="text-xs text-gray-400 mt-1">BI Exports/Team/Mo</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
