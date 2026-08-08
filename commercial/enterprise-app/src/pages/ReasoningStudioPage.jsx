import { useState, useEffect } from "react";
import { critiqueSpec, verifyReasoningTrace, negotiateTasks } from "../services/reasoningApi.js";

const PRESET_TEMPLATES = {
  security: `@policy name: "auth-security-gate"
  description: "Enforce OAuth2 JWT authentication and RBAC checks"
  enforcement: deny
  deny_types: ["raw_sql", "untrusted_exec"]
!deprecated: "Legacy auth-v1 protocol directive"
@task id: "deploy-auth-service"
  status: [!]
`,
  taskGraph: `@task id: "ingest-telemetry"
  status: [x]
@task id: "compute-anomaly-score"
  depends_on: -> ingest-telemetry
  status: [~]
@task id: "trigger-autoscale"
  depends_on: -> compute-anomaly-score
  status: [!]
`,
  contract: `@contract name: "payment-gateway-api"
  version: "2.1.0"
  on_violation: deny
@task id: "process-stripe-webhook"
  status: [ ]
`,
};

export default function ReasoningStudioPage() {
  const [activeTab, setActiveTab] = useState("critique");

  // Critique State
  const [specInput, setSpecInput] = useState(PRESET_TEMPLATES.security);
  const [critiqueResult, setCritiqueResult] = useState(null);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trace Verification State
  const [chainId, setChainId] = useState("chain-v8200");
  const [traceResult, setTraceResult] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  // Negotiation State
  const [negotiationResult, setNegotiationResult] = useState(null);
  const [negotiationLoading, setNegotiationLoading] = useState(false);

  // Interactive Bidding Sliders State
  const [agentBids, setAgentBids] = useState([
    { agentId: 'agent-fast-alpha', nodeId: 'task-build', capabilityScore: 0.82, estimatedCost: 120, riskScore: 0.12 },
    { agentId: 'agent-pro-omega', nodeId: 'task-build', capabilityScore: 0.97, estimatedCost: 190, riskScore: 0.03 },
    { agentId: 'agent-qa-sentinel', nodeId: 'task-test', capabilityScore: 0.94, estimatedCost: 140, riskScore: 0.05 },
  ]);

  const handleRunCritique = async (overrideContent) => {
    setCritiqueLoading(true);
    const contentToUse = overrideContent !== undefined ? overrideContent : specInput;
    const res = await critiqueSpec(contentToUse, "SPEC", true);
    if (res.success) {
      setCritiqueResult(res);
    }
    setCritiqueLoading(false);
  };

  const handleVerifyTrace = async () => {
    setTraceLoading(true);
    const res = await verifyReasoningTrace(chainId);
    if (res.success) {
      setTraceResult(res);
    }
    setTraceLoading(false);
  };

  const handleRunNegotiation = async (bidsToUse = agentBids) => {
    setNegotiationLoading(true);
    const res = await negotiateTasks(["task-build", "task-test"], bidsToUse);
    if (res.success) {
      setNegotiationResult(res);
    }
    setNegotiationLoading(false);
  };

  const handleCopyRefined = () => {
    if (critiqueResult?.refinedContent) {
      navigator.clipboard.writeText(critiqueResult.refinedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyHash = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const updateBidSlider = (index, field, val) => {
    const updated = [...agentBids];
    updated[index][field] = parseFloat(val);
    setAgentBids(updated);
    handleRunNegotiation(updated);
  };

  useEffect(() => {
    handleRunCritique(PRESET_TEMPLATES.security);
    handleVerifyTrace();
    handleRunNegotiation(agentBids);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold gradient-text tracking-tight">
              Autonomous Reasoning Studio
            </h1>
            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs px-3 py-1 rounded-full font-mono font-medium badge-glow">
              v82.0.0 Live Engine
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Cryptographic Merkle tree reasoning verification, self-reflection critique loops, and real-time multi-agent task negotiation.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 z-10">
          <button
            onClick={() => setActiveTab("critique")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-smooth flex items-center gap-2 ${
              activeTab === "critique"
                ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <span>✨</span> Self-Reflection Critique
          </button>
          <button
            onClick={() => setActiveTab("trace")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-smooth flex items-center gap-2 ${
              activeTab === "trace"
                ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <span>🛡️</span> Merkle Trace Inspector
          </button>
          <button
            onClick={() => setActiveTab("negotiation")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-smooth flex items-center gap-2 ${
              activeTab === "negotiation"
                ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <span>🤝</span> Agent Bidding Simulator
          </button>
        </div>
      </div>

      {/* TAB 1: SELF-REFLECTION CRITIQUE */}
      {activeTab === "critique" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="card-glass rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>📝</span> Specification Code Editor
                </h2>
                {/* Template Preset Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Presets:</span>
                  <button
                    onClick={() => {
                      setSpecInput(PRESET_TEMPLATES.security);
                      handleRunCritique(PRESET_TEMPLATES.security);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1 rounded-md transition"
                  >
                    Security
                  </button>
                  <button
                    onClick={() => {
                      setSpecInput(PRESET_TEMPLATES.taskGraph);
                      handleRunCritique(PRESET_TEMPLATES.taskGraph);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2.5 py-1 rounded-md transition"
                  >
                    Task Graph
                  </button>
                  <button
                    onClick={() => {
                      setSpecInput(PRESET_TEMPLATES.contract);
                      handleRunCritique(PRESET_TEMPLATES.contract);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 py-1 rounded-md transition"
                  >
                    Contract
                  </button>
                </div>
              </div>

              <textarea
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                className="w-full h-80 bg-slate-950/90 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800/80 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500 focus:outline-none custom-scrollbar shadow-inner"
                placeholder="Paste .alp spec or source code here..."
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">
                {specInput.split("\n").length} lines | {specInput.length} chars
              </span>
              <button
                onClick={() => handleRunCritique(specInput)}
                disabled={critiqueLoading}
                className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-sky-500/25 flex items-center gap-2 disabled:opacity-50"
              >
                {critiqueLoading ? (
                  <>
                    <span className="animate-spin text-sm">🔄</span> Analyzing...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Run Self-Reflection Critique
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Diagnostics & Score Panel */}
          <div className="card-glass rounded-2xl p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>📊</span> Self-Reflection Scorecard & Diagnostics
            </h2>

            {critiqueResult ? (
              <div className="space-y-6">
                {/* Score Cards Grid */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-sky-500/30">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Overall</div>
                    <div className="text-2xl font-black text-sky-400 mt-1">
                      {(critiqueResult.report.overallScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-blue-500/30">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Correctness</div>
                    <div className="text-2xl font-black text-blue-400 mt-1">
                      {(critiqueResult.report.metrics.correctness * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Security</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      {(critiqueResult.report.metrics.security * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-purple-500/30">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Performance</div>
                    <div className="text-2xl font-black text-purple-400 mt-1">
                      {(critiqueResult.report.metrics.performance * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Defects & Suggestions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Defects ({critiqueResult.report.defects.length})
                  </h3>
                  {critiqueResult.report.defects.length === 0 ? (
                    <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl flex items-center gap-2">
                      <span>✅</span> Zero defects detected. Specification meets protocol standards.
                    </div>
                  ) : (
                    critiqueResult.report.defects.map((d, idx) => (
                      <div key={idx} className="bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2.5">
                        <span className="text-rose-400">⚠️</span>
                        <span>{d}</span>
                      </div>
                    ))
                  )}

                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
                    Refinement Suggestions
                  </h3>
                  {critiqueResult.report.refinementSuggestions.map((s, idx) => (
                    <div key={idx} className="bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-xs p-3 rounded-xl flex items-start gap-2.5">
                      <span className="text-indigo-400">💡</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>

                {/* Auto-Refined Preview & Copy Button */}
                {critiqueResult.refinedContent && (
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Auto-Refined Output Preview
                      </h3>
                      <button
                        onClick={handleCopyRefined}
                        className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5"
                      >
                        <span>{copied ? "✓ Copied!" : "📋 Copy Refined Spec"}</span>
                      </button>
                    </div>
                    <pre className="bg-slate-950 text-emerald-300 text-xs p-4 rounded-xl border border-slate-800 font-mono custom-scrollbar overflow-x-auto max-h-40">
                      {critiqueResult.refinedContent}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">Run critique to analyze specification.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MERKLE TRACE INSPECTOR */}
      {activeTab === "trace" && (
        <div className="card-glass rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>🛡️</span> Cryptographic Reasoning Chain Inspector
              </h2>
              <p className="text-xs text-slate-400">SHA-256 Merkle tree verification over autonomous reasoning step hashes</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
              />
              <button
                onClick={handleVerifyTrace}
                disabled={traceLoading}
                className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-sky-500/20"
              >
                {traceLoading ? "Verifying..." : "Verify Trace Integrity"}
              </button>
            </div>
          </div>

          {traceResult && (
            <div className="space-y-6">
              {/* Merkle Root Header Card */}
              <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Merkle Root Hash</div>
                  <div className="font-mono text-xs text-sky-400 mt-1 break-all bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 inline-block">
                    {traceResult.verification.computedRoot}
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Cryptographic Integrity</div>
                  <div className={`text-base font-extrabold mt-1 flex items-center gap-2 ${
                    traceResult.verification.valid ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {traceResult.verification.valid ? "VERIFIED VALID (Merkle Match)" : "INVALID TRACE"}
                  </div>
                </div>
              </div>

              {/* Visual Step Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                {traceResult.steps.map((step, idx) => (
                  <div key={step.stepId} className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-3 relative hover:border-sky-500/50 transition">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Step #{idx + 1}
                      </span>
                      <span className="text-xs text-sky-400 font-semibold">{step.agentId}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100">{step.thought}</h3>

                    <div className="text-xs text-slate-400">
                      Action: <span className="font-mono text-purple-400">{step.action}</span>
                    </div>

                    {/* Confidence Meter Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Confidence</span>
                        <span className="text-emerald-400 font-bold">{(step.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${step.confidence * 100}%` }}></div>
                      </div>
                    </div>

                    {/* SHA-256 Hash Copy */}
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
                      <span className="font-mono text-slate-500">{step.hash.substring(0, 14)}...</span>
                      <button
                        onClick={() => handleCopyHash(step.hash, step.stepId)}
                        className="text-xs text-slate-400 hover:text-sky-300 font-mono transition"
                      >
                        {copiedHash === step.stepId ? "✓ Copied" : "Copy Hash"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AGENT NEGOTIATION */}
      {activeTab === "negotiation" && (
        <div className="card-glass rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>🤝</span> Multi-Agent Task Bidding & Negotiation
              </h2>
              <p className="text-xs text-slate-400">Simulate agent bidding with live Capability (50%), Cost (30%), and Risk (20%) sliders</p>
            </div>
            <button
              onClick={() => handleRunNegotiation(agentBids)}
              disabled={negotiationLoading}
              className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-sky-500/20"
            >
              {negotiationLoading ? "Calculating..." : "Re-Calculate Bids"}
            </button>
          </div>

          {/* Interactive Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agentBids.map((bid, idx) => (
              <div key={bid.agentId} className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold font-mono text-sky-400">{bid.agentId}</h3>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {bid.nodeId}
                  </span>
                </div>

                {/* Capability Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Capability</span>
                    <span className="font-mono text-blue-400 font-semibold">{(bid.capabilityScore * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.01"
                    value={bid.capabilityScore}
                    onChange={(e) => updateBidSlider(idx, "capabilityScore", e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Cost Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Compute Cost</span>
                    <span className="font-mono text-amber-400 font-semibold">{bid.estimatedCost} tokens</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={bid.estimatedCost}
                    onChange={(e) => updateBidSlider(idx, "estimatedCost", e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Risk Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Risk Score</span>
                    <span className="font-mono text-rose-400 font-semibold">{(bid.riskScore * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.30"
                    step="0.01"
                    value={bid.riskScore}
                    onChange={(e) => updateBidSlider(idx, "riskScore", e.target.value)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Winning Assignments Summary */}
          {negotiationResult && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Negotiation Allocation Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {negotiationResult.assignments.map((assignment) => (
                  <div key={assignment.nodeId} className="bg-slate-950 border border-sky-500/30 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-xs font-mono text-slate-400">Node: {assignment.nodeId}</div>
                      <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                        Winner: {assignment.winningAgentId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Composite Score</div>
                      <div className="text-base font-black text-sky-400">{assignment.bidScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
