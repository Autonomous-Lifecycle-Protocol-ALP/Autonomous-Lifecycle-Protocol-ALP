import { LogoIcon } from "../components/Icons.jsx";
import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { socSentinelApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "soc-sentinel");

const SOC_CAPABILITIES = [
  { capability: "Event Correlation", desc: "Correlate events across agents, infrastructure, and network layers" },
  { capability: "Automated Response", desc: "Trigger containment, isolation, and remediation workflows" },
  { capability: "Adversarial ML Defense", desc: "Detect prompt injection, data poisoning, and model evasion" },
  { capability: "Attack Surface Monitoring", desc: "Continuous discovery and tracking of exposed assets" },
  { capability: "SOC Dashboard", desc: "Unified operational view with drill-down forensics" },
  { capability: "MITRE ATT&CK Mapping", desc: "Map detections to MITRE framework for threat intelligence" },
];

const THREAT_DETECTION = [
  { vector: "Network", indicators: "Unusual traffic patterns, port scanning, data exfiltration" },
  { vector: "Endpoint", indicators: "Process injection, credential dumping, lateral movement" },
  { vector: "Agent", indicators: "Prompt injection, capability abuse, policy violation" },
  { vector: "Supply Chain", indicators: "Dependency tampering, build pipeline compromise" },
];

const INCIDENT_RESPONSE = [
  { phase: "Detect", actions: "Alert triage, false positive filtering, severity assignment" },
  { phase: "Contain", actions: "Isolate affected agents, revoke credentials, block IOCs" },
  { phase: "Investigate", actions: "Forensic timeline reconstruction, root cause analysis" },
  { phase: "Remediate", actions: "Apply patches, rotate secrets, update policies" },
  { phase: "Recover", actions: "Restore services, validate integrity, document lessons learned" },
];

export default function SocSentinelPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await socSentinelApi.listAlerts();
      setAlerts(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    setError("");
    try {
      const title = prompt("Alert title:");
      if (!title) return;
      const severity = prompt("Severity (low, medium, high, critical):") || "medium";
      await socSentinelApi.createAlert({ title, severity, description: "", category: "general", status: "open" });
      await loadAlerts();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create alert");
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Security Alerts</h2>
          <button onClick={createAlert} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Create Alert</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadAlerts} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {alerts.length === 0 && <p className="text-gray-500 text-sm">No alerts yet.</p>}
          {alerts.map((a) => (
            <div key={a._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{a.title}</div>
                <div className="text-xs text-gray-500">{a.severity} • {a.category} • {a.status}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">SOC Capabilities</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {SOC_CAPABILITIES.map((cap) => (
            <div key={cap.capability} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-sky-300">{cap.capability}</h3>
              <p className="text-sm text-gray-400 mt-1">{cap.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Threat Detection Vectors</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {THREAT_DETECTION.map((tv) => (
            <div key={tv.vector} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-200">{tv.vector}</h3>
              <p className="text-sm text-gray-400 mt-1">{tv.indicators}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Incident Response Playbooks</h2>
        <div className="space-y-4">
          {INCIDENT_RESPONSE.map((ir) => (
            <div key={ir.phase} className="flex gap-4">
              <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {ir.phase[0]}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-200">{ir.phase}</h3>
                <p className="text-sm text-gray-400">{ir.actions}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-sky-400"><LogoIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">Adversarial ML Defense</h3>
            <p className="text-sm text-gray-400 mt-1">Detect prompt injection, model extraction, and jailbreaking attempts.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-medium text-gray-200">Automated Forensics</h3>
            <p className="text-sm text-gray-400 mt-1">Immutable event log with W3C Verifiable Credentials for chain-of-custody.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📡</div>
            <h3 className="font-medium text-gray-200">Real-Time Detection</h3>
            <p className="text-sm text-gray-400 mt-1">Sub-30-second threat detection latency from anomalous event to alert.</p>
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
            <div className="text-2xl font-bold text-sky-300">&lt;30s</div>
            <div className="text-xs text-gray-400 mt-1">Detection Latency</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">95%</div>
            <div className="text-xs text-gray-400 mt-1">True-Positive Rate</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">100%</div>
            <div className="text-xs text-gray-400 mt-1">Audit Trail Completeness</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
