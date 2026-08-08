import { ShieldIcon, LogoIcon } from "../components/Icons.jsx";
import { useState } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { securityApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "security-scanner");

const SCAN_TYPES = [
  { name: "SAST", desc: "Static Application Security Testing for source code analysis" },
  { name: "DAST", desc: "Dynamic Application Security Testing for runtime vulnerability detection" },
  { name: "SCA", desc: "Software Composition Analysis for dependency vulnerability checks" },
  { name: "IaC Scanning", desc: "Infrastructure as Code security analysis for Terraform, CloudFormation" },
];

const COMPLIANCE_FRAMEWORKS = [
  { framework: "SOC 2 Type II", controls: "Trust services criteria" },
  { framework: "ISO 27001", controls: "Annex A controls" },
  { framework: "GDPR", controls: "Data protection & privacy" },
  { framework: "HIPAA", controls: "Healthcare data safeguards" },
];

const REMEDIATION_STEPS = [
  { step: "Scan", desc: "Automated scan of code, dependencies, and infrastructure" },
  { step: "Analyze", desc: "AI-powered analysis to determine exploitability and impact" },
  { step: "Prioritize", desc: "CVSS scoring combined with business context for prioritization" },
  { step: "Remediate", desc: "Generate fix suggestions and automated PRs where possible" },
  { step: "Verify", desc: "Re-scan after fix to confirm vulnerability is resolved" },
];

export default function SecurityScannerPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadScans = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await securityApi.listScans();
      setScans(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load scans");
    } finally {
      setLoading(false);
    }
  };

  const createScan = async () => {
    setError("");
    try {
      const target = prompt("Scan target (file path, repo, or URL):");
      if (!target) return;
      const scanType = prompt("Scan type (sast, dast, sca, iac):") || "sast";
      await securityApi.createScan({ target, scanType });
      await loadScans();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create scan");
    }
  };

  const runScan = async (id) => {
    setError("");
    try {
      await securityApi.runScan(id);
      await loadScans();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to run scan");
    }
  };

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Security Scans</h2>
          <button onClick={createScan} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">New Scan</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadScans} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {scans.length === 0 && <p className="text-gray-500 text-sm">No scans yet.</p>}
          {scans.map((scan) => (
            <div key={scan._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{scan.scanType?.toUpperCase() || "SCAN"}</div>
                <div className="text-xs text-gray-500">{scan.target} • {scan.status}</div>
              </div>
              <div className="flex gap-2">
                {scan.status === "queued" && (
                  <button onClick={() => runScan(scan._id)} className="text-xs bg-sky-600 text-white px-3 py-1 rounded hover:bg-sky-700">Run</button>
                )}
                <span className="text-xs text-gray-400">{new Date(scan.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Scan Types</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {SCAN_TYPES.map((scan) => (
            <div key={scan.name} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-sky-300">{scan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{scan.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Compliance Frameworks</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COMPLIANCE_FRAMEWORKS.map((cf) => (
            <div key={cf.framework} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-gray-200">{cf.framework}</div>
              <div className="text-xs text-gray-500 mt-1">{cf.controls}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Remediation Workflow</h2>
        <div className="space-y-4">
          {REMEDIATION_STEPS.map((step, idx) => (
            <div key={step.step} className="flex gap-4">
              <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-200">{step.step}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-rose-400"><ShieldIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">Shift-Left Security</h3>
            <p className="text-sm text-gray-400 mt-1">Catch vulnerabilities before they reach production with integrated SAST/DAST.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-medium text-gray-200">Compliance Automation</h3>
            <p className="text-sm text-gray-400 mt-1">SOC2, ISO27001, GDPR, HIPAA reports generated automatically.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-sky-400"><LogoIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">AI Remediation</h3>
            <p className="text-sm text-gray-400 mt-1">Automated fix suggestions and pull request generation for common vulnerabilities.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">80+</div>
            <div className="text-xs text-gray-400 mt-1">Teams on Pro</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;60s</div>
            <div className="text-xs text-gray-400 mt-1">50K-Line Scan Time</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">95%</div>
            <div className="text-xs text-gray-400 mt-1">True-Positive Rate</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">100%</div>
            <div className="text-xs text-gray-400 mt-1">SOC2 Control Coverage</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
