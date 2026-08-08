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
  { name: "Agent Studio", desc: "Visual agent builder with drag-and-drop workflow composer", icon: LuSparkles, color: "text-violet-400" },
  { name: "Hybrid Engineer AI", desc: "Multi-modal agent for hardware + software co-design", icon: LuCpu, color: "text-amber-400" },
  { name: "Data Pipeline Studio", desc: "ETL orchestration with real-time stream processing", icon: LuDatabase, color: "text-emerald-400" },
  { name: "Model Hub", desc: "Fine-tuning, A/B testing, and model lifecycle management", icon: LuBrainCircuit, color: "text-sky-400" },
  { name: "Cloud Workspace", desc: "Collaborative dev environment with Merkle-verified files", icon: LuCloud, color: "text-cyan-400" },
  { name: "DevOps Bridge", desc: "CI/CD pipeline integration with automated deployments", icon: LuGitBranch, color: "text-pink-400" },
  { name: "Security Scanner", desc: "Vulnerability detection and compliance scanning", icon: LuShieldCheck, color: "text-rose-400" },
  { name: "Analytics BI", desc: "Real-time revenue dashboards with predictive insights", icon: LuTrendingUp, color: "text-indigo-400" },
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
              {["Features", "Products", "Pricing", "Docs"].map((item) => (
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-sky-500/8 via-indigo-500/4 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-40 left-20 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute top-60 right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slower" />
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
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
                  return (
                    <button
                      key={product.name}
                      onClick={() => setActiveProduct(i)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ${
                        isActive
                          ? "bg-slate-800/60 border border-slate-700/60 shadow-lg"
                          : "hover:bg-slate-900/40 border border-transparent"
                      }`}
                    >
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
                        {["Real-time collaboration & live preview", "Integrated with swarm mesh protocol", "Enterprise RBAC & audit trails"].map((f) => (
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
