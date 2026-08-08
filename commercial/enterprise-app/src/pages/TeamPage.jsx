import { useState } from "react";
import {
  UsersIcon,
  UserIcon,
  PlusIcon,
  ShieldIcon,
  CheckCircleIcon,
  XIcon,
  TrashIcon,
  SparklesIcon,
  KeyIcon
} from "../components/Icons.jsx";

const INITIAL_ROSTER = [
  { id: "usr_1", name: "Dev Leader", email: "demo@alp-enterprise.com", role: "Owner", status: "Active", joined: "2026-01-10", avatar: "DL" },
  { id: "usr_2", name: "Sarah Chen", email: "sarah.chen@swarmcorp.com", role: "Admin", status: "Active", joined: "2026-02-15", avatar: "SC" },
  { id: "usr_3", name: "Alex Rivera", email: "alex.r@swarmcorp.com", role: "Developer", status: "Active", joined: "2026-03-01", avatar: "AR" },
  { id: "usr_4", name: "Elena Rostova", email: "elena.v@sec-audit.io", role: "Auditor", status: "Pending Invite", joined: "2026-08-07", avatar: "ER" },
];

const AUDIT_LOG = [
  { id: "evt_1", user: "Dev Leader", action: "Promoted Sarah Chen to Admin", target: "Role Update", timestamp: "10 mins ago" },
  { id: "evt_2", user: "Sarah Chen", action: "Created Workspace 'quantum-compiler-v85'", target: "Workspace", timestamp: "45 mins ago" },
  { id: "evt_3", user: "Alex Rivera", action: "Executed ZK Proof Verification #zk-9021", target: "ZK Verifier", timestamp: "2 hours ago" },
  { id: "evt_4", user: "Dev Leader", action: "Generated API Key 'Production Swarm Mesh Key'", target: "Security Credentials", timestamp: "1 day ago" },
];

export default function TeamPage() {
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    const newMember = {
      id: `usr_${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: "Pending Invite",
      joined: new Date().toISOString().split("T")[0],
      avatar: inviteName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2),
    };
    setRoster([...roster, newMember]);
    setInviteName("");
    setInviteEmail("");
    setShowInviteModal(false);
  };

  const handleRemoveMember = (id) => {
    setRoster(roster.filter((m) => m.id !== id));
  };

  const handleRoleChange = (id, newRole) => {
    setRoster(roster.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-medium badge-glow">
          <UsersIcon size="sm" /> Enterprise Team &amp; RBAC Access
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          Swarm Team Governance &amp; Permissions
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Manage team member seats, assign Role-Based Access Control (RBAC), and review enterprise audit trails.
        </p>
      </div>

      {/* Roster & Actions Bar */}
      <div className="card-glass rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <UsersIcon className="text-sky-400" />
              <span>Active Team Roster ({roster.length} Seats)</span>
            </h2>
            <p className="text-xs text-slate-400">Owner, Admin, Developer, and Auditor role management</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
          >
            <PlusIcon size="sm" /> Invite Team Member
          </button>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 pr-4 font-semibold">Member</th>
                <th className="pb-3 pr-4 font-semibold">Role</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Joined</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roster.map((member) => (
                <tr key={member.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-sky-400 font-bold flex items-center justify-center text-xs">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{member.name}</div>
                        <div className="text-[11px] text-slate-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {member.role === "Owner" ? (
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-800/50 px-2.5 py-1 rounded-full">
                        Owner
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-800 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Developer">Developer</option>
                        <option value="Auditor">Auditor</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        member.status === "Active"
                          ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                          : "text-amber-400 bg-amber-950/40 border border-amber-800/40"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400 font-mono">{member.joined}</td>
                  <td className="py-3 text-right">
                    {member.role !== "Owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition"
                        title="Remove Member"
                      >
                        <TrashIcon size="sm" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permission Matrix & Audit Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission Matrix */}
        <div className="card-glass rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldIcon className="text-indigo-400" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h2>
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2">Capability</th>
                  <th className="pb-2 text-center">Owner</th>
                  <th className="pb-2 text-center">Admin</th>
                  <th className="pb-2 text-center">Dev</th>
                  <th className="pb-2 text-center">Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2 font-medium">Create Workspaces</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-slate-600">✕</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Deploy Swarms &amp; Products</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-slate-600">✕</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Manage API Keys &amp; Billing</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-slate-600">✕</td>
                  <td className="text-center text-slate-600">✕</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Export ZK Policy Proofs</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                  <td className="text-center text-emerald-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Audit Log */}
        <div className="card-glass rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <SparklesIcon className="text-sky-400" />
            <span>Team Governance Audit Stream</span>
          </h2>
          <div className="space-y-3">
            {AUDIT_LOG.map((log) => (
              <div key={log.id} className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                  <span>{log.action}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>By: <span className="text-sky-400 font-medium">{log.user}</span></span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded font-mono">
                    {log.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Invite */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleInvite} className="card-glass border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-100">Invite Team Member</h3>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus Vance"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Email Address</label>
              <input
                type="email"
                required
                placeholder="marcus@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="Admin">Admin (Full Access)</option>
                <option value="Developer">Developer (Standard Build Access)</option>
                <option value="Auditor">Auditor (Read-Only Trace Access)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-400 text-xs rounded-xl hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/20"
              >
                Send Workspace Invite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
