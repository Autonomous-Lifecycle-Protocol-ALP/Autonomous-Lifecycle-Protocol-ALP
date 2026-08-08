import { useState } from "react";
import {
  ActivityIcon,
  CheckCircleIcon,
  AlertIcon,
  ServerIcon,
  GlobeIcon,
  RadioIcon,
  RefreshIcon,
  ZapIcon
} from "../components/Icons.jsx";

const COMPONENTS_STATUS = [
  { name: "ALP Reasoning Core Engine (V85.0.0)", status: "Operational", uptime: "99.99%", latency: "18 ms", icon: ZapIcon },
  { name: "Swarm Federation Mesh & Self-Healing", status: "Operational", uptime: "99.98%", latency: "34 ms", icon: ServerIcon },
  { name: "Zero-Knowledge Policy Verifier", status: "Operational", uptime: "100.00%", latency: "12 ms", icon: ActivityIcon },
  { name: "Polyglot SDK Gateway (TS, Go, Py, RS, JV)", status: "Operational", uptime: "99.95%", latency: "22 ms", icon: RadioIcon },
  { name: "Real-time Telemetry Event Mesh", status: "Operational", uptime: "99.99%", latency: "15 ms", icon: GlobeIcon },
  { name: "Enterprise Database (MongoDB Cluster)", status: "Operational", uptime: "99.99%", latency: "8 ms", icon: ServerIcon },
];

const REGIONAL_NODES = [
  { region: "US East (N. Virginia)", zone: "us-east-1", status: "Healthy", ping: 14 },
  { region: "EU West (Frankfurt)", zone: "eu-west-1", status: "Healthy", ping: 42 },
  { region: "Asia Pacific (Tokyo)", zone: "ap-northeast-1", status: "Healthy", ping: 88 },
  { region: "South America (São Paulo)", zone: "sa-east-1", status: "Healthy", ping: 110 },
];

const INCIDENT_HISTORY = [
  { date: "August 6, 2026", title: "V85.0.0 Zero-Downtime Quantum Compiler Upgrade", status: "Completed", desc: "Successfully deployed V85 quantum circuit compiler with zero dropped telemetry events." },
  { date: "July 28, 2026", title: "Routine Database Maintenance", status: "Completed", desc: "Perform database index optimization and primary node failover validation." },
];

export default function StatusPage() {
  const [nodes, setNodes] = useState(REGIONAL_NODES);
  const [pinging, setPinging] = useState(false);

  const handleTestPings = () => {
    setPinging(true);
    setTimeout(() => {
      setNodes(
        nodes.map((n) => ({
          ...n,
          ping: Math.max(10, n.ping + Math.floor(Math.random() * 9) - 4),
        }))
      );
      setPinging(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Status Banner */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium badge-glow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> All Systems Operational
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          ALP System Status &amp; Real-time Telemetry
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Live operational health, latency metrics across global swarm nodes, and incident history.
        </p>

        <div className="flex justify-center items-center gap-6 pt-2 text-xs font-mono">
          <div>Global Uptime: <span className="text-emerald-400 font-bold">99.98%</span></div>
          <div>Avg Latency: <span className="text-sky-400 font-bold">21 ms</span></div>
          <div>Active Mesh Nodes: <span className="text-indigo-400 font-bold">48 Nodes</span></div>
        </div>
      </div>

      {/* Component Health Grid */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ServerIcon className="text-sky-400" />
              <span>Core Service Components</span>
            </h2>
            <p className="text-xs text-slate-400">Live health monitoring across key protocol subsystems</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
            100% Functional
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMPONENTS_STATUS.map((comp, idx) => {
            const Icon = comp.icon;
            return (
              <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-3 hover:border-emerald-500/40 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
                      <Icon size="sm" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-200">{comp.name}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircleIcon size="sm" /> {comp.status}
                  </span>
                  <div className="text-slate-400 font-mono text-[11px]">
                    {comp.latency} • {comp.uptime}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regional Node Ping Monitor */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <GlobeIcon className="text-indigo-400" />
              <span>Global Mesh Regional Nodes</span>
            </h2>
            <p className="text-xs text-slate-400">Real-time latency metrics across multi-region swarm clusters</p>
          </div>
          <button
            onClick={handleTestPings}
            disabled={pinging}
            className="bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshIcon size="sm" className={pinging ? "animate-spin" : ""} />
            {pinging ? "Pinging..." : "Test Latency"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map((node) => (
            <div key={node.zone} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>{node.region}</span>
                <span className="text-[10px] text-slate-500 font-mono">{node.zone}</span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-emerald-400 font-medium text-[11px]">● {node.status}</span>
                <span className="text-sky-300 font-mono font-bold">{node.ping} ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident History */}
      <div className="card-glass rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ActivityIcon className="text-sky-400" />
          <span>Incident &amp; Upgrade Timeline</span>
        </h2>
        <div className="space-y-3">
          {INCIDENT_HISTORY.map((inc, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>{inc.title}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                  {inc.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{inc.desc}</p>
              <div className="text-[10px] text-slate-500 font-mono pt-1">{inc.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
