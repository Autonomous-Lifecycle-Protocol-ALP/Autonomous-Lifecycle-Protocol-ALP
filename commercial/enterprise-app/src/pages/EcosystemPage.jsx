import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LogoIcon,
  ProductsIcon,
  ServerIcon,
  CheckCircleIcon,
  SparklesIcon,
  CodeIcon,
  LayersIcon,
  ArrowRightIcon,
  ShieldIcon,
  ZapIcon
} from "../components/Icons.jsx";

const SDK_LIST = [
  { name: "TypeScript / Node.js", lang: "TypeScript", version: "v82.0.0", status: "Active (Parity 100%)", icon: "TS", install: "npm install @autonomous-lifecycle-protocol/sdk" },
  { name: "Go SDK", lang: "Go", version: "v82.0.0", status: "Active (Parity 100%)", icon: "GO", install: "go get github.com/Autonomous-Lifecycle-Protocol-ALP/sdk/go" },
  { name: "Python SDK", lang: "Python", version: "v82.0.0", status: "Active (Parity 100%)", icon: "PY", install: "pip install alp-sdk" },
  { name: "Rust SDK", lang: "Rust", version: "v82.0.0", status: "Active (Parity 100%)", icon: "RS", install: "cargo add alp-sdk" },
  { name: "Java SDK", lang: "Java", version: "v82.0.0", status: "Active (Parity 100%)", icon: "JV", install: "implementation 'org.alp:sdk:82.0.0'" },
];

const MARKETPLACE_SKILLS = [
  { id: "skill-auth-gate", name: "OAuth2 & RBAC Auth Gate", category: "Security", invocations: 14200, rating: 4.9, author: "ALP Core Team" },
  { id: "skill-merkle-verify", name: "SHA-256 Merkle Trace Validator", category: "Governance", invocations: 28900, rating: 5.0, author: "Reasoning Core" },
  { id: "skill-firmware-gen", name: "STM32/ESP32 Firmware Generator", category: "Physical Eng", invocations: 8400, rating: 4.8, author: "Hybrid Eng" },
  { id: "skill-quantum-vqe", name: "Hybrid VQE Quantum Compiler", category: "Quantum", invocations: 3200, rating: 4.9, author: "Quantum AI" },
];

const MCP_TOOLS = [
  { name: "alp_reason_critique", desc: "Run automated self-reflection critique on spec", status: "Active" },
  { name: "alp_reason_verify", desc: "Validate SHA-256 Merkle reasoning trace integrity", status: "Active" },
  { name: "alp_workspace_create", desc: "Provision sandboxed team workspace", status: "Active" },
  { name: "alp_policy_audit", desc: "Execute zero-trust policy compliance check", status: "Active" },
];

export default function EcosystemPage() {
  const [copiedInstall, setCopiedInstall] = useState(null);

  const handleCopyInstall = (cmd, id) => {
    navigator.clipboard.writeText(cmd);
    setCopiedInstall(id);
    setTimeout(() => setCopiedInstall(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium badge-glow">
          <SparklesIcon size="sm" /> ALP Open-Core Ecosystem Hub
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          Autonomous Swarm Marketplace &amp; Developer Tools
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Polyglot SDKs, 52 Model Context Protocol (MCP) tools, Swarm Marketplace skills, and SHAM Desktop IDE downloads.
        </p>
      </div>

      {/* Polyglot SDK Matrix */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CodeIcon className="text-sky-400" />
              <span>Multi-Language SDK Parity Matrix</span>
            </h2>
            <p className="text-xs text-slate-400">100% feature-parity graph execution, workspace, and event mesh APIs</p>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
            v82.0.0 Synced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SDK_LIST.map((sdk, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-3 hover:border-sky-500/40 transition">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 font-mono font-black text-xs flex items-center justify-center">
                    {sdk.icon}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{sdk.name}</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                  {sdk.version}
                </span>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircleIcon className="text-emerald-400" size="sm" />
                <span>{sdk.status}</span>
              </p>

              {/* Package Install Command Box */}
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                <code className="text-[11px] font-mono text-sky-300 truncate max-w-[200px]">{sdk.install}</code>
                <button
                  onClick={() => handleCopyInstall(sdk.install, idx)}
                  className="text-xs text-slate-400 hover:text-sky-300 transition font-mono"
                >
                  {copiedInstall === idx ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Swarm Marketplace Skills & MCP Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Swarm Marketplace Skills */}
        <div className="card-glass rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ProductsIcon className="text-indigo-400" />
              <span>Swarm Marketplace Top Skills</span>
            </h2>
            <Link to="/products" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
              Browse All <ArrowRightIcon size="sm" />
            </Link>
          </div>

          <div className="space-y-3">
            {MARKETPLACE_SKILLS.map((skill) => (
              <div key={skill.id} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl flex justify-between items-center hover:border-indigo-500/40 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{skill.name}</span>
                    <span className="text-[10px] text-indigo-300 bg-indigo-950/50 border border-indigo-800/50 px-2 py-0.5 rounded font-mono">
                      {skill.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Author: {skill.author}</div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="text-xs font-mono text-emerald-400 font-bold">{skill.invocations.toLocaleString()} runs</div>
                  <div className="text-[10px] text-amber-400 font-semibold">★ {skill.rating} / 5.0</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Context Protocol (MCP) Tools */}
        <div className="card-glass rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <LogoIcon className="text-sky-400" />
              <span>52 Model Context Protocol (MCP) Tools</span>
            </h2>
            <span className="text-xs font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2.5 py-1 rounded-full">
              Claude &amp; Cursor Ready
            </span>
          </div>

          <div className="space-y-3">
            {MCP_TOOLS.map((mcp, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl flex justify-between items-center hover:border-sky-500/40 transition">
                <div className="space-y-0.5">
                  <code className="text-xs font-bold font-mono text-sky-300">{mcp.name}</code>
                  <div className="text-[11px] text-slate-400">{mcp.desc}</div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                  {mcp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SHAM Desktop IDE Download Banner */}
      <div className="card-glass rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs text-indigo-400 font-mono font-bold">
            <ServerIcon size="sm" /> SHAM Desktop Packaging Suite
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100">
            Download Native SHAM IDE Desktop Builds
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Cross-platform desktop application built with Electron, Monaco Editor, CRDT canvas collaboration, and local MCP tool runner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center gap-2">
            <ZapIcon size="sm" /> macOS DMG Build
          </button>
          <button className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2">
            Linux AppImage
          </button>
          <button className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2">
            Windows MSI
          </button>
        </div>
      </div>
    </div>
  );
}
