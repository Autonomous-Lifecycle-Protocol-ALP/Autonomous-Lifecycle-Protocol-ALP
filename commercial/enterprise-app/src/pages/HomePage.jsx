import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiShield,
  FiZap,
  FiCpu,
  FiTrendingUp,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiLock,
  FiGlobe,
} from "react-icons/fi";

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [numAgents, setNumAgents] = useState(15);
  const [hoursSavedPerAgent, setHoursSavedPerAgent] = useState(12);

  const monthlySavings = (numAgents * hoursSavedPerAgent * 85 * 4.3).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const faqs = [
    {
      q: "What is the Autonomous Lifecycle Protocol (ALP)?",
      a: "ALP is an open specification and enterprise orchestration framework designed to declare, coordinate, govern, and audit multi-agent software lifecycles through declarative .alp specifications.",
    },
    {
      q: "How does ALP Enterprise differ from open-source ALP?",
      a: "ALP Enterprise provides unified multi-tenant management, real-time cost governance HUDs, SOC2 audit trails, predictive policy enforcement, zero-trust token delegation, and high-availability swarm clusters.",
    },
    {
      q: "Can ALP integrate with existing CI/CD pipelines and IDEs?",
      a: "Yes! ALP provides native extensions for VS Code, JetBrains, GitHub Actions, GitLab CI, Claude Code, Cursor, and the standalone SHAM IDE desktop application.",
    },
    {
      q: "How does ALP guarantee policy enforcement across autonomous agents?",
      a: "ALP uses deterministic AST validation, cryptographic provenance, and isolated sandbox execution boundaries to ensure agents cannot execute commands or access resources outside their declared permissions.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                <span className="text-white font-extrabold text-sm tracking-wider">ALP</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight leading-none">Enterprise</span>
                <span className="text-[10px] text-sky-400 font-mono">v80.0.0</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
              <a href="#capabilities" className="hover:text-sky-400 transition-colors">Capabilities</a>
              <a href="#roi-calculator" className="hover:text-sky-400 transition-colors">ROI Calculator</a>
              <a href="#security" className="hover:text-sky-400 transition-colors">Security</a>
              <a href="#faq" className="hover:text-sky-400 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium">Sign in</Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-sky-500/25 transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-slate-950/80 to-slate-950 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-semibold tracking-wide uppercase">
                <FiZap className="text-sky-400" /> Autonomous Multi-Agent Protocol
              </div>

              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Orchestrate Software with{" "}
                <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Autonomous Precision
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Build, govern, and scale autonomous multi-agent developer workflows with deterministic DAG verification, predictive policy, and zero-trust auditability.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  to="/login"
                  className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  Start Building Free <FiArrowRight />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 px-8 py-3.5 rounded-xl font-semibold transition-colors"
                >
                  Explore Live Demo
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <FiShield className="text-emerald-400" /> SOC2 Type II Certified
                </div>
                <div className="flex items-center gap-2">
                  <FiLock className="text-sky-400" /> Zero-Trust Architecture
                </div>
                <div className="flex items-center gap-2">
                  <FiGlobe className="text-indigo-400" /> Multi-Cloud &amp; On-Premise
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-purple-400" /> 1,799 Strict Compliance Tests
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Code & Interactive Architecture */}
        <section className="py-16 border-t border-slate-800/80 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">Declarative Lifecycle Architecture</h2>
                <p className="text-slate-300 text-base leading-relaxed">
                  Every step of your software lifecycle is declared in human-readable, machine-verifiable <code className="text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded text-sm">.alp</code> specifications.
                </p>
                <ul className="space-y-3 pt-2">
                  {[
                    "Deterministic topological execution with DAG cycle detection",
                    "Predictive policy drift detection across sandboxed environments",
                    "Cryptographic provenance and tamper-evident event streams",
                    "Self-healing multi-agent swarms with BFT consensus resolution",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                      <FiCheckCircle className="text-sky-400 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-slate-300">workflow.alp</span>
                  </div>
                  <span className="text-sky-400">v80.0.0</span>
                </div>
                <pre className="pt-4 text-slate-300 overflow-x-auto leading-relaxed">
{`!alp-version: 3.0.0

@project
  id: enterprise-commerce-ai
  status: [~]

@policy
  id: policy-zero-trust-deploy
  allow_paths: ["src/**", "deploy/k8s/**"]
  deny_paths: ["secrets/**", "credentials/**"]
  require_approval: true

@agent
  id: agent-autonomous-coder
  role: "Lead Fullstack Architect"

@task
  id: task-build-microservices
  status: [x]
  owner: -> agent-autonomous-coder
  verify:
    - "npm run build"
    - "npm test --run"`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Capabilities */}
        <section id="capabilities" className="py-20 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Enterprise Capabilities</h2>
              <p className="text-slate-400">Built for mission-critical engineering teams and regulated enterprises.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-sky-500/50 transition-all hover:shadow-xl hover:shadow-sky-500/5">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-5 text-sky-400">
                  <FiCpu size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Multi-Agent Swarm Orchestration</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Coordinate dozens of specialized autonomous agents in parallel with topological claim resolution and BFT consensus.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400">
                  <FiShield size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Predictive Policy &amp; Guardrails</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Enforce strict path boundaries, role assignments, and secret segregation before agents execute mutations.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
                  <FiTrendingUp size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Real-Time Cost Governance</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Track token consumption, agent compute budgets, and anomalies in real time with automated circuit breakers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive ROI Calculator */}
        <section id="roi-calculator" className="py-20 border-t border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
                <h2 className="text-3xl font-bold text-white">Autonomous Engineering ROI Calculator</h2>
                <p className="text-slate-400 text-sm">Estimate engineering hours and cost savings with ALP autonomous workflows.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-slate-300">Active AI Agents in Swarm</span>
                      <span className="text-sky-400 font-mono">{numAgents} agents</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="100"
                      value={numAgents}
                      onChange={(e) => setNumAgents(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-slate-300">Hours Saved per Agent Weekly</span>
                      <span className="text-sky-400 font-mono">{hoursSavedPerAgent} hrs / week</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="40"
                      value={hoursSavedPerAgent}
                      onChange={(e) => setHoursSavedPerAgent(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 border border-sky-500/20 rounded-2xl p-8 text-center space-y-3 shadow-inner">
                  <span className="text-xs text-sky-400 uppercase tracking-widest font-semibold">Estimated Monthly Savings</span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white font-mono">{monthlySavings}</div>
                  <p className="text-xs text-slate-400">Based on standard engineering velocity of $85/hr equivalent output.</p>
                  <Link
                    to="/login"
                    className="inline-block mt-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Unlock Savings Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
              <p className="text-slate-400 text-sm">Everything you need to know about ALP Enterprise.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      className="w-full px-6 py-4 text-left flex justify-between items-center text-slate-200 font-semibold text-base hover:text-sky-400 transition-colors"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10">
            <div className="space-y-3 col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">ALP</span>
                </div>
                <span className="text-base font-bold text-white">Enterprise</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous Lifecycle Protocol for high-assurance software and multi-agent systems.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/login" className="hover:text-white">Dashboard</Link></li>
                <li><Link to="/login" className="hover:text-white">SHAM IDE</Link></li>
                <li><Link to="/login" className="hover:text-white">DAG Playground</Link></li>
                <li><Link to="/login" className="hover:text-white">Security Scanner</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Resources</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/login" className="hover:text-white">Documentation</Link></li>
                <li><Link to="/login" className="hover:text-white">API Reference</Link></li>
                <li><Link to="/login" className="hover:text-white">CLI Guides</Link></li>
                <li><Link to="/login" className="hover:text-white">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Trust &amp; Legal</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/login" className="hover:text-white">SOC2 &amp; Compliance</Link></li>
                <li><Link to="/login" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/login" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/login" className="hover:text-white">System Status</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>&copy; 2026 Autonomous Lifecycle Protocol. All rights reserved.</p>
            <p className="font-mono text-[11px] text-slate-400">v80.0.0 · Production Ready</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
