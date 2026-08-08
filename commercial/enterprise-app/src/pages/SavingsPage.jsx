import { useState, useEffect } from "react";
import api from "../utils/api.js";
import Skeleton from "../components/Skeleton.jsx";

export default function SavingsPage() {
  const [config, setConfig] = useState({
    developers: 20,
    avgSalary: 120000,
    dailyApiSpend: 15,
    dailyContextLoads: 100,
    tasksPerDevPerDay: 3,
  });
  const [result, setResult] = useState(null);
  const [actual, setActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/metrics/savings")
      .then(({ data }) => setActual(data))
      .catch(() => setError("Failed to load savings data"))
      .finally(() => setLoading(false));
  }, []);

  const calculate = () => {
    const { developers, avgSalary, dailyApiSpend, dailyContextLoads, tasksPerDevPerDay } = config;
    const devHourly = avgSalary / 2080;

    const apiSavingsPerDev = dailyApiSpend * 22 * 12 * 0.78;
    const contextTimeSaved = (145 - 1.8) * dailyContextLoads * 22 * 12 / 1000 / 60 / 60;
    const timeSavings = contextTimeSaved * devHourly;
    const failuresAvoided = 0.994 - 0.642;
    const annualTasks = tasksPerDevPerDay * 22 * 12;
    const reworkSavings = failuresAvoided * annualTasks * 3 * devHourly;

    const totalPerDev = apiSavingsPerDev + timeSavings + reworkSavings;
    const totalTeam = totalPerDev * developers;

    setResult({
      perDev: totalPerDev,
      team: totalTeam,
      breakdown: {
        api: apiSavingsPerDev,
        time: timeSavings,
        rework: reworkSavings,
      },
      meetsThreshold: totalPerDev >= 1400,
    });
  };

  useEffect(() => {
    if (!loading) calculate();
  }, [loading, config]);

  const inputClass = "w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800/40 text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Savings Calculator</h1>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {error && <div className="bg-red-900/40 text-red-300 p-4 rounded-lg">{error}</div>}

      {actual && !loading && (
        <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Current Organization Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <span className="text-xs text-gray-500">API Savings</span>
              <span className="block font-bold text-green-400 text-lg">${actual.totalApiSavings?.toLocaleString()}</span>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <span className="text-xs text-gray-500">Task Success Rate</span>
              <span className="block font-bold text-blue-400 text-lg">{actual.taskSuccessRate?.toFixed(1)}%</span>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <span className="text-xs text-gray-500">Savings Per Dev</span>
              <span className="block font-bold text-sky-300 text-lg">${actual.savingsPerDev?.toLocaleString()}</span>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <span className="text-xs text-gray-500">Threshold</span>
              <span className={`block font-bold text-lg ${actual.meetsThreshold ? "text-green-400" : "text-yellow-400"}`}>
                {actual.meetsThreshold ? "PASS" : "REVIEW"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Projection Calculator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400">Number of Developers</label>
            <input type="number" value={config.developers} onChange={(e) => setConfig({...config, developers: +e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Avg Developer Salary</label>
            <input type="number" value={config.avgSalary} onChange={(e) => setConfig({...config, avgSalary: +e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Daily API Spend per Dev</label>
            <input type="number" value={config.dailyApiSpend} onChange={(e) => setConfig({...config, dailyApiSpend: +e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Daily Context Loads</label>
            <input type="number" value={config.dailyContextLoads} onChange={(e) => setConfig({...config, dailyContextLoads: +e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Tasks per Dev per Day</label>
            <input type="number" value={config.tasksPerDevPerDay} onChange={(e) => setConfig({...config, tasksPerDevPerDay: +e.target.value})} className={inputClass} />
          </div>
        </div>
        <button onClick={calculate} className="mt-4 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700">Recalculate</button>
      </div>

      {result && (
        <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Projected Annual Savings</h2>
          <div className={`p-4 rounded-lg mb-4 ${result.meetsThreshold ? "bg-green-900/20 text-green-300" : "bg-yellow-900/20 text-yellow-300"}`}>
            <p className="text-xl font-bold">
              {result.meetsThreshold ? "PASS" : "Review"}: ${result.perDev.toLocaleString()} per developer annually
            </p>
            <p className="text-sm text-gray-400">
              {result.meetsThreshold
                ? "Exceeds the $1,400 savings threshold"
                : "Below the $1,400 threshold - adjust inputs"}
            </p>
          </div>
          <div className="space-y-2 text-gray-300">
            <div className="flex justify-between"><span>Per Developer</span><span className="text-gray-100">${result.perDev.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Team Total ({config.developers} devs)</span><span className="text-gray-100">${result.team.toLocaleString()}</span></div>
            <hr className="border-gray-700" />
            <div className="text-sm text-gray-500">Breakdown:</div>
            <div className="flex justify-between"><span>LLM API Cost Savings</span><span className="text-green-400">${result.breakdown.api.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Time Savings (80x faster context)</span><span className="text-green-400">${result.breakdown.time.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Rework Avoided (35.2% fewer failures)</span><span className="text-green-400">${result.breakdown.rework.toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
