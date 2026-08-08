import { useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  SettingsIcon,
  UserIcon,
  KeyIcon,
  BellIcon,
  ShieldIcon,
  CheckCircleIcon,
  CopyIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  ZapIcon,
  GlobeIcon
} from "../components/Icons.jsx";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form State
  const [name, setName] = useState(user?.name || "Dev Leader");
  const [email, setEmail] = useState(user?.email || "demo@alp-enterprise.com");
  const [orgName, setOrgName] = useState(user?.organization?.name || "Enterprise Swarm Corp");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState([
    { id: "key_prod_9918", name: "Production Swarm Mesh Key", key: "alp_live_9f82a1...3b9e", created: "2026-08-01", lastUsed: "2 mins ago" },
    { id: "key_dev_4412", name: "Local Dev CLI Key", key: "alp_test_471c99...e12a", created: "2026-08-05", lastUsed: "1 hour ago" },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Protocol Config State
  const [defaultModel, setDefaultModel] = useState("claude-3-5-sonnet");
  const [merkleLevel, setMerkleLevel] = useState("strict");
  const [autoHealing, setAutoHealing] = useState(true);
  const [zkVerification, setZkVerification] = useState(true);

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/T000/B000/XXXX");
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: `alp_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
    };
    setApiKeys([newKey, ...apiKeys]);
    setNewKeyName("");
    setShowKeyModal(false);
  };

  const handleRevokeKey = (id) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const handleCopyKey = (id, key) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Hero Header */}
      <div className="card-glass p-8 rounded-3xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-medium badge-glow">
          <SettingsIcon size="sm" /> Account &amp; Protocol Settings
        </div>
        <h1 className="text-4xl font-extrabold gradient-text tracking-tight">
          System Preferences &amp; API Keys
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Manage workspace identity, security credentials, automated model routing, and Merkle verification policies.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
        {[
          { id: "profile", label: "Profile & Org", icon: UserIcon },
          { id: "apikeys", label: "API Credentials", icon: KeyIcon },
          { id: "protocol", label: "Protocol Engine", icon: ZapIcon },
          { id: "notifications", label: "Notifications & Security", icon: BellIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-smooth whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Icon size="sm" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="card-glass rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserIcon className="text-sky-400" />
                <span>Organization Identity</span>
              </h2>
              <p className="text-xs text-slate-400">Update your enterprise account credentials and workspace organization details</p>
            </div>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full animate-in fade-in">
                <CheckCircleIcon size="sm" /> Settings Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <label className="text-slate-300 font-medium">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 font-medium">Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 font-medium">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 font-medium">Plan &amp; License Tier</label>
              <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-sky-400">Enterprise Scale ($999/mo)</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">Active</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {activeTab === "apikeys" && (
        <div className="card-glass rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <KeyIcon className="text-indigo-400" />
                <span>API Keys &amp; Secret Tokens</span>
              </h2>
              <p className="text-xs text-slate-400">Manage secret authentication tokens for CLI tools, CI/CD runners, and SDK integrations</p>
            </div>
            <button
              onClick={() => setShowKeyModal(true)}
              className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
            >
              <PlusIcon size="sm" /> Generate New Key
            </button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-500/40 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{key.name}</span>
                    <span className="text-[10px] text-sky-400 bg-sky-950/50 border border-sky-800/50 px-2 py-0.5 rounded font-mono">
                      {key.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>{key.key}</span>
                    <button
                      onClick={() => handleCopyKey(key.id, key.key)}
                      className="text-sky-400 hover:underline text-[11px]"
                    >
                      {copiedKeyId === key.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-400 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <div>Created: <span className="text-slate-300 font-mono">{key.created}</span></div>
                    <div className="text-[10px] text-slate-500">Last used: {key.lastUsed}</div>
                  </div>
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                    title="Revoke Key"
                  >
                    <TrashIcon size="sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for new key */}
          {showKeyModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="card-glass border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
                <h3 className="text-base font-bold text-slate-100">Generate New API Key</h3>
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-medium">Key Name / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. CI/CD GitHub Actions Runner"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-slate-950/90 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 bg-slate-900 text-slate-400 text-xs rounded-xl hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl"
                  >
                    Create API Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "protocol" && (
        <div className="card-glass rounded-2xl p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ZapIcon className="text-amber-400" />
              <span>Protocol Engine &amp; Reasoning Config</span>
            </h2>
            <p className="text-xs text-slate-400">Configure global swarm parameters, default model routing, and ZK policy enforcement</p>
          </div>

          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-300 font-medium">Default Model Routing Strategy</label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Recommended - Standard)</option>
                  <option value="gpt-4o">GPT-4o Enterprise</option>
                  <option value="gemini-1-5-pro">Gemini 1.5 Pro (Deep Context)</option>
                  <option value="deepseek-r1">DeepSeek-R1 (Open Weights Reasoning)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-medium">Merkle Trace Verification Level</label>
                <select
                  value={merkleLevel}
                  onChange={(e) => setMerkleLevel(e.target.value)}
                  className="w-full bg-slate-950/90 text-slate-200 p-3 rounded-xl border border-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="strict">Strict (Validate every step with SHA-256 Merkle root)</option>
                  <option value="balanced">Balanced (Verify checkpoints &amp; final artifacts)</option>
                  <option value="fast">Fast (Audit-only background verification)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-slate-200">Swarm Mesh Self-Healing Engine</div>
                  <div className="text-slate-400 text-[11px]">Automatically re-route failed agent tasks to healthy peer nodes</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoHealing(!autoHealing)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${autoHealing ? "bg-emerald-500" : "bg-slate-800"}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${autoHealing ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-slate-200">Zero-Knowledge Policy Proof Enforcer</div>
                  <div className="text-slate-400 text-[11px]">Verify policy constraints without exposing sensitive source code</div>
                </div>
                <button
                  type="button"
                  onClick={() => setZkVerification(!zkVerification)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${zkVerification ? "bg-emerald-500" : "bg-slate-800"}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${zkVerification ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="card-glass rounded-2xl p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BellIcon className="text-sky-400" />
              <span>Notifications &amp; Security Alerts</span>
            </h2>
            <p className="text-xs text-slate-400">Configure alert channels for swarm events, policy violations, and security incidents</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-slate-200">Email Alerts</div>
                <div className="text-slate-400 text-[11px]">Receive digest emails for failed quality gates and high-severity issues</div>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${emailAlerts ? "bg-sky-500" : "bg-slate-800"}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${emailAlerts ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <label className="font-bold text-slate-200">Slack Webhook URL</label>
              <input
                type="text"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-800 focus:border-sky-500 focus:outline-none font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
