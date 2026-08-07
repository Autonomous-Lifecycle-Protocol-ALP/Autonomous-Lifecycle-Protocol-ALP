import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col text-gray-100">
      <nav className="glass-dark border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ALP</span>
              </div>
              <span className="text-xl font-bold text-gray-100">Enterprise</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium">Sign in</Link>
              <Link to="/login" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">Autonomous Lifecycle Protocol</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
                Build, deploy, and manage AI-native applications with enterprise-grade governance, predictive policy, and autonomous operations.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link to="/login" className="bg-sky-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sky-700 transition-colors">Start Building</Link>
                <Link to="/login" className="glass-dark border border-gray-600 text-gray-200 px-6 py-3 rounded-lg font-medium hover:border-gray-500 transition-colors">View Demo</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-dark p-6 rounded-xl border border-gray-800">
                <div className="w-10 h-10 rounded-lg bg-sky-900/50 flex items-center justify-center mb-4 text-sky-300">🧠</div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Predictive Policy</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Proactive guardrails that predict drift before it happens. Enforce standards across code, config, and runtime behavior.</p>
              </div>
              <div className="glass-dark p-6 rounded-xl border border-gray-800">
                <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center mb-4 text-indigo-300">⚡</div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Autonomous Operations</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Self-healing systems that detect, diagnose, and resolve issues with minimal human intervention.</p>
              </div>
              <div className="glass-dark p-6 rounded-xl border border-gray-800">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center mb-4 text-emerald-300">🛡️</div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Enterprise Security</h3>
                <p className="text-gray-400 text-sm leading-relaxed">SOC2-ready audit trails, role-based access, and end-to-end encryption for regulated environments.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-100">Platform Capabilities</h2>
              <p className="mt-4 text-gray-400 max-w-2xl mx-auto">Everything you need to ship AI features with confidence.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                ["Multi-Agent Orchestration", "Coordinate autonomous agents across distributed systems."],
                ["Event-Driven Memory", "Persistent, queryable event logs for every lifecycle stage."],
                ["Cost Governance", "Real-time budget controls and anomaly detection."],
                ["Hybrid Engineer AI", "AI-assisted development with full workspace awareness."],
              ].map(([title, desc]) => (
                <div key={title} className="glass-dark p-5 rounded-xl border border-gray-800">
                  <h4 className="text-gray-100 font-medium mb-1">{title}</h4>
                  <p className="text-gray-400 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-indigo-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">ALP</span>
            </div>
            <span className="text-sm text-gray-400">Enterprise</span>
          </div>
          <p className="text-sm text-gray-500">ALP Enterprise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
