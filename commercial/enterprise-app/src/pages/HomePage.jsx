import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ReasoningIcon,
  ZapIcon,
  ShieldIcon,
  SparklesIcon,
  LayersIcon,
  CodeIcon,
  TerminalIcon,
  AnalyticsIcon,
  DashboardIcon,
  ProductsIcon,
  WorkspaceIcon,
  LogoIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  GlobeIcon,
  DatabaseIcon,
  CpuIcon,
} from "../components/Icons.jsx";
import {
  LuBrainCircuit,
  LuShieldCheck,
  LuZap,
  LuGlobe,
  LuLayers,
  LuChevronRight,
  LuChevronDown,
  LuArrowRight,
  LuCheck,
  LuStar,
  LuGitBranch,
  LuRocket,
  LuUsers,
  LuCpu,
  LuDatabase,
  LuTerminal,
  LuCode,
  LuActivity,
  LuLock,
  LuCloud,
  LuBox,
  LuPlay,
  LuMail,
  LuTwitter,
  LuGithub,
  LuLinkedin,
  LuYoutube,
  LuBookOpen,
  LuMessageCircle,
  LuHeart,
  LuSparkles,
  LuAtom,
  LuCircuitBoard,
  LuRadar,
  LuServer,
  LuWifi,
  LuEye,
  LuTrendingUp,
} from "react-icons/lu";

/* ────────────────────────────── animated counter ────────────────────────────── */
function AnimatedCounter({ end, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = 0;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * (end - start) + start));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ────────────────────────────── data ────────────────────────────── */
const CORE_FEATURES = [
  {
    icon: LuBrainCircuit,
    title: "Reasoning Studio",
    desc: "Multi-strategy analysis with Chain-of-Thought, Critique, Synthesis, and Verification modes. Transparent AI decision-making at scale.",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
  },
  {
    icon: LuZap,
    title: "Swarm Orchestration",
    desc: "Coordinate thousands of autonomous agents across distributed meshes with real-time telemetry and self-healing capabilities.",
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
  },
  {
    icon: LuShieldCheck,
    title: "Zero Trust Security",
    desc: "SOC2-ready audit trails, ZK-proof policy verification, RBAC governance, and end-to-end encryption for regulated environments.",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
  },
  {
    icon: LuLayers,
    title: "Federation Mesh",
    desc: "Cross-organization swarm federation with latency-optimized routing, Merkle-verified state sync, and multi-region failover.",
    gradient: "from-sky-500 to-cyan-600",
    glow: "shadow-sky-500/20",
  },
  {
    icon: LuCpu,
    title: "Neuromorphic Computing",
    desc: "Spike-train neural processing primitives, memristive crossbar arrays, and brain-inspired architectures for edge AI inference.",
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
  },
  {
    icon: LuAtom,
    title: "Quantum Engineering",
    desc: "Circuit composition, qubit topology visualization, and quantum error correction for next-generation computing workloads.",
    gradient: "from-indigo-500 to-blue-600",
    glow: "shadow-indigo-500/20",
  },
];

const PRODUCT_SHOWCASE = [
  { name: "Agent Studio", desc: "Visual agent builder with drag-and-drop workflow composer", icon: LuSparkles, color: "text-violet-400", features: ["Visual workflow composer", "Swarm mesh integration", "Enterprise RBAC & audit trails"] },
  { name: "Hybrid Engineer AI", desc: "Multi-modal agent for hardware + software co-design", icon: LuCpu, color: "text-amber-400", features: ["Hardware + software co-design", "Real-time simulation", "Cross-domain reasoning"] },
  { name: "Data Pipeline Studio", desc: "ETL orchestration with real-time stream processing", icon: LuDatabase, color: "text-emerald-400", features: ["Real-time stream processing", "Schema evolution", "Federation sync"] },
  { name: "Model Hub", desc: "Fine-tuning, A/B testing, and model lifecycle management", icon: LuBrainCircuit, color: "text-sky-400", features: ["Fine-tuning workflows", "A/B testing", "Model registry"] },
  { name: "Cloud Workspace", desc: "Collaborative dev environment with Merkle-verified files", icon: LuCloud, color: "text-cyan-400", features: ["Real-time collaboration", "Merkle-verified files", "Cross-region sync"] },
  { name: "DevOps Bridge", desc: "CI/CD pipeline integration with automated deployments", icon: LuGitBranch, color: "text-pink-400", features: ["CI/CD integration", "Automated deployments", "Policy gates"] },
  { name: "Security Scanner", desc: "Vulnerability detection and compliance scanning", icon: LuShieldCheck, color: "text-rose-400", features: ["Vulnerability scanning", "Compliance reports", "Policy enforcement"] },
  { name: "Analytics BI", desc: "Real-time revenue dashboards with predictive insights", icon: LuTrendingUp, color: "text-indigo-400", features: ["Real-time dashboards", "Predictive analytics", "Custom reports"] },
  { name: "ALP Test", desc: "Playwright-class E2E, visual regression, and AI-powered test generation", icon: LuActivity, color: "text-emerald-300", features: ["Playwright-class E2E", "Visual regression diff", "AI test generation", "Self-healing selectors"], link: "/products/alp-test" },
];

const STATS = [
  { value: 99, suffix: ".98%", label: "Platform Uptime", desc: "Zero unplanned downtime in 12 months" },
  { value: 14, suffix: "+", label: "Products", desc: "Specialized tools for every use case" },
  { value: 2, suffix: "M+", label: "API Calls / Day", desc: "Processing at enterprise scale" },
  { value: 50, suffix: "ms", label: "Avg Latency", desc: "Sub-100ms response times globally" },
];

const TESTIMONIALS = [
  {
    quote: "ALP Enterprise transformed how we build AI systems. The Reasoning Studio alone saved our team 400+ hours in the first quarter.",
    name: "Dr. Maya Patel",
    title: "VP of Engineering, NeuralScale",
    avatar: "MP",
    rating: 5,
  },
  {
    quote: "The swarm orchestration is unlike anything else on the market. We went from managing 50 agents to 2,000 with zero additional headcount.",
    name: "James Chen",
    title: "CTO, Distributed Systems Inc.",
    avatar: "JC",
    rating: 5,
  },
  {
    quote: "Security and compliance were our biggest concerns. ALP's ZK policy proofs and audit trails made our SOC2 audit a breeze.",
    name: "Sarah Okonkwo",
    title: "CISO, FinGuard Technologies",
    avatar: "SO",
    rating: 5,
  },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    desc: "For individual developers and small teams",
    features: [
      "Up to 5 workspaces",
      "10 autonomous agents",
      "Reasoning Studio (basic modes)",
      "Community support",
      "1 GB storage",
    ],
    cta: "Start Free Trial",
    popular: false,
    gradient: "from-slate-700 to-slate-800",
    border: "border-slate-700",
  },
  {
    name: "Professional",
    price: "$199",
    period: "/mo",
    desc: "For growing teams building AI-native applications",
    features: [
      "Unlimited workspaces",
      "100 autonomous agents",
      "All Reasoning Studio modes",
      "Federation Studio access",
      "Priority support (24h SLA)",
      "50 GB storage",
      "API Explorer full access",
      "Team collaboration (up to 25)",
    ],
    cta: "Start Free Trial",
    popular: true,
    gradient: "from-sky-600 to-indigo-600",
    border: "border-sky-500/50",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations requiring full platform access",
    features: [
      "Everything in Professional",
      "Unlimited agents & federation",
      "ZK Policy Proofs engine",
      "Neuromorphic & Quantum modules",
      "SSO / SAML / OIDC integration",
      "Dedicated success manager",
      "SOC2 & HIPAA compliance",
      "Custom SLA (99.99% uptime)",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-violet-600 to-purple-700",
    border: "border-violet-500/40",
  },
];

const INTEGRATIONS = [
  "GitHub", "GitLab", "Slack", "Jira", "Okta", "Auth0",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
  "DataDog", "Splunk", "PagerDuty", "Grafana", "Prometheus", "Stripe",
];

const FAQ_ITEMS = [
  {
    q: "What is the Autonomous Lifecycle Protocol?",
    a: "ALP is a comprehensive platform for building, deploying, and managing AI-native applications with enterprise-grade governance. It provides multi-agent orchestration, predictive policy enforcement, and autonomous operations across the entire software lifecycle.",
  },
  {
    q: "How does swarm orchestration work?",
    a: "Our swarm mesh coordinates thousands of autonomous agents in real-time using a distributed consensus protocol. Each agent operates independently but synchronizes state through Merkle-verified channels, enabling self-healing and auto-scaling without central coordination.",
  },
  {
    q: "Is ALP Enterprise suitable for regulated industries?",
    a: "Absolutely. ALP includes SOC2-ready audit trails, ZK-proof policy verification, HIPAA compliance controls, end-to-end encryption, and RBAC governance. Our enterprise tier also supports on-premise deployment for maximum data sovereignty.",
  },
  {
    q: "Can I integrate ALP with my existing tools?",
    a: "Yes — ALP integrates with 18+ platforms including GitHub, GitLab, Slack, Jira, AWS, Azure, GCP, Docker, Kubernetes, and more. Our REST & GraphQL APIs and CLI tools make custom integrations straightforward.",
  },
  {
    q: "What reasoning modes are available?",
    a: "The Reasoning Studio offers Chain-of-Thought (step-by-step analysis), Critique (adversarial review), Synthesis (multi-source combination), and Verification (formal proof checking). Each mode produces transparent, auditable reasoning trails.",
  },
  {
    q: "How does ALP handle data privacy and sovereignty?",
    a: "ALP supports on-premise, private cloud, and hybrid deployment models. All data is encrypted at rest and in transit. ZK-proof policy verification ensures compliance without exposing sensitive data. We are SOC2 Type II certified and HIPAA compliant.",
  },
  {
    q: "What kind of support is available?",
    a: "Starter plans include community support with forums and documentation. Professional plans include 24-hour SLA priority support. Enterprise customers receive a dedicated success manager, custom onboarding, and 99.99% uptime SLA guarantees.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect Your Stack",
    desc: "Integrate ALP with your existing tools in minutes using our native connectors or REST API. Supports GitHub, AWS, Kubernetes, and 18+ platforms.",
    icon: LuZap,
  },
  {
    step: "02",
    title: "Configure Agents",
    desc: "Design autonomous agents using our visual workflow composer or code-first SDK. Define reasoning modes, security policies, and orchestration rules.",
    icon: LuCpu,
  },
  {
    step: "03",
    title: "Deploy & Govern",
    desc: "Ship to production with one command. ALP handles scaling, monitoring, and policy enforcement across multi-cloud and on-premise infrastructure.",
    icon: LuRocket,
  },
  {
    step: "04",
    title: "Monitor & Optimize",
    desc: "Track agent performance, reasoning quality, and cost metrics in real-time. Use built-in A/B testing and predictive analytics to continuously improve.",
    icon: LuTrendingUp,
  },
];

const SECURITY_FEATURES = [
  {
    title: "Zero-Knowledge Proofs",
    desc: "Verify policy compliance without exposing sensitive data. ZK-proofs enable auditable governance while maintaining complete data privacy.",
    icon: LuLock,
    color: "text-amber-400",
  },
  {
    title: "SOC2 & HIPAA Ready",
    desc: "Built-in audit trails, encryption at rest and in transit, and role-based access control meet the strictest regulatory requirements.",
    icon: LuShieldCheck,
    color: "text-emerald-400",
  },
  {
    title: "End-to-End Encryption",
    desc: "All data is encrypted using AES-256-GCM. Secrets management integrates with HashiCorp Vault, AWS KMS, and Azure Key Vault.",
    icon: LuLock,
    color: "text-sky-400",
  },
  {
    title: "RBAC & SSO",
    desc: "Granular role-based access control with SAML, OIDC, and OAuth2 support. Fine-grained permissions for every resource and action.",
    icon: LuUsers,
    color: "text-violet-400",
  },
];

const CODE_EXAMPLES = [
  {
    title: "Deploy a Swarm",
    code: `$ alp deploy --swarm prod --agents 12 --verify`,
    output: `✦ Initializing swarm mesh with 12 autonomous agents...
├── Merkle root: 0xab3f...9e2c (strict verification)
├── ZK policy proof generated (143ms)
├── Federation sync: us-east-1, eu-west-1, ap-south-1
└── ✓ Deployed successfully in 4.2s — all agents healthy`,
    lang: "bash",
  },
  {
    title: "Define a Policy",
    code: `import { ALP } from "@alp/enterprise";

const policy = ALP.policy("secure-swarm")
  .require("zk-proof")
  .require("audit-log")
  .maxAgents(100)
  .region(["us-east-1", "eu-west-1"])
  .compliance("SOC2", "HIPAA");`,
    output: `✓ Policy compiled in 12ms
✓ ZK circuit generated (2.1MB)
✓ Attached to swarm mesh
Ready for deployment.`,
    lang: "typescript",
  },
  {
    title: "Monitor Agents",
    code: `alp monitor --swarm prod --live

# Real-time telemetry stream`,
    output: `┌─────────────┬────────┬────────┬────────┐
│ Agent       │ Status │ Latency│ Reasoning│
├─────────────┼────────┼────────┼────────┤
│ agent-01    │ healthy│ 42ms   │ chain-of-thought │
│ agent-02    │ healthy│ 38ms   │ critique │
│ agent-03    │ busy   │ 156ms  │ synthesis │
└─────────────┴────────┴────────┴────────┘`,
    lang: "bash",
  },
];

const CASE_STUDIES = [
  {
    company: "NeuralScale",
    logo: "NS",
    challenge: "Managing 50+ AI agents across 3 cloud regions with inconsistent policies",
    solution: "Deployed ALP's swarm orchestration with ZK policy proofs across all regions",
    results: ["400+ hours saved in Q1", "99.99% uptime achieved", "SOC2 audit passed in 2 weeks"],
    gradient: "from-violet-500 to-purple-600",
  },
  {
    company: "FinGuard Technologies",
    logo: "FG",
    challenge: "HIPAA compliance for AI-driven fraud detection across 10M+ transactions daily",
    solution: "Implemented ALP's zero-trust security with end-to-end encryption and audit trails",
    results: ["Zero security incidents", "90% faster compliance reporting", "Regulatory approval in 3 months"],
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    company: "Quantum Dynamics",
    logo: "QD",
    challenge: "Orchestrating quantum-classical hybrid workflows across distributed teams",
    solution: "Used ALP's federation mesh for multi-region quantum circuit composition",
    results: ["2x faster circuit design", "80% reduction in coordination overhead", "3 new quantum products launched"],
    gradient: "from-sky-500 to-cyan-600",
  },
];

const FOOTER_LINKS = {
  Product: [
    { label: "Reasoning Studio", path: "/login" },
    { label: "Agent Studio", path: "/login" },
    { label: "Swarm Orchestration", path: "/login" },
    { label: "Federation Mesh", path: "/login" },
    { label: "Downloads", path: "/login" },
    { label: "Changelog", path: "/login" },
  ],
  Solutions: [
    { label: "Enterprise AI", path: "/login" },
    { label: "Quantum Computing", path: "/login" },
    { label: "Security & Compliance", path: "/login" },
    { label: "DevOps Automation", path: "/login" },
    { label: "Data Engineering", path: "/login" },
  ],
  Developers: [
    { label: "Documentation", path: "/login" },
    { label: "API Reference", path: "/login" },
    { label: "CLI Tools", path: "/login" },
    { label: "SDK Downloads", path: "/login" },
    { label: "Status Page", path: "/login" },
  ],
  Company: [
    { label: "About", path: "/login" },
    { label: "Blog", path: "/login" },
    { label: "Careers", path: "/login" },
    { label: "Contact", path: "/login" },
    { label: "Press Kit", path: "/login" },
  ],
};

/* ────────────────────────────── FAQ Accordion ────────────────────────────── */
function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-800/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{item.q}</span>
        <LuChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-5 pr-8 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── MAIN COMPONENT ────────────────────────────── */
export default function HomePage() {
  const [activeProduct, setActiveProduct] = useState(0);

  /* Auto-rotate product showcase */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProduct((p) => (p + 1) % PRODUCT_SHOWCASE.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      {/* ═══════════════════ NAVIGATION ═══════════════════ */}
      <nav className="glass-dark border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-sky-400 via-indigo-500 to-emerald-400 rounded-xl p-0.5 shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
                  <LogoIcon size="md" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black gradient-text tracking-tight leading-none">ALP Enterprise</span>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-0.5">Protocol v85.0</span>
              </div>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-6">
              {["Features", "Products", "Testing", "Pricing", "Docs"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-slate-300 hover:text-white font-medium transition-colors hidden sm:inline">
                Sign in
              </Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-300"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ═══════════════════ HERO SECTION ═══════════════════ */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0">
            {/* Existing ambient glow orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-sky-500/8 via-indigo-500/4 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-40 left-20 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
            <div className="absolute top-60 right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slower pointer-events-none" />
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36">
            <div className="text-center max-w-4xl mx-auto space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
                <LuSparkles className="w-3.5 h-3.5" />
                v85.0 Released — Neuromorphic Mesh & ZK Policy Engine
                <LuArrowRight className="w-3 h-3" />
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                <span className="text-white">The Operating System for</span>
                <br />
                <span className="bg-gradient-to-r from-sky-300 via-indigo-400 to-emerald-300 bg-clip-text text-transparent">
                  Autonomous Intelligence
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Build, deploy, and govern AI-native applications with swarm orchestration, predictive policy,
                and enterprise-grade security — all on a single protocol.
              </p>

              {/* Live Metrics Ticker */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-2">
                {[
                  { value: "2M+", label: "API calls / day" },
                  { value: "99.98%", label: "Uptime SLA" },
                  { value: "14+", label: "Products" },
                  { value: "50ms", label: "Avg latency" },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <div className="text-lg sm:text-xl font-black text-white">{m.value}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  to="/login"
                  className="group flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:shadow-2xl hover:shadow-sky-500/25 transition-all duration-300"
                >
                  Start Building Free
                  <LuArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="group flex items-center gap-2 glass-dark border border-slate-700 text-slate-200 px-8 py-3.5 rounded-xl font-semibold text-base hover:border-slate-600 hover:text-white transition-all duration-300"
                >
                  <LuPlay className="w-4 h-4" />
                  Watch Demo
                </Link>
              </div>

              {/* Terminal preview */}
              <div className="max-w-2xl mx-auto pt-6">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-slate-950/50">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 ml-2">alp-cli — enterprise</span>
                  </div>
                  <div className="p-4 font-mono text-sm space-y-2 text-left">
                    <div className="flex gap-2">
                      <span className="text-emerald-400">$</span>
                      <span className="text-slate-300">alp deploy --swarm prod --agents 12 --verify</span>
                    </div>
                    <div className="text-sky-400/80 text-xs">
                      ✦ Initializing swarm mesh with 12 autonomous agents...
                    </div>
                    <div className="text-slate-500 text-xs">
                      ├── Merkle root: 0xab3f...9e2c (strict verification)
                    </div>
                    <div className="text-slate-500 text-xs">
                      ├── ZK policy proof generated (143ms)
                    </div>
                    <div className="text-slate-500 text-xs">
                      ├── Federation sync: us-east-1, eu-west-1, ap-south-1
                    </div>
                    <div className="text-emerald-400 text-xs">
                      └── ✓ Deployed successfully in 4.2s — all agents healthy
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ TRUST LOGOS ═══════════════════ */}
        <section className="border-t border-slate-800/60 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-8">
              Trusted by innovative teams worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {["NeuralScale", "Distributed Systems Inc.", "FinGuard Technologies", "Quantum Dynamics", "CyberMesh Labs", "SwarmAI Corp"].map((name) => (
                <div key={name} className="text-slate-600 text-sm font-bold tracking-wider uppercase hover:text-slate-400 transition-colors cursor-default">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ CORE FEATURES ═══════════════════ */}
        <section id="features" className="border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                <LuLayers className="w-3 h-3" />
                Core Capabilities
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Everything You Need to Build
                <br />
                <span className="gradient-text">Autonomous Systems</span>
              </h2>
              <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                From reasoning and orchestration to security and quantum computing — a unified platform for the entire AI lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {CORE_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg ${feature.glow} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════ PRODUCT SHOWCASE ═══════════════════ */}
        <section id="products" className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4">
                <LuBox className="w-3 h-3" />
                Product Suite
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                14+ Specialized Products
              </h2>
              <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                From quantum computing to security operations — purpose-built tools for every engineering domain.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Product list */}
              <div className="space-y-2">
                {PRODUCT_SHOWCASE.map((product, i) => {
                  const PIcon = product.icon;
                  const isActive = activeProduct === i;
                  const content = (
                    <div className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActive ? "bg-slate-900" : "bg-slate-800/40"
                        }`}
                      >
                        <PIcon className={`w-5 h-5 ${product.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold transition-colors ${isActive ? "text-white" : "text-slate-300"}`}>
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{product.desc}</p>
                      </div>
                      {isActive && <LuChevronRight className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                    </div>
                  );
                  if (product.link) {
                    return (
                      <Link key={product.name} to={product.link} className="block">
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={product.name}
                      onClick={() => setActiveProduct(i)}
                      className={`w-full flex items-center gap-4 transition-all duration-300 ${
                        isActive
                          ? "bg-slate-800/60 border border-slate-700/60 shadow-lg"
                          : "hover:bg-slate-900/40 border border-transparent"
                      }`}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>

              {/* Active product detail */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 lg:sticky lg:top-24">
                {(() => {
                  const p = PRODUCT_SHOWCASE[activeProduct];
                  const PIcon = p.icon;
                  return (
                    <div className="space-y-6 animate-in fade-in duration-300" key={activeProduct}>
                      <div className={`w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center`}>
                        <PIcon className={`w-8 h-8 ${p.color}`} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">{p.name}</h3>
                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
                      </div>
                      <div className="space-y-3">
                        {(p.features || []).map((f) => (
                          <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                            <LuCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/20 transition-all"
                      >
                        Try {p.name}
                        <LuArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ STATS ═══════════════════ */}
        <section className="border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center space-y-2">
                  <div className="text-4xl sm:text-5xl font-black gradient-text">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm font-bold text-white">{stat.label}</div>
                  <div className="text-xs text-slate-500">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ ARCHITECTURE ═══════════════════ */}
        <section className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
                <LuServer className="w-3 h-3" />
                Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Built for Enterprise Scale
              </h2>
              <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                A distributed, fault-tolerant architecture designed to handle millions of operations per second.
              </p>
            </div>

            {/* Architecture diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Client Layer */}
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Client Layer</span>
                </div>
                {[
                  { icon: LuTerminal, label: "SHAM Desktop IDE", desc: "Full-featured development environment" },
                  { icon: LuCode, label: "CLI Tools", desc: "Command-line interface for automation" },
                  { icon: LuGlobe, label: "Web Dashboard", desc: "Browser-based management console" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3 hover:border-sky-500/30 transition-colors">
                    <item.icon className="w-5 h-5 text-sky-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Protocol Core */}
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Protocol Core</span>
                </div>
                <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl p-5 space-y-3">
                  {[
                    { label: "Reasoning Engine", icon: LuBrainCircuit },
                    { label: "Swarm Orchestrator", icon: LuActivity },
                    { label: "Merkle Verifier", icon: LuLock },
                    { label: "Policy Engine", icon: LuShieldCheck },
                    { label: "Federation Router", icon: LuWifi },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/40 rounded-lg">
                      <item.icon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure */}
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Infrastructure</span>
                </div>
                {[
                  { icon: LuCloud, label: "Multi-Cloud Deploy", desc: "AWS, Azure, GCP, on-premise" },
                  { icon: LuDatabase, label: "Distributed Storage", desc: "Event-sourced, CRDTs, Merkle trees" },
                  { icon: LuEye, label: "Observability", desc: "Traces, metrics, logs, alerting" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3 hover:border-emerald-500/30 transition-colors">
                    <item.icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
        <section className="border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-4">
                <LuPlay className="w-3 h-3" />
                Getting Started
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Up and Running in Minutes
              </h2>
              <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                From zero to production deployment with just four simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="group relative bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 hover:border-sky-500/30 transition-all duration-300 hover:-translate-y-1">
                    <div className="text-4xl font-black gradient-text mb-4 opacity-30 group-hover:opacity-60 transition-opacity">
                      {item.step}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-5 h-5 text-sky-400" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════ SECURITY DEEP DIVE ═══════════════════ */}
        <section className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-4">
                <LuShieldCheck className="w-3 h-3" />
                Security & Compliance
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Enterprise-Grade Security Built In
              </h2>
              <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                Every layer of the stack is designed with security-first principles. From zero-knowledge proofs to end-to-end encryption.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {SECURITY_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Compliance badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-slate-800/60">
              {["SOC2 Type II", "HIPAA Compliant", "GDPR Ready", "ISO 27001", "PCI DSS"].map((badge) => (
                <div key={badge} className="px-4 py-2 bg-slate-900/40 border border-slate-800/60 rounded-lg text-xs font-semibold text-slate-400">
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
        <section className="border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-4">
                <LuHeart className="w-3 h-3" />
                Testimonials
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Loved by Engineering Teams
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 hover:border-slate-700/60 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <LuStar key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-slate-300 leading-relaxed mb-6 italic">
                    "{t.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center border border-sky-500/20">
                      <span className="text-xs font-bold text-sky-300">{t.avatar}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ CASE_STUDIES ═══════════════════ */}
        <section className="border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                <LuBookOpen className="w-3 h-3" />
                Case Studies
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Real Results from Real Teams
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CASE_STUDIES.map((cs) => (
                <div key={cs.company} className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 hover:border-slate-700/60 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cs.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                      {cs.logo}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{cs.company}</div>
                      <div className="text-xs text-slate-500">Enterprise customer</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Challenge</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{cs.challenge}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">Solution</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{cs.solution}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Results</div>
                      <ul className="space-y-1">
                        {cs.results.map((r) => (
                          <li key={r} className="flex items-start gap-2 text-sm text-slate-300">
                            <LuCheck className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ PRICING ═══════════════════ */}
        <section id="pricing" className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-4">
                <LuRocket className="w-3 h-3" />
                Pricing
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-base text-slate-400">Start free. Scale when ready.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative bg-slate-900/50 border ${tier.border} rounded-2xl p-6 flex flex-col ${
                    tier.popular ? "ring-2 ring-sky-500/30 scale-[1.02]" : ""
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{tier.desc}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">{tier.price}</span>
                      <span className="text-sm text-slate-500">{tier.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <LuCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/login"
                    className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      tier.popular
                        ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20"
                        : "bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ INTEGRATIONS ═══════════════════ */}
        <section className="border-t border-slate-800/60 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Integrates with Your Stack
              </h2>
              <p className="mt-3 text-sm text-slate-400">18+ native integrations and growing.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {INTEGRATIONS.map((name) => (
                <div
                  key={name}
                  className="px-4 py-2.5 bg-slate-900/40 border border-slate-800/60 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:border-sky-500/30 hover:bg-sky-500/5 transition-all duration-300 cursor-default"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ TESTING PRODUCT ═══════════════════ */}
        <section id="testing" className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4">
                <LuActivity className="w-3 h-3" />
                ALP Test
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Ship Faster with Autonomous Testing
              </h2>
              <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                E2E browser automation, visual regression, and AI-generated tests in one CLI. Built for teams that ship on rhythm.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-4">
                  <LuPlay className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">E2E Testing</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Playwright-class browser automation with multi-browser support, network interception, and trace viewer.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-4">
                  <LuEye className="w-6 h-6 text-sky-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Visual Regression</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Pixel-level diff with perceptual matching, baseline management, and AI-assisted flake filtering.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-4">
                  <LuSparkles className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">AI Test Generation</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Generate tests from natural language or PR diffs. Self-healing selectors and flake prediction built in.</p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Add ALP Test to your CI in minutes</h3>
                  <p className="text-sm text-slate-400 mt-1">One CLI install. Existing Playwright workflows supported.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/products/alp-test" className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/20 transition-all">
                    Explore ALP Test
                  </Link>
                  <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ FEATURED: ALP TEST ═══════════════════ */}
        <section className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                  <LuActivity className="w-3 h-3" />
                  New Product
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ALP Test is now in beta
                </h2>
                <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                  Playwright-class E2E, visual regression, and AI-generated tests in one CLI. Add it to your CI pipeline in minutes and ship with confidence.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link to="/products/alp-test" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/20 transition-all">
                    View Product Details
                    <LuArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                    Get Started
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:w-96 w-full">
                {["Playwright-class E2E", "Visual regression diff", "AI test generation", "Self-healing selectors"].map((feature) => (
                  <div key={feature} className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-300">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ FAQ ═══════════════════ */}
        <section id="docs" className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-4">
                <LuMessageCircle className="w-3 h-3" />
                FAQ
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="divide-y-0">
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.q} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ DEVELOPER EXPERIENCE ═══════════════════ */}
        <section className="border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
                <LuCode className="w-3 h-3" />
                Developer Experience
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Built for Developers, by Developers
              </h2>
              <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
                Clean APIs, powerful SDKs, and comprehensive documentation. Ship faster with tooling you'll actually enjoy using.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {CODE_EXAMPLES.map((example) => (
                <div key={example.title} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-300">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 ml-2">{example.title}</span>
                  </div>
                  <div className="p-4 font-mono text-sm space-y-2">
                    <div className="text-slate-300 whitespace-pre-wrap break-all">{example.code}</div>
                    {example.output && (
                      <div className="pt-2 border-t border-slate-800/60">
                        <div className="text-emerald-400/80 text-xs whitespace-pre-wrap break-all">{example.output}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* SDK badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
              {["Python SDK", "TypeScript SDK", "Go SDK", "Rust SDK", "Java SDK", "CLI Tools"].map((sdk) => (
                <div key={sdk} className="px-4 py-2 bg-slate-900/40 border border-slate-800/60 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:border-sky-500/30 hover:bg-sky-500/5 transition-all duration-300 cursor-default">
                  {sdk}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ CTA BANNER ═══════════════════ */}
        <section className="border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="relative overflow-hidden bg-gradient-to-br from-sky-500/10 via-indigo-500/15 to-purple-500/10 border border-sky-500/20 rounded-3xl p-10 sm:p-14 text-center">
              <div className="absolute top-0 left-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
              <div className="relative space-y-6">
                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  Ready to Build the Future?
                </h2>
                <p className="text-base text-slate-400 max-w-xl mx-auto">
                  Join thousands of engineering teams already using ALP Enterprise to ship autonomous AI applications with confidence.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/login"
                    className="group flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:shadow-2xl hover:shadow-sky-500/25 transition-all duration-300"
                  >
                    Get Started Free
                    <LuArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    Talk to Sales
                    <LuChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-slate-800/60 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Footer grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 via-indigo-500 to-emerald-400 rounded-lg p-0.5">
                  <div className="w-full h-full bg-slate-950 rounded-md flex items-center justify-center text-sky-400">
                    <LogoIcon size="sm" />
                  </div>
                </div>
                <span className="text-sm font-black gradient-text">ALP Enterprise</span>
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                The world's most advanced platform for building, deploying, and governing autonomous AI systems.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                {[LuTwitter, LuGithub, LuLinkedin, LuYoutube].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-700 transition-all">
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">{category}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.path} className="text-sm text-slate-500 hover:text-slate-200 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} ALP Enterprise. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-slate-600">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Cookie Policy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
