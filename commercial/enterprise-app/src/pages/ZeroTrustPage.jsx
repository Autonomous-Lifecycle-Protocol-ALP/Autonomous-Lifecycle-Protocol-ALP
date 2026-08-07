import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { zeroTrustApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "zero-trust");

const ZERO_TRUST_ARCHITECTURE = [
  { layer: "Identity", desc: "SPIFFE/SPIRE-based workload identities for every agent, service, and task" },
  { layer: "Transport", desc: "Mutual TLS everywhere — no trust without verified identity" },
  { layer: "Network", desc: "Micro-segmentation via @contract policies at the network layer" },
  { layer: "Access", desc: "Continuous authentication with 15-minute re-auth cycles" },
  { layer: "Policy", desc: "OPA/Rego policies for fine-grained authorization decisions" },
  { layer: "Audit", desc: "W3C Verifiable Credentials for immutable, portable audit trails" },
];

const IDENTITY_FRAMEWORK = [
  { component: "SPIFFE/SPIRE", purpose: "Workload identity federation" },
  { component: "X.509 SVID", purpose: "Short-lived workload certificates" },
  { component: "JWT SVID", purpose: "OIDC-compatible identity tokens" },
  { component: "Trust Domain", purpose: "Isolated identity boundaries" },
];

const POLICY_ENGINE = [
  { policy: "Network Policy", desc: "Allow/deny traffic between workloads based on identity" },
  { policy: "Access Policy", desc: "Fine-grained RBAC with attribute-based rules" },
  { policy: "Data Policy", desc: "Classification and exfiltration prevention" },
  { policy: "Compliance Policy", desc: "Automated enforcement of regulatory requirements" },
];

export default function ZeroTrustPage() {
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadIdentities = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await zeroTrustApi.listIdentities();
      setIdentities(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load identities");
    } finally {
      setLoading(false);
    }
  };

  const createIdentity = async () => {
    setError("");
    try {
      const subject = prompt("Identity subject:");
      if (!subject) return;
      const type = prompt("Type (agent, task, user, service):") || "agent";
      await zeroTrustApi.createIdentity({ subject, type, spiiffeId: `spiffe://alp.io/${type}/${subject}` });
      await loadIdentities();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create identity");
    }
  };

  useEffect(() => {
    loadIdentities();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Trust Identities</h2>
          <button onClick={createIdentity} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Register Identity</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadIdentities} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {identities.length === 0 && <p className="text-gray-500 text-sm">No identities registered.</p>}
          {identities.map((id) => (
            <div key={id._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{id.subject}</div>
                <div className="text-xs text-gray-500">{id.type} • {id.spiiffeId}</div>
              </div>
              <span className="text-xs text-gray-400">{id.lastAuthenticatedAt ? "Active" : "Pending"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Zero Trust Architecture</h2>
        <div className="space-y-4">
          {ZERO_TRUST_ARCHITECTURE.map((layer) => (
            <div key={layer.layer} className="flex gap-4 border-l-2 border-sky-500 pl-4">
              <div className="flex-1">
                <h3 className="font-medium text-sky-300">{layer.layer}</h3>
                <p className="text-sm text-gray-400 mt-1">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Identity Framework</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {IDENTITY_FRAMEWORK.map((id) => (
            <div key={id.component} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-sky-300">{id.component}</div>
              <div className="text-xs text-gray-500 mt-1">{id.purpose}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Policy Engine</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {POLICY_ENGINE.map((pe) => (
            <div key={pe.policy} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-200">{pe.policy}</h3>
              <p className="text-sm text-gray-400 mt-1">{pe.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🆔</div>
            <h3 className="font-medium text-gray-200">Workload Identity</h3>
            <p className="text-sm text-gray-400 mt-1">SPIFFE/SPIRE identities for every agent, service, and task execution.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔐</div>
            <h3 className="font-medium text-gray-200">Mutual TLS Everywhere</h3>
            <p className="text-sm text-gray-400 mt-1">Automatic mTLS between all runtime components with short-lived certs.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-medium text-gray-200">Immutable Audit Trail</h3>
            <p className="text-sm text-gray-400 mt-1">W3C Verifiable Credentials for compliance and forensics.</p>
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
            <div className="text-2xl font-bold text-sky-300">&lt;100ms</div>
            <div className="text-xs text-gray-400 mt-1">mTLS Handshake Overhead</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">0</div>
            <div className="text-xs text-gray-400 mt-1">Unauthorized Communications</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">100%</div>
            <div className="text-xs text-gray-400 mt-1">Cert Rotation Compliance</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
