import {
  LuBrainCircuit,
  LuShieldCheck,
  LuZap,
  LuLayers,
  LuGitBranch,
  LuRocket,
  LuUsers,
  LuCpu,
  LuDatabase,
  LuActivity,
  LuLock,
  LuCloud,
  LuSparkles,
  LuAtom,
  LuTrendingUp,
} from "react-icons/lu";

export const CORE_FEATURES = [
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

export const PRODUCT_SHOWCASE = [
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

export const STATS = [
  { value: 99, suffix: ".98%", label: "Platform Uptime", desc: "Zero unplanned downtime in 12 months" },
  { value: 14, suffix: "+", label: "Products", desc: "Specialized tools for every use case" },
  { value: 2, suffix: "M+", label: "API Calls / Day", desc: "Processing at enterprise scale" },
  { value: 50, suffix: "ms", label: "Avg Latency", desc: "Sub-100ms response times globally" },
];

export const TESTIMONIALS = [
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

export const PRICING_TIERS = [
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

export const INTEGRATIONS = [
  "GitHub", "GitLab", "Slack", "Jira", "Okta", "Auth0",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
  "DataDog", "Splunk", "PagerDuty", "Grafana", "Prometheus", "Stripe",
];

export const FAQ_ITEMS = [
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

export const HOW_IT_WORKS = [
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

export const SECURITY_FEATURES = [
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

export const CODE_EXAMPLES = [
  {
    title: "Deploy a Swarm",
    code: `$ alp deploy --swarm prod --agents 12 --verify`,
    output: `<FiStar className='inline-block mr-1' /> Initializing swarm mesh with 12 autonomous agents...
├── Merkle root: 0xab3f...9e2c (strict verification)
├── ZK policy proof generated (143ms)
├── Federation sync: us-east-1, eu-west-1, ap-south-1
└── <FiCheck className='inline-block mr-1' /> Deployed successfully in 4.2s — all agents healthy`,
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
    output: `<FiCheck className='inline-block mr-1' /> Policy compiled in 12ms
<FiCheck className='inline-block mr-1' /> ZK circuit generated (2.1MB)
<FiCheck className='inline-block mr-1' /> Attached to swarm mesh
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

export const CASE_STUDIES = [
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

export const FOOTER_LINKS = {
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
