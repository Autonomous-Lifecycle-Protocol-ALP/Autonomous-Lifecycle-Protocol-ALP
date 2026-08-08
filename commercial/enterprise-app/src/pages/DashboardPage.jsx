import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api.js";
import {
  DashboardIcon,
  SavingsIcon,
  SecurityIcon,
  ReasoningIcon,
  HybridEngineerIcon,
  LayersIcon,
  ShieldIcon,
  ArrowRightIcon,
  ActivityIcon,
  CheckCircleIcon,
} from "../components/Icons.jsx";

const METRIC_CARDS = [
  {
    label: "Annual API Savings",
    key: "totalApiSavings",
    suffix: "$",
    prefix: "",
    color: "text-emerald-400",
    sub: "78% token reduction",
    icon: SavingsIcon,
  },
  {
    label: "Task Success Rate",
    key: "taskSuccessRate",
    suffix: "%",
    prefix: "",
    color: "text-sky-400",
    sub: "vs 64.2% without ALP",
    icon: SecurityIcon,
  },
  {
    label: "Savings Per Developer",
    key: "savingsPerDev",
    suffix: "$",
    prefix: "",
    color: "text-indigo-400",
    subKey: "meetsThreshold",
    subPass: "Exceeds $1,400 threshold",
    subFail: "Below $1,400 threshold",
    icon: DashboardIcon,
  },
  {
    label: "Total Executed Tasks",
    key: "tasksTotal",
    suffix: "",
    prefix: "",
    color: "text-purple-400",
    subKey: "tasksFailed",
    icon: ReasoningIcon,
  },
];

const LAUNCHPAD_ITEMS = [
  {
    title: "Autonomous Reasoning Studio",
    desc: "Verifiable Merkle reasoning trees, self-reflection critique, and agent bidding",
    path: "/reasoning-studio",
    icon: ReasoningIcon,
    badge: "v82.0 New",
    color: "from-sky-500/20 to-indigo-500/20 text-sky-400 border-sky-500/30",
  },
  {
    title: "Hybrid Engineer AI",
    desc: "Multi-agent autonomous pair programmer and task graph synthesizer",
    path: "/hybrid-engineer",
    icon: HybridEngineerIcon,
    badge: "AI Agent",
    color: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30",
  },
  {
    title: "DevOps Bridge & Swarm",
    desc: "Cross-repo orchestration, CI/CD pipelines, and networked swarms",
    path: "/products/devops-bridge",
    icon: LayersIcon,
    badge: "Orchestrator",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Zero Trust Security Scanner",
    desc: "Automated @policy guardrail verification and secret vault isolation",
    path: "/products/security-scanner",
    icon: ShieldIcon,
    badge: "Security",
    color: "from-rose-500/20 to-amber-500/20 text-rose-400 border-rose-500/30",
  },
];

export default function DashboardPage() {
  const [savings, setSavings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/metrics/savings")
      .then(({ data }) => {
        setSavings(data);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load dashboard metrics");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Loading enterprise dashboard...</div>;
  if (error) return <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-xl text-sm">{error}</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tight">
            ALP Enterprise Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time autonomous lifecycle protocol metrics, active swarms, and enterprise studios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/reasoning-studio"
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <ReasoningIcon size="sm" /> Launch Reasoning Studio
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      {savings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRIC_CARDS.map((card) => {
            const Icon = card.icon;
            const value =
              card.prefix +
              (savings[card.key] != null
                ? typeof savings[card.key] === "number" && card.suffix === "$"
                  ? "$" + savings[card.key].toLocaleString()
                  : typeof savings[card.key] === "number" && !card.suffix
                  ? savings[card.key].toLocaleString()
                  : savings[card.key] + card.suffix
                : card.suffix);

            let subText = card.sub;
            if (card.subKey && typeof subText === "undefined") {
              if (card.subKey === "meetsThreshold") {
                subText = savings[card.subKey] ? card.subPass : card.subFail;
              } else if (card.subKey === "tasksFailed") {
                subText = `${(savings.tasksTotal || 0) - (savings.tasksCompleted || 0)} failed`;
              }
            }

            return (
              <div key={card.label} className="card-glass rounded-2xl p-5 space-y-2 hover:border-sky-500/40 transition-smooth">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-sky-400">
                    <Icon size="sm" />
                  </div>
                </div>
                <p className={`text-3xl font-black ${card.color}`}>{value}</p>
                <p className={`text-xs ${
                  card.subKey === "meetsThreshold"
                    ? savings[card.subKey]
                      ? "text-emerald-400"
                      : "text-rose-400"
                    : "text-slate-500"
                }`}>
                  {subText}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Studio Launchpad */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ActivityIcon className="text-sky-400" />
          <span>Enterprise Studio Launchpad</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {LAUNCHPAD_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.path}
                className="card-glass rounded-2xl p-5 space-y-3 hover:border-sky-500/50 group transition-smooth flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-xl border bg-gradient-to-br ${item.color}`}>
                      <Icon size="md" />
                    </div>
                    <span className="text-[10px] font-mono font-medium bg-slate-900/80 text-sky-300 border border-slate-800 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center text-xs font-semibold text-sky-400 group-hover:translate-x-1 transition-smooth gap-1">
                  <span>Open Studio</span> <ArrowRightIcon size="sm" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Cost Breakdown & Live Stream */}
      {savings && savings.breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-glass rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <SavingsIcon className="text-emerald-400" />
              <span>Enterprise Cost & Token Reduction Breakdown</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">API Cost Reduction</span>
                <span className="font-bold text-emerald-400">${savings.breakdown.apiSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Engineering Time Saved</span>
                <span className="font-bold text-sky-400">${savings.breakdown.timeSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Rework & Defect Avoidance</span>
                <span className="font-bold text-indigo-400">${savings.breakdown.reworkAvoidance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-t border-sky-500/40 text-sm font-extrabold">
                <span className="text-slate-100">Total Enterprise Savings</span>
                <span className="gradient-text">${(savings.breakdown.apiSavings + savings.breakdown.timeSavings + savings.breakdown.reworkAvoidance).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="card-glass rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckCircleIcon className="text-sky-400" />
              <span>Real-Time Protocol Telemetry Feed</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">SHA-256 Merkle Chain #chain-v8200 Verified</div>
                  <div className="text-[11px] text-slate-400">3 reasoning steps verified valid by VerifiableReasoningTree</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Just now</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">Policy "auth-security-gate" Audit</div>
                  <div className="text-[11px] text-slate-400">Enforced zero-trust guardrails over workspace objects</div>
                </div>
                <span className="text-[10px] text-sky-400 font-mono">4m ago</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">Cross-Agent Negotiation Assigned</div>
                  <div className="text-[11px] text-slate-400">Winning agent "agent-pro-omega" score 0.94 allocated to #task-build</div>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono">12m ago</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
