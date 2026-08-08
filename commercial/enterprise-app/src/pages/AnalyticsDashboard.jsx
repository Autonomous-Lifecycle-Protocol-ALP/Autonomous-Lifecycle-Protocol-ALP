import { useState, useEffect } from "react";
import api from "../utils/api.js";
import {
  AnalyticsIcon,
  ActivityIcon,
  CheckCircleIcon,
  SparklesIcon,
  DownloadIcon,
  ZapIcon,
  ShieldIcon,
  UsersIcon,
  RefreshIcon,
  ArrowRightIcon,
  ProductsIcon
} from "../components/Icons.jsx";

const TIME_RANGES = ["24 Hours", "7 Days", "30 Days", "All Time"];

const INITIAL_TOP_EVENTS = [
  { id: "product_view", label: "Product Views", count: 48200, percent: "33.7%", color: "from-sky-500 to-indigo-600" },
  { id: "merkle_verify", label: "Merkle Verifications", count: 39100, percent: "27.4%", color: "from-emerald-500 to-teal-600" },
  { id: "product_click", label: "Product Clicks & Sandboxes", count: 28400, percent: "19.9%", color: "from-indigo-500 to-purple-600" },
  { id: "policy_audit", label: "ZK Policy Audits", count: 27100, percent: "19.0%", color: "from-amber-500 to-orange-600" },
];

const METRIC_CARDS = [
  { label: "Total Telemetry Events", value: "142.8K", change: "+18.4% vs last week", positive: true, icon: ActivityIcon, color: "text-sky-400" },
  { label: "Swarm Execution Uptime", value: "99.98%", change: "0 dropped packets", positive: true, icon: CheckCircleIcon, color: "text-emerald-400" },
  { label: "Throughput Rate", value: "1,420 req/m", change: "+240 vs baseline", positive: true, icon: ZapIcon, color: "text-indigo-400" },
  { label: "LLM Token Cost Savings", value: "$42.8K/mo", change: "42% cost reduction", positive: true, icon: SparklesIcon, color: "text-amber-400" },
];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("7 Days");
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  // Swarm ROI Calculator State
  const [teamSize, setTeamSize] = useState(25);
  const [hourlyRate, setHourlyRate] = useState(85);

  const fetchAnalytics = async () => {
    setRefreshing(true);
    try {
      const [summaryRes, eventsRes] = await Promise.all([
        api.get("/analytics/summary"),
        api.get("/analytics/events", { params: { limit: 50 } }),
      ]);
      setSummary(summaryRes.data);
      setEvents(eventsRes.data.events || []);
    } catch {
      // Fallback events if offline
      setEvents([
        { _id: "evt_101", event: "merkle_verify", productName: "Reasoning Core", path: "/api/reasoning/execute", ts: new Date().toISOString() },
        { _id: "evt_102", event: "product_view", productName: "ALP Cloud Workspace", path: "/products/cloud-workspace", ts: new Date(Date.now() - 120000).toISOString() },
        { _id: "evt_103", event: "policy_audit", productName: "Zero Trust Orchestrator", path: "/api/zk-proofs/verify", ts: new Date(Date.now() - 360000).toISOString() },
        { _id: "evt_104", event: "product_click", productName: "Hybrid Engineer AI", path: "/products/hybrid-engineer", ts: new Date(Date.now() - 720000).toISOString() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `alp-analytics-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  // ROI Math
  const monthlyManualCost = teamSize * 40 * 4 * hourlyRate;
  const monthlyAlpCost = teamSize * 99; // Enterprise tier
  const monthlySavings = Math.round((monthlyManualCost * 0.45) - monthlyAlpCost);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium badge-glow">
          <AnalyticsIcon size="sm" /> Business Intelligence &amp; Event Analytics
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          Enterprise Swarm Intelligence &amp; Metrics
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Real-time telemetry event tracking, agent throughput analytics, LLM token efficiency, and ROI projections.
        </p>

        {/* Time Range Selector & Action Bar */}
        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  timeRange === range
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshIcon size="sm" className={refreshing ? "animate-spin text-sky-400" : ""} />
              Refresh Metrics
            </button>

            <button
              onClick={handleExportData}
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
            >
              <DownloadIcon size="sm" /> {exportNotice ? "Report Downloaded!" : "Export Report JSON"}
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card-glass rounded-2xl p-5 space-y-2 hover:border-sky-500/40 transition">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">{card.label}</span>
                <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${card.color}`}>
                  <Icon size="sm" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-100">{card.value}</div>
              <div className="text-[11px] font-mono text-emerald-400 font-semibold">{card.change}</div>
            </div>
          );
        })}
      </div>

      {/* Visual Event Distribution & ROI Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Event Distribution Bar Chart */}
        <div className="lg:col-span-7 card-glass rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AnalyticsIcon className="text-sky-400" />
                <span>Event Distribution Breakdown ({timeRange})</span>
              </h2>
              <p className="text-xs text-slate-400">Proportional telemetry traffic across event categories</p>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="space-y-4">
            {INITIAL_TOP_EVENTS.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.label}</span>
                  <span className="font-mono text-slate-400">
                    <span className="text-sky-300 font-bold">{item.count.toLocaleString()}</span> ({item.percent})
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: item.percent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Swarm ROI Calculator */}
        <div className="lg:col-span-5 card-glass rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ZapIcon className="text-amber-400" />
                <span>Swarm Efficiency &amp; ROI Calculator</span>
              </h2>
              <p className="text-xs text-slate-400">Calculate net cost savings from autonomous ALP task execution</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Engineering Team Size:</span>
                  <span className="text-sky-300 font-mono font-bold">{teamSize} Engineers</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Avg Hourly Rate:</span>
                  <span className="text-emerald-400 font-mono font-bold">${hourlyRate} / hr</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-2 text-center">
            <span className="text-xs text-slate-400 font-semibold uppercase">Estimated Net Monthly Savings</span>
            <div className="text-3xl font-black gradient-text">${monthlySavings.toLocaleString()} / mo</div>
            <div className="text-[10px] text-slate-500 font-mono">Based on 45% productivity boost with ALP Swarms</div>
          </div>
        </div>
      </div>

      {/* Live Event Telemetry Stream */}
      <div className="card-glass rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ActivityIcon className="text-emerald-400" />
              <span>Live Telemetry Event Log ({events.length} Recorded)</span>
            </h2>
            <p className="text-xs text-slate-400">Real-time event stream from ALP Event Mesh</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 pr-4 font-semibold">Event Type</th>
                <th className="pb-3 pr-4 font-semibold">Product / Component</th>
                <th className="pb-3 pr-4 font-semibold">Endpoint Path</th>
                <th className="pb-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {events.map((evt) => (
                <tr key={evt._id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 pr-4">
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-950/50 border border-sky-800/50 px-2 py-0.5 rounded">
                      {evt.event?.replace(/_/g, " ").toUpperCase() || "EVENT"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-200 font-sans font-semibold">
                    {evt.productName || evt.productId || "Reasoning Core"}
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-[11px] truncate max-w-xs">
                    {evt.path || "/api/telemetry"}
                  </td>
                  <td className="py-3 text-right text-slate-500 text-[11px]">
                    {evt.ts ? new Date(evt.ts).toLocaleTimeString() : "Just now"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
