import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { threatIntelApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "threat-intel");

const THREAT_INTELLIGENCE = [
  { source: "NVD", type: "Vulnerability database", coverage: "CVE entries with CVSS scores" },
  { source: "CISA KEV", type: "Known exploited vulnerabilities", coverage: "Active exploitation in the wild" },
  { source: "MITRE ATT&CK", type: "Threat actor TTPs", coverage: "Techniques, procedures, and mitigations" },
  { source: "AlienVault OTX", type: "Open threat exchange", coverage: "IOCs, pulses, and community intelligence" },
];

const VULNERABILITY_SCANNERS = [
  { scanner: "Trivy", type: "Container & filesystem" },
  { scanner: "Snyk", type: "Dependencies & IaC" },
  { scanner: "Grype", type: "Container images" },
  { scanner: "Custom ALP Scanner", type: "@task-based pipeline integration" },
];

const HUNTING_PLAYBOOKS = [
  { playbook: "Lateral Movement", indicators: "Unusual authentication patterns, remote service creation" },
  { playbook: "Data Exfiltration", indicators: "Large outbound transfers, DNS tunneling, cloud storage abuse" },
  { playbook: "Privilege Escalation", indicators: "SUID binaries, sudo abuse, kernel exploits" },
  { playbook: "Persistence", indicators: "Cron jobs, registry modifications, startup folder changes" },
];

export default function ThreatIntelPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await threatIntelApi.listReports();
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const createReport = async () => {
    setError("");
    try {
      const title = prompt("Report title:");
      if (!title) return;
      await threatIntelApi.createReport({ title, status: "draft", iocs: [], threatActors: [], affectedAssets: [], cvssScores: [], remediation: [] });
      await loadReports();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create report");
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Threat Intel Reports</h2>
          <button onClick={createReport} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">New Report</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadReports} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {reports.length === 0 && <p className="text-gray-500 text-sm">No reports yet.</p>}
          {reports.map((r) => (
            <div key={r._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{r.title}</div>
                <div className="text-xs text-gray-500">{r.status} • {r.iocs?.length || 0} IOCs</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Threat Intelligence Sources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {THREAT_INTELLIGENCE.map((ti) => (
            <div key={ti.source} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-sky-300">{ti.source}</h3>
              <div className="text-xs text-gray-500 mt-1">{ti.type}</div>
              <p className="text-sm text-gray-400 mt-2">{ti.coverage}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Vulnerability Scanners</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {VULNERABILITY_SCANNERS.map((vs) => (
            <div key={vs.scanner} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-gray-200">{vs.scanner}</div>
              <div className="text-xs text-sky-400 mt-1">{vs.type}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Hunting Playbooks</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {HUNTING_PLAYBOOKS.map((hp) => (
            <div key={hp.playbook} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-200">{hp.playbook}</h3>
              <p className="text-sm text-gray-400 mt-1">{hp.indicators}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-medium text-gray-200">Proactive Hunting</h3>
            <p className="text-sm text-gray-400 mt-1">Find threats before they impact production with continuous scanning.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="font-medium text-gray-200">Adversarial Modeling</h3>
            <p className="text-sm text-gray-400 mt-1">Predict likely attack vectors with ML-powered threat actor profiling.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔧</div>
            <h3 className="font-medium text-gray-200">Automated Remediation</h3>
            <p className="text-sm text-gray-400 mt-1">Generate ALP @task objects for vulnerability remediation with priority scoring.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">250+</div>
            <div className="text-xs text-gray-400 mt-1">Teams in 90 Days</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;24hr</div>
            <div className="text-xs text-gray-400 mt-1">Discovery-to-Remediation</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">80%</div>
            <div className="text-xs text-gray-400 mt-1">Exploit Prediction Accuracy</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">50+</div>
            <div className="text-xs text-gray-400 mt-1">Threat Feeds Correlated</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
