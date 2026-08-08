import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DownloadIcon,
  DownloadCloudIcon,
  PackageIcon,
  MonitorIcon,
  SmartphoneIcon,
  HardDriveIcon,
  ExternalLinkIcon,
  SparklesIcon,
  ServerIcon,
  CodeIcon,
  ShieldIcon,
  LayersIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ZapIcon,
  TerminalIcon,
  SecurityIcon,
} from "../components/Icons.jsx";
import { LuApple, LuContainer } from "react-icons/lu";

/* ───────────── data ───────────── */

const DESKTOP_BUILDS = [
  {
    id: "macos",
    platform: "macOS",
    arch: "Universal (ARM64 + x86_64)",
    filename: "SHAM-IDE-v85.0.0-universal.dmg",
    size: "182 MB",
    icon: LuApple,
    primary: true,
    sha256: "a3f8c1…d94e2b",
    minOS: "macOS 13 Ventura+",
  },
  {
    id: "windows",
    platform: "Windows",
    arch: "x64",
    filename: "SHAM-IDE-v85.0.0-x64.msi",
    size: "168 MB",
    icon: MonitorIcon,
    primary: false,
    sha256: "e7b2a0…f18c3d",
    minOS: "Windows 10 21H2+",
  },
  {
    id: "linux-appimage",
    platform: "Linux AppImage",
    arch: "x86_64",
    filename: "SHAM-IDE-v85.0.0-x86_64.AppImage",
    size: "174 MB",
    icon: TerminalIcon,
    primary: false,
    sha256: "c2d9e4…a07b16",
    minOS: "Ubuntu 22.04 / Fedora 38+",
  },
  {
    id: "linux-deb",
    platform: "Linux .deb",
    arch: "amd64",
    filename: "sham-ide_85.0.0_amd64.deb",
    size: "171 MB",
    icon: TerminalIcon,
    primary: false,
    sha256: "f1a8b3…c52d07",
    minOS: "Debian 12 / Ubuntu 22.04+",
  },
];

const CLI_TOOLS = [
  {
    id: "alp-cli",
    name: "ALP CLI",
    description: "Core command-line interface for parsing, validating, and executing .alp specs",
    version: "v85.0.0",
    installs: [
      { method: "npm", command: "npm install -g @alp/cli" },
      { method: "brew", command: "brew install alp-protocol/tap/alp-cli" },
      { method: "curl", command: "curl -fsSL https://get.alp-protocol.dev | bash" },
    ],
  },
  {
    id: "alp-mcp",
    name: "ALP MCP Server",
    description: "Model Context Protocol server for Claude, Cursor, and VS Code integrations",
    version: "v85.0.0",
    installs: [
      { method: "npm", command: "npm install -g @alp/mcp-server" },
      { method: "npx", command: "npx @alp/mcp-server --init" },
    ],
  },
  {
    id: "alp-docker",
    name: "ALP Docker Runtime",
    description: "Pre-configured Docker image with ALP engine, MCP tools, and dev dependencies",
    version: "v85.0.0",
    installs: [
      { method: "docker", command: "docker pull ghcr.io/alp-protocol/runtime:v85" },
      { method: "compose", command: "curl -fsSL https://alp-protocol.dev/docker-compose.yml | docker compose up" },
    ],
  },
];

const SDK_DOWNLOADS = [
  { lang: "TypeScript / Node.js", icon: "TS", command: "npm install @autonomous-lifecycle-protocol/sdk", version: "v85.0.0", size: "2.4 MB" },
  { lang: "Go", icon: "GO", command: "go get github.com/Autonomous-Lifecycle-Protocol-ALP/sdk/go@v85", version: "v85.0.0", size: "8.1 MB" },
  { lang: "Python", icon: "PY", command: "pip install alp-sdk==85.0.0", version: "v85.0.0", size: "3.7 MB" },
  { lang: "Rust", icon: "RS", command: "cargo add alp-sdk@85.0.0", version: "v85.0.0", size: "5.2 MB" },
  { lang: "Java", icon: "JV", command: "implementation 'org.alp:sdk:85.0.0'", version: "v85.0.0", size: "6.9 MB" },
];

const PRODUCT_DOWNLOADS = [
  { id: "cloud-workspace", name: "ALP Cloud Workspace", type: "SaaS", action: "Launch", actionType: "link", path: "/products/cloud-workspace" },
  { id: "mobile-app", name: "ALP Mobile App", type: "Mobile", action: "App Store / APK", actionType: "download", files: ["ALP-Mobile-v85-ios.ipa", "ALP-Mobile-v85-android.apk"] },
  { id: "agent-studio", name: "ALP Agent Studio", type: "Platform", action: "Launch", actionType: "link", path: "/products/agent-studio" },
  { id: "security-scanner", name: "ALP Security Scanner", type: "CLI + SaaS", action: "Install CLI", actionType: "cli", command: "npm install -g @alp/security-scanner" },
  { id: "analytics-bi", name: "ALP Analytics & BI", type: "SaaS", action: "Launch", actionType: "link", path: "/products/analytics-bi" },
  { id: "devops-bridge", name: "ALP DevOps Bridge", type: "CLI Plugin", action: "Install Plugin", actionType: "cli", command: "npm install -g @alp/devops-bridge" },
  { id: "model-hub", name: "ALP AI Model Hub", type: "Marketplace", action: "Browse", actionType: "link", path: "/products/model-hub" },
  { id: "data-pipeline-studio", name: "ALP Data Pipeline Studio", type: "Platform", action: "Launch", actionType: "link", path: "/products/data-pipeline-studio" },
  { id: "hybrid-engineer", name: "ALP Hybrid Engineer AI", type: "Agent", action: "Launch", actionType: "link", path: "/products/hybrid-engineer" },
  { id: "quantum-engineer", name: "ALP Quantum Engineering AI", type: "Agent", action: "Launch", actionType: "link", path: "/products/quantum-engineer" },
  { id: "chip-design-studio", name: "ALP Chip Design Studio", type: "EDA Platform", action: "Launch", actionType: "link", path: "/products/chip-design-studio" },
  { id: "soc-sentinel", name: "ALP SOC Sentinel AI", type: "Security Ops", action: "Launch", actionType: "link", path: "/products/soc-sentinel" },
  { id: "threat-intel", name: "ALP Threat Intelligence", type: "Agent", action: "Launch", actionType: "link", path: "/products/threat-intel" },
  { id: "zero-trust", name: "ALP Zero Trust Orchestrator", type: "Network Security", action: "Launch", actionType: "link", path: "/products/zero-trust" },
];

/* ───────────── component ───────────── */

export default function DownloadsPage() {
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [activeCliTab, setActiveCliTab] = useState({});
  const [downloadStarted, setDownloadStarted] = useState({});

  const copyCommand = (cmd, id) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const simulateDownload = (id, filename) => {
    setDownloadStarted((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setDownloadStarted((prev) => ({ ...prev, [id]: false })), 3000);
  };

  const getActiveInstall = (toolId, installs) => {
    const idx = activeCliTab[toolId] || 0;
    return installs[idx];
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* ── Hero Header ── */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium badge-glow">
          <SparklesIcon size="sm" /> Downloads & Installation Center
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          Download ALP Platform & Products
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Desktop IDE, CLI tools, polyglot SDKs, Docker images, and all 14 commercial product downloads in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <span className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full font-mono font-semibold">
            Latest: v85.0.0
          </span>
          <span className="text-[11px] text-sky-400 bg-sky-950/40 border border-sky-800/40 px-3 py-1 rounded-full font-mono font-semibold">
            5 Polyglot SDKs
          </span>
          <span className="text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-3 py-1 rounded-full font-mono font-semibold">
            14 Products
          </span>
        </div>
      </div>

      {/* ── SHAM Desktop IDE Downloads ── */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <MonitorIcon className="text-sky-400" />
              <span>SHAM Desktop IDE</span>
            </h2>
            <p className="text-xs text-slate-400">Cross-platform desktop IDE with Monaco Editor, CRDT collaboration, and local MCP runner</p>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
            v85.0.0 — Stable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DESKTOP_BUILDS.map((build) => {
            const IconComp = build.icon;
            const isRaw = build.icon === LuApple;
            return (
              <div
                key={build.id}
                className={`bg-slate-950/80 border rounded-2xl p-5 space-y-4 transition hover:border-sky-500/40 ${
                  build.primary ? "border-sky-500/30 ring-1 ring-sky-500/10" : "border-slate-800/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${build.primary ? "bg-sky-950/60 border-sky-500/30 text-sky-400" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
                      {isRaw ? <IconComp size={20} /> : <IconComp size="md" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{build.platform}</h3>
                      <p className="text-[11px] text-slate-400">{build.arch}</p>
                    </div>
                  </div>
                  {build.primary && (
                    <span className="text-[10px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Filename</span>
                    <code className="text-sky-300 font-mono">{build.filename}</code>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Size</span>
                    <span className="text-slate-300">{build.size}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Min OS</span>
                    <span className="text-slate-300">{build.minOS}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SHA-256</span>
                    <code className="text-slate-500 font-mono">{build.sha256}</code>
                  </div>
                </div>

                <button
                  onClick={() => simulateDownload(build.id, build.filename)}
                  className={`w-full text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                    downloadStarted[build.id]
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : build.primary
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800"
                  }`}
                >
                  {downloadStarted[build.id] ? (
                    <>
                      <CheckCircleIcon size="sm" /> Download Started
                    </>
                  ) : (
                    <>
                      <DownloadIcon size="sm" /> Download {build.platform}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CLI Tools & Docker ── */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <TerminalIcon className="text-emerald-400" />
            <span>CLI Tools & Docker Images</span>
          </h2>
          <p className="text-xs text-slate-400">Install via package managers, shell scripts, or Docker</p>
        </div>

        <div className="space-y-4">
          {CLI_TOOLS.map((tool) => {
            const active = getActiveInstall(tool.id, tool.installs);
            const activeIdx = activeCliTab[tool.id] || 0;
            return (
              <div key={tool.id} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-emerald-500/30 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {tool.id === "alp-docker" ? <LuContainer size={14} className="text-sky-400" /> : <TerminalIcon size="sm" className="text-emerald-400" />}
                      {tool.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">{tool.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {tool.version}
                  </span>
                </div>

                {/* Method Tabs */}
                <div className="flex items-center gap-1.5">
                  {tool.installs.map((inst, idx) => (
                    <button
                      key={inst.method}
                      onClick={() => setActiveCliTab((prev) => ({ ...prev, [tool.id]: idx }))}
                      className={`px-3 py-1 text-[11px] font-mono font-semibold rounded-lg transition ${
                        activeIdx === idx
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {inst.method}
                    </button>
                  ))}
                </div>

                {/* Command Box */}
                <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5">
                  <code className="text-xs font-mono text-sky-300 truncate mr-4">{active.command}</code>
                  <button
                    onClick={() => copyCommand(active.command, `${tool.id}-${active.method}`)}
                    className="text-xs font-mono text-slate-400 hover:text-sky-300 transition whitespace-nowrap"
                  >
                    {copiedCmd === `${tool.id}-${active.method}` ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Polyglot SDK Downloads ── */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CodeIcon className="text-indigo-400" />
              <span>Polyglot SDK Downloads</span>
            </h2>
            <p className="text-xs text-slate-400">100% feature-parity graph execution, event mesh, and policy gate APIs</p>
          </div>
          <Link to="/ecosystem" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
            Ecosystem Hub <ArrowRightIcon size="sm" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SDK_DOWNLOADS.map((sdk, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-3 hover:border-indigo-500/40 transition">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 font-mono font-black text-xs flex items-center justify-center">
                    {sdk.icon}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{sdk.lang}</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                  {sdk.version}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
                <code className="text-[11px] font-mono text-sky-300 truncate mr-2">{sdk.command}</code>
                <button
                  onClick={() => copyCommand(sdk.command, `sdk-${idx}`)}
                  className="text-[11px] font-mono text-slate-400 hover:text-sky-300 transition"
                >
                  {copiedCmd === `sdk-${idx}` ? "✓" : "Copy"}
                </button>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Package size</span>
                <span className="text-slate-300 font-mono">{sdk.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── All Product Downloads ── */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <PackageIcon className="text-purple-400" />
              <span>All Product Downloads & Access</span>
            </h2>
            <p className="text-xs text-slate-400">14 commercial enterprise products — download, install, or launch</p>
          </div>
          <Link to="/products" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
            Product Catalog <ArrowRightIcon size="sm" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="pb-3 pr-4 font-semibold">Product</th>
                <th className="pb-3 pr-4 font-semibold">Type</th>
                <th className="pb-3 pr-4 font-semibold">Action</th>
                <th className="pb-3 font-semibold text-right">Download / Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {PRODUCT_DOWNLOADS.map((product) => (
                <tr key={product.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 pr-4">
                    <Link to={`/products/${product.id}`} className="text-slate-100 font-semibold hover:text-sky-400 transition">
                      {product.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      {product.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{product.action}</td>
                  <td className="py-3 text-right">
                    {product.actionType === "link" && (
                      <Link
                        to={product.path}
                        className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold transition"
                      >
                        Launch <ExternalLinkIcon size="sm" />
                      </Link>
                    )}
                    {product.actionType === "download" && (
                      <div className="flex items-center justify-end gap-2">
                        {product.files.map((f) => (
                          <button
                            key={f}
                            onClick={() => simulateDownload(f, f)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                              downloadStarted[f]
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-slate-900 text-slate-300 border border-slate-800 hover:text-sky-400 hover:border-sky-500/40"
                            }`}
                          >
                            {downloadStarted[f] ? <CheckCircleIcon size="sm" /> : <DownloadIcon size="sm" />}
                            {f.includes("ios") ? "iOS" : "Android"}
                          </button>
                        ))}
                      </div>
                    )}
                    {product.actionType === "cli" && (
                      <button
                        onClick={() => copyCommand(product.command, `product-${product.id}`)}
                        className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono font-semibold transition"
                      >
                        {copiedCmd === `product-${product.id}` ? "✓ Copied" : "Copy Install Cmd"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Verification & Security ── */}
      <div className="card-glass rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-lg">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <SecurityIcon className="text-emerald-400" />
            <span>Download Verification & Security</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All binaries are signed with GPG keys and verified via SHA-256 checksums. Desktop builds are code-signed for macOS (Apple Notarized), Windows (Authenticode), and Linux (AppImage signatures).
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-center space-y-1">
            <div className="text-lg font-black text-emerald-400">GPG</div>
            <div className="text-[10px] text-slate-400 font-mono">Signed Releases</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-center space-y-1">
            <div className="text-lg font-black text-sky-400">SHA-256</div>
            <div className="text-[10px] text-slate-400 font-mono">Checksums</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-center space-y-1">
            <div className="text-lg font-black text-indigo-400">SBOM</div>
            <div className="text-[10px] text-slate-400 font-mono">Supply Chain</div>
          </div>
        </div>
      </div>
    </div>
  );
}
