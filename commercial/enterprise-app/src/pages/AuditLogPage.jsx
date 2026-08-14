import { useState } from "react";

import {
  LuSearch,
  LuChevronDown,
  LuDownload,
  LuShield,
  LuSettings,
  LuKey,
  LuLogIn,
  LuLogOut,
  LuFilePen,
  LuTrash2,
  LuPlus,
  LuEye,
  LuGitBranch,
  LuUpload,
} from "react-icons/lu";

const ACTION_ICONS = {
  login: LuLogIn,
  logout: LuLogOut,
  create: LuPlus,
  update: LuFilePen,
  delete: LuTrash2,
  deploy: LuUpload,
  view: LuEye,
  settings: LuSettings,
  api_key: LuKey,
  security: LuShield,
  download: LuDownload,
  commit: LuGitBranch,
};

const ACTION_COLORS = {
  login: "text-emerald-400 bg-emerald-500/10",
  logout: "text-slate-400 bg-slate-500/10",
  create: "text-sky-400 bg-sky-500/10",
  update: "text-amber-400 bg-amber-500/10",
  delete: "text-rose-400 bg-rose-500/10",
  deploy: "text-indigo-400 bg-indigo-500/10",
  view: "text-slate-300 bg-slate-500/10",
  settings: "text-violet-400 bg-violet-500/10",
  api_key: "text-amber-400 bg-amber-500/10",
  security: "text-rose-400 bg-rose-500/10",
  download: "text-sky-400 bg-sky-500/10",
  commit: "text-emerald-400 bg-emerald-500/10",
};

const SEVERITY_BADGE = {
  info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  critical: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const MOCK_AUDIT_LOGS = [
  {
    id: "aud_001",
    timestamp: "2026-08-08T23:15:00Z",
    user: { name: "Dev Leader", email: "demo@alp-enterprise.com", avatar: "DL" },
    action: "deploy",
    severity: "info",
    resource: "Swarm Mesh Production Cluster",
    description: "Deployed v85.0.0 to production swarm mesh (3 nodes, 12 agents)",
    ip: "192.168.1.42",
    details: { cluster: "prod-us-east-1", nodes: 3, agents: 12, duration: "4.2s" },
  },
  {
    id: "aud_002",
    timestamp: "2026-08-08T22:48:00Z",
    user: { name: "Dev Leader", email: "demo@alp-enterprise.com", avatar: "DL" },
    action: "api_key",
    severity: "warning",
    resource: "API Key: Production Swarm Mesh Key",
    description: "Regenerated production API key — previous key revoked",
    ip: "192.168.1.42",
    details: { keyId: "key_prod_9918", action: "regenerate" },
  },
  {
    id: "aud_003",
    timestamp: "2026-08-08T21:30:00Z",
    user: { name: "Sarah Chen", email: "sarah@alp-enterprise.com", avatar: "SC" },
    action: "commit",
    severity: "success",
    resource: "Workspace: ALP Core Engine",
    description: "Merkle-committed 14 files to swarm-verified blockchain ledger",
    ip: "10.0.4.18",
    details: { files: 14, merkleRoot: "0xab3f...9e2c", verificationLevel: "strict" },
  },
  {
    id: "aud_004",
    timestamp: "2026-08-08T20:15:00Z",
    user: { name: "Alex Rivera", email: "alex@alp-enterprise.com", avatar: "AR" },
    action: "create",
    severity: "info",
    resource: "Agent: Revenue Analyzer v3",
    description: "Created new autonomous agent with revenue analysis capabilities",
    ip: "10.0.4.22",
    details: { agentId: "agt_rev_v3", skills: ["data-analysis", "reporting", "forecasting"] },
  },
  {
    id: "aud_005",
    timestamp: "2026-08-08T19:45:00Z",
    user: { name: "Dev Leader", email: "demo@alp-enterprise.com", avatar: "DL" },
    action: "security",
    severity: "critical",
    resource: "2FA Configuration",
    description: "Enabled two-factor authentication for organization — all members affected",
    ip: "192.168.1.42",
    details: { method: "TOTP", scope: "organization", affectedUsers: 8 },
  },
  {
    id: "aud_006",
    timestamp: "2026-08-08T18:20:00Z",
    user: { name: "Jordan Kim", email: "jordan@alp-enterprise.com", avatar: "JK" },
    action: "update",
    severity: "info",
    resource: "Reasoning Studio: Policy Synthesis",
    description: "Updated reasoning chain template with enhanced critique step",
    ip: "10.0.4.30",
    details: { templateId: "tpl_policy_syn", changes: 3 },
  },
  {
    id: "aud_007",
    timestamp: "2026-08-08T17:00:00Z",
    user: { name: "Sarah Chen", email: "sarah@alp-enterprise.com", avatar: "SC" },
    action: "delete",
    severity: "warning",
    resource: "Workspace: Legacy Test Environment",
    description: "Deleted workspace and all associated files (23 files, 4.2 MB)",
    ip: "10.0.4.18",
    details: { workspaceId: "ws_legacy_test", files: 23, size: "4.2 MB" },
  },
  {
    id: "aud_008",
    timestamp: "2026-08-08T15:30:00Z",
    user: { name: "Dev Leader", email: "demo@alp-enterprise.com", avatar: "DL" },
    action: "settings",
    severity: "info",
    resource: "Protocol Configuration",
    description: "Changed default model routing to claude-3-5-sonnet with strict Merkle verification",
    ip: "192.168.1.42",
    details: { model: "claude-3-5-sonnet", merkleLevel: "strict" },
  },
  {
    id: "aud_009",
    timestamp: "2026-08-08T14:00:00Z",
    user: { name: "Alex Rivera", email: "alex@alp-enterprise.com", avatar: "AR" },
    action: "download",
    severity: "info",
    resource: "SHAM Desktop IDE v4.2.0",
    description: "Downloaded macOS ARM64 installer (SHA-256 verified)",
    ip: "10.0.4.22",
    details: { platform: "macOS ARM64", version: "4.2.0", sha256: "a3b9c1...f7e2" },
  },
  {
    id: "aud_010",
    timestamp: "2026-08-08T12:30:00Z",
    user: { name: "Jordan Kim", email: "jordan@alp-enterprise.com", avatar: "JK" },
    action: "login",
    severity: "success",
    resource: "Authentication",
    description: "Successful login via SSO (Okta SAML) from Chrome 126 on macOS",
    ip: "10.0.4.30",
    details: { method: "SSO-SAML", provider: "Okta", browser: "Chrome 126", os: "macOS 15.2" },
  },
  {
    id: "aud_011",
    timestamp: "2026-08-08T11:00:00Z",
    user: { name: "Dev Leader", email: "demo@alp-enterprise.com", avatar: "DL" },
    action: "view",
    severity: "info",
    resource: "Analytics Dashboard",
    description: "Viewed analytics dashboard — exported monthly revenue report as CSV",
    ip: "192.168.1.42",
    details: { export: true, format: "CSV", period: "July 2026" },
  },
  {
    id: "aud_012",
    timestamp: "2026-08-07T23:45:00Z",
    user: { name: "Sarah Chen", email: "sarah@alp-enterprise.com", avatar: "SC" },
    action: "deploy",
    severity: "success",
    resource: "Federation Mesh Node: us-west-2",
    description: "Deployed federation relay node to US West region with auto-scaling enabled",
    ip: "10.0.4.18",
    details: { region: "us-west-2", type: "relay", autoScale: true, maxNodes: 5 },
  },
];

function formatTimestamp(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LogRow({ log, expanded, onToggle }) {
  const ActionIcon = ACTION_ICONS[log.action] || LuEye;
  const colorClass = ACTION_COLORS[log.action] || "text-slate-400 bg-slate-500/10";

  return (
    <div className={`border-b border-slate-800/60 transition-colors ${expanded ? "bg-slate-900/40" : "hover:bg-slate-900/30"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        {/* Action icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <ActionIcon className="w-4 h-4" />
        </div>

        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-300">{log.user.avatar}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-200">{log.user.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_BADGE[log.severity]}`}>
              {log.action.replace("_", " ")}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{log.description}</p>
        </div>

        {/* Metadata */}
        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">{formatTimestamp(log.timestamp)}</span>
          <span className="text-[10px] text-slate-600 font-mono">{log.ip}</span>
        </div>

        <LuChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pl-[4.5rem] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500">Resource</span>
                <div className="text-xs text-slate-300 font-medium">{log.resource}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Timestamp</span>
                <div className="text-xs text-slate-300 font-mono">{new Date(log.timestamp).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">IP Address</span>
                <div className="text-xs text-slate-300 font-mono">{log.ip}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Event ID</span>
                <div className="text-xs text-slate-300 font-mono">{log.id}</div>
              </div>
            </div>
            {log.details && (
              <div className="mt-2 pt-2 border-t border-slate-800/40">
                <span className="text-[10px] text-slate-500 block mb-1">Metadata</span>
                <pre className="text-[11px] text-slate-400 font-mono bg-slate-900/60 rounded-lg p-2 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = MOCK_AUDIT_LOGS.filter(log => {
    const matchSearch = search === "" ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.user.name.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "all" || log.severity === severityFilter;
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    return matchSearch && matchSeverity && matchAction;
  });

  const severityCounts = {
    info: MOCK_AUDIT_LOGS.filter(l => l.severity === "info").length,
    success: MOCK_AUDIT_LOGS.filter(l => l.severity === "success").length,
    warning: MOCK_AUDIT_LOGS.filter(l => l.severity === "warning").length,
    critical: MOCK_AUDIT_LOGS.filter(l => l.severity === "critical").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-sky-400 font-mono font-semibold tracking-widest uppercase mb-2">
            <LuShield className="w-3.5 h-3.5" />
            Governance & Compliance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Audit Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Full trail of user actions, deployments, and security events across your organization.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-all">
          <LuDownload className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Severity summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "info", label: "Info Events", count: severityCounts.info, color: "from-sky-500/15 to-indigo-500/15", border: "border-sky-500/30", text: "text-sky-300" },
          { key: "success", label: "Success", count: severityCounts.success, color: "from-emerald-500/15 to-teal-500/15", border: "border-emerald-500/30", text: "text-emerald-300" },
          { key: "warning", label: "Warnings", count: severityCounts.warning, color: "from-amber-500/15 to-orange-500/15", border: "border-amber-500/30", text: "text-amber-300" },
          { key: "critical", label: "Critical", count: severityCounts.critical, color: "from-rose-500/15 to-pink-500/15", border: "border-rose-500/30", text: "text-rose-300" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSeverityFilter(severityFilter === s.key ? "all" : s.key)}
            className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-xl p-3 text-center transition-all hover:scale-[1.02] ${
              severityFilter === s.key ? "ring-2 ring-sky-500/40 scale-[1.02]" : ""
            }`}
          >
            <div className={`text-xl font-black ${s.text}`}>{s.count}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search events, users, or resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500/50 transition-colors"
        >
          <option value="all">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="deploy">Deploy</option>
          <option value="settings">Settings</option>
          <option value="api_key">API Key</option>
          <option value="security">Security</option>
          <option value="download">Download</option>
          <option value="commit">Commit</option>
        </select>
      </div>

      {/* Log table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-8" />
          <div className="w-7" />
          <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event</div>
          <div className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 text-right">Time</div>
          <div className="w-3.5" />
        </div>

        {/* Rows */}
        {filtered.length > 0 ? (
          filtered.map(log => (
            <LogRow
              key={log.id}
              log={log}
              expanded={expandedId === log.id}
              onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            No audit events match your filters.
          </div>
        )}
      </div>

      {/* Footer pagination hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Showing {filtered.length} of {MOCK_AUDIT_LOGS.length} events</span>
        <span className="font-mono">Last synced: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
