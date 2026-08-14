import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  CheckCircleIcon,
  DashboardIcon,
  WorkspaceIcon,
  ReasoningIcon,
  ProductsIcon,
  ShieldIcon,
  TerminalIcon,
} from "../components/Icons.jsx";
import {
  LuRocket,
  LuTarget,
  LuBookOpen,
  LuCheck,
  LuChevronRight,
  LuStar,
  LuCpu,
  LuGlobe,
} from "react-icons/lu";

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Explore the Dashboard",
    description: "Your command center for monitoring agents, swarm health, and real-time telemetry across your entire ALP deployment.",
    link: "/dashboard",
    linkLabel: "Go to Dashboard",
    icon: DashboardIcon,
    gradient: "from-sky-500 to-indigo-500",
    tips: [
      "Monitor active agents and their reasoning chains in real-time",
      "Track swarm health, uptime, and Merkle verification status",
      "View recent deployments and system notifications",
    ],
  },
  {
    id: 2,
    title: "Create Your First Workspace",
    description: "Workspaces are isolated environments where you build, test, and deploy autonomous lifecycle protocols with full version control.",
    link: "/workspaces",
    linkLabel: "Create Workspace",
    icon: WorkspaceIcon,
    gradient: "from-emerald-500 to-teal-500",
    tips: [
      "Each workspace gets its own Merkle-verified file system",
      "Collaborate with team members in real-time",
      "Connect to CI/CD pipelines via the DevOps Bridge",
    ],
  },
  {
    id: 3,
    title: "Try the Reasoning Studio",
    description: "The Reasoning Studio is the crown jewel — run multi-strategy analysis with Chain-of-Thought, Critique, Synthesis, and Verification modes.",
    link: "/reasoning-studio",
    linkLabel: "Launch Reasoning Studio",
    icon: ReasoningIcon,
    gradient: "from-violet-500 to-purple-500",
    tips: [
      "Choose from 4 reasoning modes for different analysis types",
      "View live thought chains with confidence scoring",
      "Export reasoning trails for auditing and compliance",
    ],
  },
  {
    id: 4,
    title: "Browse the Product Suite",
    description: "Explore 14+ specialized products from Quantum Computing to SOC Sentinel — each powered by the ALP protocol engine.",
    link: "/products",
    linkLabel: "View Products",
    icon: ProductsIcon,
    gradient: "from-amber-500 to-orange-500",
    tips: [
      "Quantum Engineer, Chip Design Studio, and Neuromorphic Mesh",
      "Security suite: SOC Sentinel, Threat Intel, Zero Trust Architecture",
      "Data Pipeline Studio, Model Hub, and Analytics BI",
    ],
  },
  {
    id: 5,
    title: "Open the IDE",
    description: "A full-featured cloud IDE with multi-file editor, integrated terminal, MCP tool runner, and 1-click Merkle deployment.",
    link: "/workspaces",
    linkLabel: "Open IDE",
    icon: TerminalIcon,
    gradient: "from-cyan-500 to-sky-500",
    tips: [
      "Multi-file tree with syntax highlighting and line numbers",
      "Integrated terminal for running commands within your workspace",
      "Live MCP Tool Runner — execute reasoning tools directly",
    ],
  },
  {
    id: 6,
    title: "Set Up Your Team",
    description: "Invite team members, assign RBAC roles, and configure governance policies for secure multi-tenant collaboration.",
    link: "/team",
    linkLabel: "Manage Team",
    icon: ShieldIcon,
    gradient: "from-rose-500 to-pink-500",
    tips: [
      "Role-based access control: Owner, Admin, Developer, Viewer",
      "Audit trail for all team actions and deployments",
      "SSO integration via SAML/OIDC with Okta, Auth0, and more",
    ],
  },
];

const QUICK_LINKS = [
  { label: "Documentation", path: "/docs", icon: LuBookOpen, desc: "API reference & guides" },
  { label: "Downloads", path: "/downloads", icon: LuRocket, desc: "Desktop IDE & CLI tools" },
  { label: "Marketplace", path: "/marketplace", icon: LuGlobe, desc: "Agents, skills & extensions" },
  { label: "API Explorer", path: "/api-explorer", icon: LuCpu, desc: "Interactive API playground" },
];

function StepCard({ step, isCompleted, onComplete }) {
  const [showTips, setShowTips] = useState(false);
  const Icon = step.icon;

  return (
    <div className={`relative group border rounded-2xl overflow-hidden transition-all duration-300 ${
      isCompleted
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80"
    }`}>
      {/* Gradient accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${step.gradient} ${isCompleted ? "opacity-40" : "opacity-100"}`} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Step number / check */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            isCompleted
              ? "bg-emerald-500/20 text-emerald-400"
              : `bg-gradient-to-br ${step.gradient} text-white shadow-lg`
          }`}>
            {isCompleted ? (
              <LuCheck className="w-5 h-5" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-bold ${isCompleted ? "text-emerald-300 line-through opacity-70" : "text-white"}`}>
                {step.title}
              </h3>
              {isCompleted && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Done
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">{step.description}</p>

            {/* Tips accordion */}
            <button
              onClick={() => setShowTips(!showTips)}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors mb-2"
            >
              <LuChevronRight className={`w-3 h-3 transition-transform ${showTips ? "rotate-90" : ""}`} />
              {showTips ? "Hide tips" : "Show tips"}
            </button>

            {showTips && (
              <ul className="space-y-1.5 mb-3 animate-in fade-in slide-in-from-top-1 duration-150">
                {step.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                    <LuStar className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                to={step.link}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isCompleted
                    ? "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                    : `bg-gradient-to-r ${step.gradient} text-white hover:shadow-lg`
                }`}
              >
                {isCompleted ? "Revisit" : step.linkLabel}
                <LuChevronRight className="w-3 h-3" />
              </Link>
              {!isCompleted && (
                <button
                  onClick={() => onComplete(step.id)}
                  className="text-[11px] text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  Mark as done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const handleComplete = (stepId) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const progress = (completedSteps.size / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 rounded-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] text-sky-400 font-mono font-semibold tracking-widest uppercase mb-3">
            <LuRocket className="w-3.5 h-3.5" />
            Getting Started
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Welcome to ALP Enterprise{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 🚀
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            You're now inside the Autonomous Lifecycle Protocol platform — the world's most advanced
            swarm-intelligence operating system. Follow these steps to unlock the full power of your deployment.
          </p>

          {/* Progress bar */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-800/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-400">
              {completedSteps.size}/{ONBOARDING_STEPS.length}
            </span>
          </div>

          {completedSteps.size === ONBOARDING_STEPS.length && (
            <div className="mt-4 flex items-center gap-2 text-emerald-400 animate-in fade-in duration-500">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-bold">All steps complete! You're ready to build.</span>
            </div>
          )}
        </div>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ONBOARDING_STEPS.map(step => (
          <StepCard
            key={step.id}
            step={step}
            isCompleted={completedSteps.has(step.id)}
            onComplete={handleComplete}
          />
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <LuTarget className="w-4 h-4 text-sky-400" />
          Quick Links
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map(ql => {
            const QlIcon = ql.icon;
            return (
              <Link
                key={ql.path}
                to={ql.path}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all group"
              >
                <QlIcon className="w-5 h-5 text-slate-500 group-hover:text-sky-400 transition-colors mb-2" />
                <div className="text-xs font-bold text-slate-200">{ql.label}</div>
                <div className="text-[10px] text-slate-500">{ql.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Help CTA */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          <LuBookOpen className="w-6 h-6 text-violet-400" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-sm font-bold text-white">Need help?</h3>
          <p className="text-xs text-slate-400">Our documentation covers everything from protocol setup to advanced swarm orchestration.</p>
        </div>
        <Link
          to="/docs"
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all"
        >
          Read Docs
          <LuChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
