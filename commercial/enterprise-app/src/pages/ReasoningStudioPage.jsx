import { useState, useEffect } from "react";
import { critiqueSpec, verifyReasoningTrace, negotiateTasks } from "../services/reasoningApi.js";

const DEFAULT_SPEC = `@policy name: "auth-gate"
!deprecated: "Use auth-gate-v2"
@task id: "deploy-service"
  status: [!]
`;

export default function ReasoningStudioPage() {
  const [activeTab, setActiveTab] = useState("critique");

  // Critique State
  const [specInput, setSpecInput] = useState(DEFAULT_SPEC);
  const [critiqueResult, setCritiqueResult] = useState(null);
  const [critiqueLoading, setCritiqueLoading] = useState(false);

  // Trace Verification State
  const [chainId, setChainId] = useState("chain-v8200");
  const [traceResult, setTraceResult] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);

  // Negotiation State
  const [negotiationResult, setNegotiationResult] = useState(null);
  const [negotiationLoading, setNegotiationLoading] = useState(false);

  const handleRunCritique = async () => {
    setCritiqueLoading(true);
    const res = await critiqueSpec(specInput, "SPEC", true);
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

  const handleRunNegotiation = async () => {
    setNegotiationLoading(true);
    const res = await negotiateTasks(["task-build", "task-audit", "task-test"], []);
    if (res.success) {
      setNegotiationResult(res);
    }
    setNegotiationLoading(false);
  };

  useEffect(() => {
    handleRunCritique();
    handleVerifyTrace();
    handleRunNegotiation();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-primary text-3xl">🧠</span> Autonomous Reasoning Studio
          </h1>
          <p className="text-gray-400 mt-1">
            ALP V82.0.0 Verifiable Reasoning Trees, Self-Reflection Critique Loops, and Multi-Agent Task Allocation
          </p>
        </div>
        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveTab("critique")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "critique" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Self-Reflection Critique
          </button>
          <button
            onClick={() => setActiveTab("trace")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "trace" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Merkle Trace Inspector
          </button>
          <button
            onClick={() => setActiveTab("negotiation")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "negotiation" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Agent Negotiation
          </button>
        </div>
      </div>

      {/* TAB 1: SELF-REFLECTION CRITIQUE */}
      {activeTab === "critique" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Specification / Code Input</h2>
              <button
                onClick={handleRunCritique}
                disabled={critiqueLoading}
                className="bg-primary hover:bg-primary/80 text-white font-medium px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {critiqueLoading ? "Analyzing..." : "Run Self-Reflection Critique"}
              </button>
            </div>
            <textarea
              value={specInput}
              onChange={(e) => setSpecInput(e.target.value)}
              className="w-full h-80 bg-gray-950 text-gray-200 font-mono text-sm p-4 rounded-lg border border-gray-800 focus:border-primary focus:outline-none"
              placeholder="Paste .alp spec or source code here..."
            />
          </div>

          {/* Results Panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-6">
            <h2 className="text-lg font-semibold text-white">Critique Score & Diagnostics</h2>

            {critiqueResult ? (
              <>
                {/* Score Gauges */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-400">Overall</div>
                    <div className="text-xl font-bold text-primary">
                      {(critiqueResult.report.overallScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-400">Correctness</div>
                    <div className="text-xl font-bold text-blue-400">
                      {(critiqueResult.report.metrics.correctness * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-400">Security</div>
                    <div className="text-xl font-bold text-emerald-400">
                      {(critiqueResult.report.metrics.security * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-400">Performance</div>
                    <div className="text-xl font-bold text-purple-400">
                      {(critiqueResult.report.metrics.performance * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Defects & Suggestions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Defects Found ({critiqueResult.report.defects.length})</h3>
                  {critiqueResult.report.defects.length === 0 ? (
                    <div className="text-xs text-gray-500 italic">No critical defects detected.</div>
                  ) : (
                    critiqueResult.report.defects.map((d, idx) => (
                      <div key={idx} className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs p-3 rounded-lg">
                        ⚠️ {d}
                      </div>
                    ))
                  )}

                  <h3 className="text-sm font-medium text-gray-300">Refinement Suggestions</h3>
                  {critiqueResult.report.refinementSuggestions.map((s, idx) => (
                    <div key={idx} className="bg-blue-950/40 border border-blue-800/60 text-blue-300 text-xs p-3 rounded-lg">
                      💡 {s}
                    </div>
                  ))}
                </div>

                {/* Refined Content Preview */}
                {critiqueResult.refinedContent && (
                  <div>
                    <h3 className="text-sm font-medium text-emerald-400 mb-2">Auto-Refined Output</h3>
                    <pre className="bg-gray-950 text-emerald-300 text-xs p-3 rounded-lg border border-gray-800 overflow-x-auto">
                      {critiqueResult.refinedContent}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">Run critique to display report.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MERKLE TRACE INSPECTOR */}
      {activeTab === "trace" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Cryptographic Reasoning Trace Inspector</h2>
              <p className="text-sm text-gray-400">Verifiable SHA-256 Merkle chain over agent execution steps</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="bg-gray-950 border border-gray-800 px-3 py-2 rounded-lg text-sm text-gray-200 focus:outline-none"
              />
              <button
                onClick={handleVerifyTrace}
                disabled={traceLoading}
                className="bg-primary hover:bg-primary/80 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                {traceLoading ? "Verifying..." : "Verify Trace"}
              </button>
            </div>
          </div>

          {traceResult && (
            <div className="space-y-6">
              {/* Summary Status */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-400">Merkle Root Hash</div>
                  <div className="font-mono text-sm text-primary break-all">{traceResult.verification.computedRoot}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Trace Integrity</div>
                  <div className={`text-lg font-bold ${traceResult.verification.valid ? "text-emerald-400" : "text-red-400"}`}>
                    {traceResult.verification.valid ? "✅ VERIFIED VALID" : "❌ INVALID TRACE"}
                  </div>
                </div>
              </div>

              {/* Steps Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="py-3 px-4">Step ID</th>
                      <th className="py-3 px-4">Agent ID</th>
                      <th className="py-3 px-4">Thought</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Confidence</th>
                      <th className="py-3 px-4">SHA-256 Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {traceResult.steps.map((step) => (
                      <tr key={step.stepId} className="hover:bg-gray-950/50">
                        <td className="py-3 px-4 font-mono text-gray-200">{step.stepId}</td>
                        <td className="py-3 px-4 text-blue-400">{step.agentId}</td>
                        <td className="py-3 px-4 text-gray-300">{step.thought}</td>
                        <td className="py-3 px-4 font-mono text-purple-400">{step.action}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">{(step.confidence * 100).toFixed(0)}%</td>
                        <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">{step.hash.substring(0, 16)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AGENT NEGOTIATION */}
      {activeTab === "negotiation" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Cross-Agent Task Negotiation</h2>
              <p className="text-sm text-gray-400">Multi-agent task allocation based on Capability, Cost, and Risk scoring</p>
            </div>
            <button
              onClick={handleRunNegotiation}
              disabled={negotiationLoading}
              className="bg-primary hover:bg-primary/80 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              {negotiationLoading ? "Negotiating..." : "Run Negotiation"}
            </button>
          </div>

          {negotiationResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {negotiationResult.assignments.map((assignment) => (
                <div key={assignment.nodeId} className="bg-gray-950 border border-gray-800 p-5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-400">Plan Node</span>
                    <span className="text-xs bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 rounded">
                      Score: {assignment.bidScore}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{assignment.nodeId}</h3>
                  <div className="pt-2 border-t border-gray-800/80 flex justify-between items-center text-xs">
                    <span className="text-gray-400">Winning Agent:</span>
                    <span className="font-bold text-emerald-400">{assignment.winningAgentId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
