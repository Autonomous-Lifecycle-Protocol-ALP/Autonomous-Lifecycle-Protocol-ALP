import { useState, useEffect } from "react";
import api from "../utils/api.js";
import {
  LayersIcon,
  ShieldIcon,
  ZapIcon,
  CheckCircleIcon,
  SparklesIcon,
  RefreshIcon,
  ActivityIcon,
  AlertIcon
} from "../components/Icons.jsx";

export default function FederationStudioPage() {
  const [meshData, setMeshData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchMesh = async () => {
    try {
      setLoading(true);
      const res = await api.get("/federation/mesh");
      if (res.data?.success) {
        setMeshData(res.data);
      }
    } catch {
      // Offline fallback
      setMeshData({
        activeNodes: [
          { nodeId: "node-us-east", cluster: "us-east-1", status: "ONLINE", workloadCapacity: 100, activeTasks: 18, latencyMs: 14 },
          { nodeId: "node-eu-west", cluster: "eu-west-1", status: "ONLINE", workloadCapacity: 120, activeTasks: 12, latencyMs: 32 },
        ],
        leaderNodeId: "node-eu-west",
        meshDigest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        diagnostics: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerHealing = async () => {
    try {
      setTriggering(true);
      await api.post("/federation/healing/trigger", {
        anomalyId: `anom-${Date.now()}`,
        nodeId: "node-us-east",
        traceText: "Error: ECONNREFUSED endpoint unreachable",
      });
      await fetchMesh();
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    fetchMesh();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium badge-glow">
            <SparklesIcon size="sm" /> v83.0.0 Autonomous Swarm Federation
          </div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tight">
            Swarm Federation &amp; Self-Healing Network
          </h1>
          <p className="text-slate-400 text-xs max-w-2xl">
            P2P node mesh discovery, consensus leader election, and automated self-healing error trace patch generation.
          </p>
        </div>

        <button
          onClick={handleTriggerHealing}
          disabled={triggering}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          <ZapIcon size="sm" />
          {triggering ? "Remediating..." : "Simulate Self-Healing Patch"}
        </button>
      </div>

      {/* Mesh Digest & Consensus Banner */}
      {meshData && (
        <div className="bg-slate-950/90 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-semibold uppercase">P2P Mesh Digest Hash</div>
            <div className="font-mono text-xs text-sky-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 inline-block break-all">
              {meshData.meshDigest}
            </div>
          </div>

          <div className="text-left md:text-right space-y-1">
            <div className="text-xs text-slate-400 font-semibold uppercase">Consensus Leader Node</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {meshData.leaderNodeId || "node-eu-west"} (Elected)
            </div>
          </div>
        </div>
      )}

      {/* Active Nodes Topology Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <LayersIcon className="text-sky-400" />
          <span>Active Swarm Node Topology</span>
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading mesh nodes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meshData?.activeNodes?.map((node) => (
              <div key={node.nodeId} className="card-glass rounded-2xl p-5 space-y-3 hover:border-sky-500/40 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-sky-300 text-sm">{node.nodeId}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                      {node.cluster}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {node.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Capacity</span>
                    <span className="block font-bold text-slate-200">{node.workloadCapacity} tasks</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Active Tasks</span>
                    <span className="block font-bold text-sky-400">{node.activeTasks}</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px]">P2P Latency</span>
                    <span className="block font-bold text-emerald-400">{node.latencyMs} ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diagnostics & Auto-Healing Logs */}
      {meshData?.diagnostics && meshData.diagnostics.length > 0 && (
        <div className="card-glass rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ActivityIcon className="text-emerald-400" />
            <span>Self-Healing Diagnostics &amp; Patch Remediations</span>
          </h2>
          <div className="space-y-3">
            {meshData.diagnostics.map((diag, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-emerald-400 font-bold">Anomaly: {diag.anomalyId}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{diag.timestamp}</span>
                </div>
                <div className="text-slate-300">Root Cause: <span className="font-semibold text-slate-100">{diag.rootCause}</span></div>
                <div className="text-emerald-300 font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  Patch: {diag.recommendedPatch}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
