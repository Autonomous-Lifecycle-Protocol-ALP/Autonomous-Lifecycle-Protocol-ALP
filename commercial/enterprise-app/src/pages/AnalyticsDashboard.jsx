import { useState, useEffect } from "react";
import api from "../utils/api.js";
import { LuChartColumnBig, LuActivity, LuMousePointerClick, LuEye } from "react-icons/lu";

const EVENT_COLORS = {
  product_view: "text-sky-400",
  product_click: "text-green-400",
  catalog_view: "text-purple-400",
  cta_click: "text-amber-400",
};

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/analytics/summary"),
      api.get("/analytics/events", { params: { limit: 50 } }),
    ])
      .then(([summaryRes, eventsRes]) => {
        setSummary(summaryRes.data);
        setEvents(eventsRes.data.events || []);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load analytics");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading analytics...</div>;
  if (error) return <div className="bg-red-900/40 text-red-300 p-4 rounded-lg">{error}</div>;

  const totalEvents = summary?.topEvents?.reduce((sum, e) => sum + e.count, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-100">Analytics Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <LuActivity className="text-sky-400" size={14} />
          <span>{totalEvents} total events</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary?.topEvents?.slice(0, 4).map((item) => (
          <div key={item._id} className="glass-dark rounded-xl shadow-lg border border-gray-700/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm capitalize">{item._id.replace(/_/g, " ")}</p>
              <div className="p-1.5 bg-gray-800/40 rounded-lg">
              {item._id === "product_view" && <LuEye className="text-sky-400" size={14} />}
              {item._id === "product_click" && <LuMousePointerClick className="text-green-400" size={14} />}
              {item._id === "catalog_view" && <LuChartColumnBig className="text-purple-400" size={14} />}
              {item._id === "cta_click" && <LuActivity className="text-amber-400" size={14} />}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-100">{item.count.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              {totalEvents > 0 ? ((item.count / totalEvents) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-dark rounded-xl shadow-lg border border-gray-700/50">
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <LuChartColumnBig className="text-sky-400" size="md" />
              Top Products
            </h2>
          </div>
          <div className="divide-y divide-gray-700">
            {summary?.topProducts?.length === 0 && (
              <p className="text-gray-500 text-sm p-5">No product events yet.</p>
            )}
            {summary?.topProducts?.map((item, idx) => (
              <div key={item._id} className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-smooth">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm font-mono w-6">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item.productName || item._id}</p>
                    <p className="text-xs text-gray-500">{item._id}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-sky-300">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-dark rounded-xl shadow-lg border border-gray-700/50">
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <LuActivity className="text-green-400" size="md" />
              Recent Events
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-700">
                  <th className="p-4 font-medium">Event</th>
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Path</th>
                  <th className="p-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {events.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-5 text-gray-500 text-center">No events recorded yet.</td>
                  </tr>
                )}
                {events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-gray-800/30 transition-smooth">
                    <td className="p-4">
                      <span className={`capitalize font-medium ${EVENT_COLORS[evt.event] || "text-gray-300"}`}>
                        {evt.event?.replace(/_/g, " ") || evt.event}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{evt.productName || evt.productId || "-"}</td>
                    <td className="p-4 text-gray-500 font-mono text-xs">{evt.path || "-"}</td>
                    <td className="p-4 text-right text-gray-500 text-xs">
                      {evt.ts ? new Date(evt.ts).toLocaleTimeString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
