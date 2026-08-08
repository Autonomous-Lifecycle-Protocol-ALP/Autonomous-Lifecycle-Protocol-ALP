import { useState, useEffect } from "react";
import api from "../utils/api.js";
import {
  SparklesIcon,
  ZapIcon,
  ActivityIcon,
  CheckCircleIcon,
  RefreshIcon,
  RadioIcon,
  SlidersIcon,
  SendIcon
} from "../components/Icons.jsx";

export default function NeuromorphicStudioPage() {
  const [meshState, setMeshState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spikeLog, setSpikeLog] = useState([]);
  const [firing, setFiring] = useState(false);
  const [selectedSource, setSelectedSource] = useState("node_sensory_0");
  const [amplitude, setAmplitude] = useState(1.4);

  const fetchMeshState = async () => {
    try {
      const res = await api.get("/neuromorphic/mesh");
      if (res.data?.success) {
        setMeshState(res.data.state);
      }
    } catch {
      // Fallback state if offline
      setMeshState({
        version: "v86.0.0-neuromorphic",
        activeNodes: 4,
        totalSpikesProcessed: 142,
        averageSynapseWeight: 0.78,
        nodes: [
          { id: "node_sensory_0", label: "Spec Parser Sensory Node", threshold: 1.0, membranePotential: 0.4, synapticWeights: { node_cortex_1: 0.88, node_cortex_2: 0.65 } },
          { id: "node_cortex_1", label: "Merkle Trace Reasoning Core", threshold: 1.5, membranePotential: 0.8, synapticWeights: { node_motor_3: 0.92 } },
          { id: "node_cortex_2", label: "Zero-Knowledge Policy Verifier", threshold: 1.2, membranePotential: 0.3, synapticWeights: { node_motor_3: 0.78 } },
          { id: "node_motor_3", label: "Swarm Execution Motor", threshold: 2.0, membranePotential: 1.1, synapticWeights: {} },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeshState();
  }, []);

  const handleTriggerSpike = async () => {
    setFiring(true);
    try {
      const res = await api.post("/neuromorphic/spike", { sourceNodeId: selectedSource, amplitude });
      if (res.data?.success) {
        setMeshState(res.data.meshState);
        setSpikeLog((prev) => [...res.data.firedSpikes, ...prev].slice(0, 15));
      }
    } catch {
      // Fallback local simulation
      const newSpike = { sourceNodeId: selectedSource, targetNodeId: "node_cortex_1", amplitude, timestamp: new Date().toLocaleTimeString() };
      setSpikeLog((prev) => [newSpike, ...prev].slice(0, 15));
    } finally {
      setFiring(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-400 font-mono text-xs">Loading Neuromorphic Mesh...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Banner */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-medium badge-glow">
          <SparklesIcon size="sm" /> Protocol Release V86.0.0
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          Swarm Neuromorphic Reasoning Mesh &amp; Synapse Optimizer
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Spike-timing-dependent plasticity (STDP) neural processing engine for event-driven autonomous reasoning.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-6 pt-2 text-xs font-mono">
          <div>Engine Version: <span className="text-purple-400 font-bold">{meshState?.version}</span></div>
          <div>Active Neural Nodes: <span className="text-sky-400 font-bold">{meshState?.activeNodes}</span></div>
          <div>Total Spikes Fired: <span className="text-emerald-400 font-bold">{meshState?.totalSpikesProcessed}</span></div>
          <div>Avg Synapse Weight: <span className="text-indigo-400 font-bold">{meshState?.averageSynapseWeight}</span></div>
        </div>
      </div>

      {/* Impulse Control & Spike Simulator Bar */}
      <div className="card-glass rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ZapIcon className="text-amber-400" />
              <span>Trigger Spike Impulse</span>
            </h2>
            <p className="text-xs text-slate-400">Inject membrane potential spike into selected neural node</p>
          </div>
          <button
            onClick={fetchMeshState}
            className="text-xs text-slate-400 hover:text-sky-300 font-mono flex items-center gap-1"
          >
            <RefreshIcon size="sm" /> Sync State
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Source Neural Node</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
            >
              {meshState?.nodes?.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Spike Impulse Amplitude ({amplitude} V)</label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={amplitude}
              onChange={(e) => setAmplitude(Number(e.target.value))}
              className="w-full accent-purple-500 bg-slate-950 h-2 rounded-lg cursor-pointer mt-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTriggerSpike}
              disabled={firing}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ZapIcon size="sm" />
              {firing ? "Propagating..." : "Fire Spike Impulse"}
            </button>
          </div>
        </div>
      </div>

      {/* Neural Nodes Mesh Cards */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <RadioIcon className="text-purple-400" />
            <span>Neuromorphic Nodes &amp; Synaptic Weights</span>
          </h2>
          <p className="text-xs text-slate-400">Live membrane potential status and outbound synapse connection weights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meshState?.nodes?.map((node) => {
            const potentialPercent = Math.min(100, Math.round((node.membranePotential / node.threshold) * 100));
            return (
              <div key={node.id} className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-4 hover:border-purple-500/40 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-100">{node.label}</h3>
                    <code className="text-[10px] text-purple-400 font-mono">{node.id}</code>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                    Threshold: {node.threshold} V
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Membrane Potential</span>
                    <span className="text-sky-300 font-bold">{node.membranePotential.toFixed(2)} V ({potentialPercent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${potentialPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-400 font-semibold">Outbound Synapses</div>
                  {Object.keys(node.synapticWeights).length === 0 ? (
                    <div className="text-[10px] text-slate-600 italic">Terminal motor node (no outbound synapses)</div>
                  ) : (
                    Object.entries(node.synapticWeights).map(([target, weight]) => (
                      <div key={target} className="flex justify-between items-center bg-slate-900/60 px-3 py-1.5 rounded-lg text-xs font-mono">
                        <span className="text-slate-300">➜ {target}</span>
                        <span className="text-purple-400 font-bold">Weight: {weight}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spike Event Stream Log */}
      <div className="card-glass rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ActivityIcon className="text-emerald-400" />
          <span>Real-time Spike Cascade Log ({spikeLog.length} Recorded)</span>
        </h2>

        {spikeLog.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            Click &ldquo;Fire Spike Impulse&rdquo; to observe neural cascades.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {spikeLog.map((log, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold">{log.sourceNodeId}</span>
                  <span className="text-slate-500">➜</span>
                  <span className="text-sky-300 font-bold">{log.targetNodeId}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-semibold">Amp: +{log.amplitude}V</span>
                  <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
