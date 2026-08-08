import { useState } from "react";
import api from "../utils/api.js";
import {
  CodeIcon,
  SendIcon,
  CheckCircleIcon,
  AlertIcon,
  SparklesIcon,
  CopyIcon,
  ZapIcon
} from "../components/Icons.jsx";

const API_ENDPOINTS = [
  { id: "health", group: "System", method: "GET", path: "/health", desc: "System Health Check" },
  { id: "auth_profile", group: "Auth", method: "GET", path: "/api/auth/profile", desc: "Get Current User Profile & Org" },
  { id: "workspaces_list", group: "Workspaces", method: "GET", path: "/api/workspaces", desc: "List Active Sandboxed Workspaces" },
  { id: "reasoning_execute", group: "Reasoning Core", method: "POST", path: "/api/reasoning/execute", desc: "Execute SHA-256 Merkle Reasoning Graph", defaultBody: '{\n  "spec": "workflow quantum_sim { step vqe { verify true } }",\n  "merkleCheck": true\n}' },
  { id: "federation_mesh", group: "Federation", method: "GET", path: "/api/federation/mesh", desc: "Fetch Active Swarm Nodes & Mesh Topology" },
  { id: "zk_verify", group: "ZK-Proofs", method: "POST", path: "/api/zk-proofs/verify", desc: "Verify Zero-Knowledge Policy Statement", defaultBody: '{\n  "policyId": "auth-sec-v84",\n  "statement": "role == admin"\n}' },
  { id: "digital_twin_telemetry", group: "Digital Twin", method: "GET", path: "/api/digital-twin/telemetry", desc: "Fetch Hardware Digital Twin Sync State" },
  { id: "quantum_optimize", group: "Quantum", method: "POST", path: "/api/digital-twin/quantum/optimize", desc: "Compile & Optimize QPU Circuit", defaultBody: '{\n  "gates": ["H 0", "CNOT 0 1", "RZ(0.4) 1"],\n  "targetQpu": "ibm_kyiv"\n}' },
];

export default function ApiExplorerPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[3]); // Default reasoning
  const [requestBody, setRequestBody] = useState(selectedEndpoint.defaultBody || "");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);

  const handleSelectEndpoint = (ep) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.defaultBody || "");
    setResponse(null);
    setResponseStatus(null);
    setResponseTime(null);
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setResponse(null);
    const startTime = performance.now();

    try {
      let res;
      if (selectedEndpoint.method === "GET") {
        res = await api.get(selectedEndpoint.path);
      } else if (selectedEndpoint.method === "POST") {
        let bodyObj = {};
        try {
          bodyObj = JSON.parse(requestBody || "{}");
        } catch {
          bodyObj = { raw: requestBody };
        }
        res = await api.post(selectedEndpoint.path, bodyObj);
      }
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(res.status || 200);
      setResponse(res.data);
    } catch (err) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(err.response?.status || 500);
      setResponse(err.response?.data || { error: err.message || "Network Error / Service Unavailable" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium badge-glow">
          <CodeIcon size="sm" /> Interactive REST API Explorer
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          ALP Open-Core API Playground
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Test live REST endpoints for Reasoning Core, Swarm Federation, ZK-Proofs, Digital Twin Sync, and Workspace APIs.
        </p>
      </div>

      {/* Main Grid: Endpoints List + Request/Response Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector Sidebar */}
        <div className="lg:col-span-4 card-glass rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            API Endpoints ({API_ENDPOINTS.length})
          </h2>

          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {API_ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl border transition-smooth space-y-1 ${
                    isSelected
                      ? "bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-md shadow-sky-500/10"
                      : "bg-slate-950/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ep.method === "GET"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                          : "bg-indigo-950/60 text-indigo-400 border border-indigo-800/60"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{ep.group}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-200 truncate">{ep.path}</div>
                  <div className="text-[11px] text-slate-400 truncate">{ep.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Request & Response Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {/* Request Header Bar */}
          <div className="card-glass rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border ${
                    selectedEndpoint.method === "GET"
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                      : "bg-indigo-950/60 text-indigo-400 border-indigo-800/60"
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <code className="text-sm font-mono text-slate-100 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex-1 truncate">
                  {selectedEndpoint.path}
                </code>
              </div>

              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <SendIcon size="sm" />
                {loading ? "Executing..." : "Send Request"}
              </button>
            </div>

            <p className="text-xs text-slate-400">{selectedEndpoint.desc}</p>

            {/* Request Body Editor (if POST) */}
            {selectedEndpoint.method === "POST" && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                  <span>JSON Payload</span>
                  <span className="text-slate-500">Content-Type: application/json</span>
                </div>
                <textarea
                  rows={5}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full bg-slate-950 text-sky-300 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none custom-scrollbar"
                />
              </div>
            )}
          </div>

          {/* Response Box */}
          <div className="card-glass rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Response Output
                </h3>
                {responseStatus && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      responseStatus >= 200 && responseStatus < 300
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                        : "bg-rose-950/60 text-rose-400 border-rose-800/60"
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {responseTime && (
                  <span className="text-[11px] font-mono text-slate-400">
                    ⏱ {responseTime} ms
                  </span>
                )}
              </div>

              {response && (
                <button
                  onClick={handleCopyResponse}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <CopyIcon size="sm" />
                  {copiedResponse ? "Copied!" : "Copy JSON"}
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono animate-pulse">
                Sending HTTP request to Express backend...
              </div>
            ) : response ? (
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto max-h-96 custom-scrollbar">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                Click &ldquo;Send Request&rdquo; to view live payload responses.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
