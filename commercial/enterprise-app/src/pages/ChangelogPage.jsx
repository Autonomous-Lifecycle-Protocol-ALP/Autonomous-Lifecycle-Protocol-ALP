import { useState } from "react";
import {
  SparklesIcon,
} from "../components/Icons.jsx";
import { LuChevronDown, LuChevronRight, LuTag, LuCalendar, LuGitBranch } from "react-icons/lu";

const RELEASES = [
  {
    version: "85.0.0",
    date: "August 8, 2026",
    tag: "latest",
    title: "Swarm Neuromorphic Mesh & ZK Policy Engine",
    summary: "Major release introducing neuromorphic computing primitives, zero-knowledge proof policy engine, and enhanced swarm federation capabilities.",
    breaking: [
      "Swarm mesh protocol v3 is now required — v2 endpoints deprecated",
      "API key format changed to `alp_live_*` prefix — regenerate keys in Settings",
    ],
    features: [
      "Neuromorphic Mesh Studio with real-time spike-train visualization",
      "ZK Policy Proofs — cryptographic verification of governance compliance",
      "Multi-region federation hub with latency-optimized routing",
      "Downloads Center with SHA-256 verified installers and SDK packages",
      "Marketplace with 50+ pre-built agents, skills, and protocol extensions",
      "System Status dashboard with real-time infrastructure health monitoring",
      "API Explorer with interactive request builder and live response viewer",
    ],
    fixes: [
      "Fixed workspace sync race condition during multi-agent collaboration",
      "Resolved memory leak in Reasoning Studio's chain-of-thought renderer",
      "Fixed CORS headers for cross-origin SDK requests",
    ],
    performance: [
      "40% faster Merkle tree commit pipeline via parallelized hashing",
      "Reduced dashboard cold-start by 2.3s with lazy-loaded analytics widgets",
      "Agent Studio execution latency improved by 18% with batched tool calls",
    ],
  },
  {
    version: "84.2.1",
    date: "July 28, 2026",
    tag: "stable",
    title: "Hybrid Engineer AI & Analytics BI Enhancements",
    summary: "Introduced the Hybrid Engineer AI multi-modal agent and enhanced BI analytics with real-time revenue dashboards.",
    breaking: [],
    features: [
      "Hybrid Engineer AI — multi-modal agent for hardware + software co-design",
      "Analytics BI page with interactive revenue, retention, and MRR charts",
      "Team & Governance page with RBAC role management and audit trails",
      "Settings page with API key generation, protocol config, and 2FA setup",
      "Enhanced product cards with download buttons and version badges",
    ],
    fixes: [
      "Fixed billing subscription downgrade workflow edge case",
      "Resolved IDE terminal not scrolling to latest output",
      "Fixed workspace creation failing silently on duplicate names",
    ],
    performance: [
      "25% reduction in bundle size via improved tree-shaking",
      "WebSocket reconnection logic improved for flaky connections",
    ],
  },
  {
    version: "84.1.0",
    date: "July 15, 2026",
    tag: "stable",
    title: "IDE Overhaul & Product Portfolio Expansion",
    summary: "Complete IDE rebuild with multi-file editor, integrated terminal, and MCP tool runner. Added 8 new product pages.",
    breaking: [],
    features: [
      "Full IDE overhaul with file tree, tabbed editor, and syntax highlighting",
      "Integrated terminal with command execution and live output",
      "MCP Tool Runner panel — execute reasoning tools directly in IDE",
      "Quantum Engineer page with circuit composer and qubit topology",
      "Chip Design Studio with RTL visualization and synthesis pipeline",
      "SOC Sentinel — 24/7 security operations center dashboard",
      "Threat Intel page with MITRE ATT&CK mapping and IOC feeds",
      "Zero Trust Architecture — micro-segmentation and policy engine",
    ],
    fixes: [
      "Fixed Reasoning Studio critique mode not displaying confidence scores",
      "Resolved product detail page 404 on slug-based routes",
    ],
    performance: [
      "Code editor rendering improved by 35% with virtualized line rendering",
    ],
  },
  {
    version: "84.0.0",
    date: "July 1, 2026",
    tag: "stable",
    title: "Reasoning Studio & Ecosystem Hub Launch",
    summary: "Launched the flagship Reasoning Studio with multi-strategy analysis and the Ecosystem Hub connecting all ALP platform tools.",
    breaking: [
      "Authentication tokens now expire after 24h (previously 7d) for security",
    ],
    features: [
      "Reasoning Studio with Chain-of-Thought, Critique, Synthesis, and Verify modes",
      "Ecosystem Hub — unified portal for all ALP tools and services",
      "Federation Studio for cross-organization swarm orchestration",
      "Enhanced Dashboard with real-time agent metrics and health indicators",
      "Docs page with searchable API reference and integration guides",
    ],
    fixes: [
      "Fixed workspace listing pagination for orgs with 100+ workspaces",
      "Resolved notification center not marking items as read",
    ],
    performance: [
      "Dashboard initial load reduced from 4.1s to 1.8s",
      "Agent telemetry data streaming optimized with delta compression",
    ],
  },
  {
    version: "83.5.0",
    date: "June 15, 2026",
    tag: "archived",
    title: "Business Model Canvas & Savings Calculator",
    summary: "Added strategic planning tools including the interactive business model canvas and ROI savings calculator.",
    breaking: [],
    features: [
      "Business Model Canvas with drag-and-drop strategic blocks",
      "Savings Calculator with multi-year ROI projections",
      "Billing & Subscription management with Stripe integration",
      "DevOps Bridge for CI/CD pipeline integration",
      "Model Hub with fine-tuning and A/B testing capabilities",
    ],
    fixes: [
      "Fixed login redirect loop on expired sessions",
      "Resolved chart rendering glitch on Firefox",
    ],
    performance: [],
  },
];

const TAG_STYLES = {
  latest: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  stable: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  archived: "bg-slate-700/50 text-slate-400 border-slate-600/40",
};

function ReleaseCard({ release, defaultOpen }) {
  const [expanded, setExpanded] = useState(defaultOpen);

  const sections = [
    { key: "breaking", label: "Breaking Changes", icon: "🚨", items: release.breaking, color: "text-rose-400" },
    { key: "features", label: "New Features", icon: "✨", items: release.features, color: "text-emerald-400" },
    { key: "fixes", label: "Bug Fixes", icon: "🐛", items: release.fixes, color: "text-amber-400" },
    { key: "performance", label: "Performance", icon: "⚡", items: release.performance, color: "text-sky-400" },
  ].filter(s => s.items && s.items.length > 0);

  return (
    <div className="relative group">
      {/* Timeline connector */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-sky-500/40 via-indigo-500/20 to-transparent hidden md:block" />

      <div className="flex gap-4 md:gap-6">
        {/* Timeline dot */}
        <div className="hidden md:flex flex-col items-center pt-6 flex-shrink-0">
          <div className={`w-3 h-3 rounded-full border-2 z-10 ${
            release.tag === "latest"
              ? "bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-500/40"
              : release.tag === "stable"
              ? "bg-sky-400 border-sky-400"
              : "bg-slate-600 border-slate-600"
          }`} />
        </div>

        {/* Card */}
        <div className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-300 mb-4">
          {/* Header */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-lg font-bold text-white font-mono">v{release.version}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${TAG_STYLES[release.tag]}`}>
                  {release.tag}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <LuCalendar className="w-3 h-3" />
                  {release.date}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200">{release.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{release.summary}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
                {release.features.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-400">✦</span> {release.features.length} features
                  </span>
                )}
                {release.fixes.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-amber-400">●</span> {release.fixes.length} fixes
                  </span>
                )}
              </div>
              <div className="text-slate-500">
                {expanded ? <LuChevronDown className="w-4 h-4" /> : <LuChevronRight className="w-4 h-4" />}
              </div>
            </div>
          </button>

          {/* Expandable body */}
          {expanded && (
            <div className="border-t border-slate-800/60 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {sections.map(section => (
                <div key={section.key}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${section.color}`}>
                    <span>{section.icon}</span>
                    {section.label}
                    <span className="text-slate-600 font-mono text-[10px]">({section.items.length})</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${
                          section.key === "breaking" ? "bg-rose-400" :
                          section.key === "features" ? "bg-emerald-400" :
                          section.key === "fixes" ? "bg-amber-400" : "bg-sky-400"
                        }`} />
                        {section.key === "breaking" ? (
                          <span className="text-rose-300/90">{item}</span>
                        ) : (
                          item
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Footer links */}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-800/40">
                <button className="flex items-center gap-1.5 text-[11px] text-sky-400 hover:text-sky-300 transition-colors font-medium">
                  <LuGitBranch className="w-3 h-3" />
                  View Commits
                </button>
                <button className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-300 transition-colors font-medium">
                  <LuTag className="w-3 h-3" />
                  Release Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChangelogPage() {
  const [filter, setFilter] = useState("all");
  const filteredReleases = filter === "all" ? RELEASES : RELEASES.filter(r => r.tag === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-sky-400 font-mono font-semibold tracking-widest uppercase mb-2">
            <LuGitBranch className="w-3.5 h-3.5" />
            Release History
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Changelog
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track every release, feature, and improvement to the ALP Enterprise platform.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1">
          {[
            { key: "all", label: "All" },
            { key: "latest", label: "Latest" },
            { key: "stable", label: "Stable" },
            { key: "archived", label: "Archived" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.key
                  ? "bg-sky-500/20 text-sky-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Releases", value: RELEASES.length, color: "from-sky-500/20 to-indigo-500/20", border: "border-sky-500/30" },
          { label: "Total Features", value: RELEASES.reduce((a, r) => a + r.features.length, 0), color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30" },
          { label: "Bugs Fixed", value: RELEASES.reduce((a, r) => a + r.fixes.length, 0), color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30" },
          { label: "Breaking Changes", value: RELEASES.reduce((a, r) => a + r.breaking.length, 0), color: "from-rose-500/20 to-pink-500/20", border: "border-rose-500/30" },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-xl p-3 text-center`}>
            <div className="text-lg font-black text-white">{stat.value}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Release timeline */}
      <div className="space-y-2">
        {filteredReleases.map((release, i) => (
          <ReleaseCard key={release.version} release={release} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Subscribe for updates */}
      <div className="bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 rounded-2xl p-6 text-center">
        <SparklesIcon className="w-6 h-6 text-sky-400 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-white mb-1">Stay Updated</h3>
        <p className="text-xs text-slate-400 mb-4">Subscribe to release notifications to stay informed about new features and improvements.</p>
        <div className="flex items-center gap-2 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
          />
          <button className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-sky-500/20 transition-all">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
