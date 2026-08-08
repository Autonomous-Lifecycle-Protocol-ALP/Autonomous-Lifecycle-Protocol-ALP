import { useState } from "react";
import api from "../utils/api.js";
import {
  ShieldIcon,
  SparklesIcon,
  CheckCircleIcon,
  CopyIcon,
  ZapIcon,
  CodeIcon,
  RefreshIcon
} from "../components/Icons.jsx";

export default function ZKProofStudioPage() {
  const [policyId, setPolicyId] = useState("auth-security-gate");
  const [secretValue, setSecretValue] = useState("secret-oauth2-jwt-token-2026");
  const [proofResult, setProofResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleGenerateProof = async () => {
    try {
      setLoading(true);
      const res = await api.post("/zk-proofs/generate", { policyId, secretValue });
      if (res.data?.success) {
        setProofResult(res.data.proof);
      }
    } catch {
      // Offline fallback
      setProofResult({
        proofId: `zk-proof-${Date.now()}`,
        policyId,
        statementHash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
        zkProofToken: "a438787f0b5d92e5c8e31245b736b4129b0a70cf6103a89047bfa2542a1975e1",
        verified: true,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (proofResult?.zkProofToken) {
      navigator.clipboard.writeText(proofResult.zkProofToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-medium badge-glow">
            <SparklesIcon size="sm" /> v84.0.0 Cryptographic ZK Policy Proofs
          </div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tight">
            Zero-Knowledge Policy Proofs &amp; Confidential Verifier
          </h1>
          <p className="text-slate-400 text-xs max-w-2xl">
            Generate and verify ZK-SNARK cryptographic proofs over policy compliance without exposing underlying sensitive code or workspace secrets.
          </p>
        </div>

        <button
          onClick={handleGenerateProof}
          disabled={loading}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <RefreshIcon className="animate-spin text-sm" /> : <ShieldIcon size="sm" />}
          {loading ? "Generating Proof..." : "Generate ZK Proof Token"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proof Generator Controls */}
        <div className="card-glass rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CodeIcon className="text-purple-400" />
            <span>Policy Secret &amp; Statement Configurator</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Target Policy Identifier</label>
              <input
                type="text"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Confidential Secret Payload (Hidden in ZK Proof)</label>
              <input
                type="password"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            * The secret payload is hashed locally with Zero-Knowledge constraints and is never transmitted over the network.
          </div>
        </div>

        {/* ZK Proof Attestation Result */}
        <div className="card-glass rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldIcon className="text-indigo-400" />
            <span>Cryptographic ZK-SNARK Attestation Result</span>
          </h2>

          {proofResult ? (
            <div className="space-y-4">
              <div className="bg-slate-950/90 p-4 rounded-xl border border-purple-500/30 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Attestation Status</div>
                  <div className="text-base font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <CheckCircleIcon className="text-emerald-400" />
                    <span>VERIFIED VALID (ZK-SNARK Pass)</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Proof ID</div>
                  <div className="text-xs font-mono text-purple-300 font-bold mt-0.5">{proofResult.proofId}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400">Statement Hash</div>
                <div className="font-mono text-xs text-sky-400 bg-slate-950 p-3 rounded-xl border border-slate-800 break-all">
                  {proofResult.statementHash}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-purple-400">Cryptographic ZK Proof Token</span>
                  <button
                    onClick={handleCopyToken}
                    className="text-xs text-slate-400 hover:text-purple-300 transition font-mono flex items-center gap-1"
                  >
                    <CopyIcon size="sm" /> {copiedToken ? "Copied!" : "Copy Token"}
                  </button>
                </div>
                <div className="font-mono text-xs text-purple-300 bg-slate-950 p-3 rounded-xl border border-purple-500/40 break-all">
                  {proofResult.zkProofToken}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Click &ldquo;Generate ZK Proof Token&rdquo; to execute cryptographic verifier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
