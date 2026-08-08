import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { mobileApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "mobile-app");

const MOBILE_FEATURES = [
  { title: "HITL Checkpoint Approval", desc: "Review and approve human-in-the-loop checkpoints directly from your phone", icon: "✓" },
  { title: "Push Notifications", desc: "Real-time alerts for task completions, failures, and swarm events", icon: "🔔" },
  { title: "Swarm Activity Feed", desc: "Scrollable timeline of agent decisions, task transitions, and policy events", icon: "📊" },
  { title: "Agent Performance", desc: "Per-agent and per-team productivity metrics at a glance", icon: "📈" },
  { title: "Offline Mode", desc: "Queue actions offline and sync when connectivity resumes", icon: "📴" },
];

const PLATFORM_SUPPORT = [
  { platform: "iOS", version: "17.0+", devices: "iPhone, iPad" },
  { platform: "Android", version: "13.0+", devices: "Phone, Tablet" },
];

export default function MobileAppPage() {
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await mobileApi.listSessions();
      setSessions(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    setError("");
    try {
      const platform = prompt("Platform (ios/android):") || "ios";
      const deviceId = prompt("Device ID:") || `device-${Date.now()}`;
      await mobileApi.createSession({ platform, deviceId, appVersion: "1.0.0" });
      await loadSessions();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create session");
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await mobileApi.listNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSessions();
    loadNotifications();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">App Sessions</h2>
          <button onClick={createSession} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">Register Session</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadSessions} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {sessions.length === 0 && <p className="text-gray-500 text-sm">No sessions yet.</p>}
          {sessions.map((s) => (
            <div key={s._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{s.platform} • {s.deviceId}</div>
                <div className="text-xs text-gray-500">v{s.appVersion} • {s.pushToken ? "Push enabled" : "No push token"}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(s.lastActiveAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Mobile Features</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {MOBILE_FEATURES.map((feat) => (
            <div key={feat.title} className="border border-gray-700 rounded-lg p-4 flex gap-3">
              <div className="text-2xl flex-shrink-0">{feat.icon}</div>
              <div>
                <h3 className="font-medium text-gray-200">{feat.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Platform Support</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {PLATFORM_SUPPORT.map((p) => (
            <div key={p.platform} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-gray-200">{p.platform}</div>
              <div className="text-sm text-gray-400 mt-1">Version {p.version}</div>
              <div className="text-xs text-gray-500 mt-1">{p.devices}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔔</div>
            <h3 className="font-medium text-gray-200">Smart Notifications</h3>
            <p className="text-sm text-gray-400 mt-1">Intelligent alert grouping with quiet hours and priority-based delivery.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📴</div>
            <h3 className="font-medium text-gray-200">Offline Mode</h3>
            <p className="text-sm text-gray-400 mt-1">Review task history, approve checkpoints, and queue actions without connectivity.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium text-gray-200">Quick Actions</h3>
            <p className="text-sm text-gray-400 mt-1">One-tap commands: /fix, /deploy, /pause for common agent operations.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Use Cases</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">On-Call Engineers</h3>
            <p className="text-sm text-gray-400 mt-1">Approve critical deployments and respond to incidents from anywhere.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Engineering Managers</h3>
            <p className="text-sm text-gray-400 mt-1">Monitor team swarm activity and agent performance on the go.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Executive Oversight</h3>
            <p className="text-sm text-gray-400 mt-1">High-level dashboard of project health, ROI, and agent productivity.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Compliance Officers</h3>
            <p className="text-sm text-gray-400 mt-1">Review audit trails and approval chains for regulatory compliance.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">5,000+</div>
            <div className="text-xs text-gray-400 mt-1">Downloads in 60 Days</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">30%</div>
            <div className="text-xs text-gray-400 mt-1">Day-7 Retention</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;1s</div>
            <div className="text-xs text-gray-400 mt-1">Notification Delivery</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">4.5+</div>
            <div className="text-xs text-gray-400 mt-1">App Store Rating</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}
