import { useState, useEffect } from "react";
import api from "../utils/api.js";
import { DashboardIcon, SavingsIcon, SecurityIcon } from "../components/Icons.jsx";

const METRIC_CARDS = [
  {
    label: "Annual API Savings",
    key: "totalApiSavings",
    suffix: "$",
    prefix: "",
    color: "text-green-600",
    sub: "78% token reduction",
    icon: SavingsIcon,
  },
  {
    label: "Task Success Rate",
    key: "taskSuccessRate",
    suffix: "%",
    prefix: "",
    color: "text-blue-600",
    sub: "vs 64.2% without ALP",
    icon: SecurityIcon,
  },
  {
    label: "Savings Per Developer",
    key: "savingsPerDev",
    suffix: "$",
    prefix: "",
    color: "text-primary",
    subKey: "meetsThreshold",
    subPass: "Exceeds $1,400 threshold",
    subFail: "Below $1,400 threshold",
    icon: DashboardIcon,
  },
  {
    label: "Total Tasks",
    key: "tasksTotal",
    suffix: "",
    prefix: "",
    color: "text-purple-600",
    subKey: "tasksFailed",
    icon: SecurityIcon,
  },
];

export default function DashboardPage() {
  const [savings, setSavings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/metrics/savings").then(({ data }) => {
      setSavings(data);
    }).catch((err) => {
      setError(err.response?.data?.error || "Failed to load dashboard data");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading dashboard...</div>;
  if (error) return <div className="bg-red-900/40 text-red-300 p-4 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-100">ALP Enterprise Dashboard</h1>
      </div>

      {savings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRIC_CARDS.map((card) => {
            const Icon = card.icon;
            const value = card.prefix + (savings[card.key] != null ? 
              (typeof savings[card.key] === "number" && card.suffix === "$"
                ? "$" + savings[card.key].toLocaleString()
                : typeof savings[card.key] === "number" && !card.suffix
                ? savings[card.key].toLocaleString()
                : savings[card.key] + card.suffix)
              : card.suffix);

            let subText = card.sub;
            if (card.subKey && typeof subText === "undefined") {
              if (card.subKey === "meetsThreshold") {
                subText = savings[card.subKey] ? card.subPass : card.subFail;
              } else if (card.subKey === "tasksFailed") {
                subText = `${savings.tasksTotal - savings.tasksCompleted} failed`;
              }
            }

            return (
              <div key={card.label} className="glass-dark rounded-xl shadow-lg border border-gray-700/50 animate-pulse-slow">
                <div className="flex items-center justify-between mb-3 p-5">
                  <p className="text-gray-400 text-sm">{card.label}</p>
                  <div className="p-1.5 bg-gray-800/40 rounded-lg">
                    <Icon size="sm" className="text-gray-400" />
                  </div>
                </div>
                <p className={`text-3xl font-bold mb-2 ${card.color}`}>{value}</p>
                <p className={`text-xs mb-5 ${
                  card.subKey === "meetsThreshold"
                    ? (savings[card.subKey] ? "text-green-400" : "text-red-400")
                    : "text-gray-500"
                }`}>
                  {subText}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {savings && savings.breakdown && (
        <div className="glass-dark rounded-xl shadow-lg border border-gray-700/50">
          <h2 className="text-lg font-semibold mb-4 p-5 text-gray-200">Cost Breakdown</h2>
          <div className="space-y-3 p-5 pt-0">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">API Cost Reduction</span>
              <span className="font-medium text-gray-200">${savings.breakdown.apiSavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Time Savings</span>
              <span className="font-medium text-gray-200">${savings.breakdown.timeSavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Rework Avoided</span>
              <span className="font-medium text-gray-200">${savings.breakdown.reworkAvoidance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-sky-500 font-bold text-lg">
              <span>Total Savings</span>
              <span>${(savings.breakdown.apiSavings + savings.breakdown.timeSavings + savings.breakdown.reworkAvoidance).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
