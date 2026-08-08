import { useState } from "react";
import { CheckIcon, XIcon } from "../components/Icons.jsx";

const PRICING_TIERS = [
  {
    id: "community",
    name: "Community",
    price: "Free",
    subtitle: "Open-source core protocol",
    features: [
      "Core ALP protocol engine",
      "Local development & CLI",
      "Basic agent orchestration",
      "GitHub integration (public repos)",
      "Community support",
    ],
    limitations: [
      "No cloud deployment",
      "No team collaboration",
      "Limited to 1 workspace",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    subtitle: "per developer / month",
    features: [
      "Everything in Community",
      "Cloud deployment & hosting",
      "Team collaboration (up to 5 devs)",
      "Advanced analytics & reporting",
      "Private repository support",
      "ALP Marketplace access",
      "Priority email support",
      "SSO (Google, GitHub)",
    ],
    limitations: [],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    subtitle: "per organization",
    features: [
      "Everything in Pro",
      "Unlimited developers",
      "RBAC & audit logging",
      "SSO/SAML integration",
      "Dedicated customer success",
      "SLA (99.9% uptime)",
      "On-premises deployment option",
      "Custom agent training",
      "API rate limit overrides",
    ],
    limitations: [],
    cta: "Contact Sales",
    popular: false,
  },
];

const ROI_FACTORS = [
  {
    title: "API Cost Reduction",
    description: "ALP agents resolve 78% fewer downstream API calls through intelligent context caching and predictive execution.",
    value: "78% reduction",
    metric: "token reduction",
  },
  {
    title: "Time Savings",
    description: "ALP loads context 80.6x faster (145ms → 1.8ms), reducing developer wait time from minutes to seconds.",
    value: "80.6x faster",
    metric: "context speed",
  },
  {
    title: "Rework Avoidance",
    description: "Success rate improves from 64.2% to 99.4%, eliminating costly rework and debugging cycles.",
    value: "35.2pp",
    metric: "success rate gain",
  },
  {
    title: "Savings Per Developer",
    description: "Combined savings exceed $1,400 per developer annually — the core value threshold that justifies ALP investment.",
    value: "$1,400+",
    metric: "annual savings",
  },
];

const REVENUE_STREAMS = [
  {
    name: "SaaS Subscriptions",
    share: "75%",
    description: "Recurring revenue from Pro and Enterprise subscriptions hosted on ALP Cloud.",
  },
  {
    name: "Enterprise Licenses",
    share: "15%",
    description: "Perpetual or annual licenses for on-premises deployments.",
  },
  {
    name: "Professional Services",
    share: "7%",
    description: "Custom agent training, consulting, and integration services.",
  },
  {
    name: "Marketplace",
    share: "3%",
    description: "Commission from third-party agent extensions and templates in the ALP Marketplace.",
  },
];

const GTM_STRATEGY = [
  {
    phase: "1. Product-Led Growth",
    description: "Free Community tier drives organic adoption; developers self-serve and experience ROI firsthand.",
    kpi: "10K+ Community users, 15% conversion to paid",
  },
  {
    phase: "2. Bottom-Up Sales",
    description: "In-product upgrades and team plans enable individual developers to bring ALP into their organizations.",
    kpi: "30% of Pro revenue from team-initiated upgrades",
  },
  {
    phase: "3. Enterprise Sales",
    description: "Dedicated sales team targets engineering orgs with 20+ developers, offering pilots and SLAs.",
    kpi: "$1M avg ACV, 5 enterprise logos per quarter",
  },
  {
    phase: "4. Ecosystem Expansion",
    description: "Partner integrations, marketplace, and API monetization expand the total addressable market.",
    kpi: "$5M marketplace GMV, 50+ partners",
  },
];

export default function BusinessModelPage() {
  const [activeTab, setActiveTab] = useState("pricing");

  const TABS = ["pricing", "roi", "revenue", "strategy"];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">ALP Enterprise Business Model</h1>
        <p className="text-gray-400 mt-2">The Autonomous Lifecycle Protocol — value creation and monetization strategy</p>
      </div>

      <div className="flex justify-center gap-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              activeTab === tab
                ? "bg-sky-600 text-white"
                : "bg-gray-800/40 text-gray-300 hover:bg-gray-700/40"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "pricing" && (
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`glass-dark rounded-xl shadow-lg p-6 border-2 transition-all ${
                tier.popular ? "border-sky-500" : "border-gray-700"
              }`}
            >
              {tier.popular && (
                <div className="bg-sky-600 text-white text-center py-1 rounded-lg text-xs font-semibold mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-100">{tier.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{tier.subtitle}</p>
              <p className="text-4xl font-bold text-sky-300 my-6">{tier.price}</p>
              <button
                className={`w-full py-2 rounded-lg font-medium mb-6 ${
                  tier.popular
                    ? "bg-sky-600 text-white hover:bg-sky-700"
                    : "bg-gray-700/40 text-gray-300 hover:bg-gray-600/40"
                }`}
              >
                {tier.cta}
              </button>
              <ul className="space-y-2 mb-4">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start text-sm text-gray-300">
                    <CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {tier.limitations.length > 0 && (
                <ul className="space-y-2">
                {tier.limitations.map((l) => (
                  <li key={l} className="flex items-start text-sm text-gray-500">
                    <XIcon size="sm" className="mr-2 mt-0.5 text-gray-600" />
                    {l}
                  </li>
                ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "roi" && (
        <div className="space-y-6">
          <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">ROI: How ALP Saves $1,400+ Per Developer</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROI_FACTORS.map((factor) => (
                <div key={factor.title} className="border border-gray-700 rounded-lg p-4">
                  <p className="text-3xl font-bold text-sky-400">{factor.value}</p>
                  <p className="text-xs text-gray-500 mb-2">{factor.metric}</p>
                  <p className="font-medium text-sm mb-1 text-gray-300">{factor.title}</p>
                  <p className="text-xs text-gray-500">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Annual Savings Breakdown (per developer)</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300">LLM API Cost Reduction (78% token reduction)</span>
                <span className="font-bold text-green-400">$660</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300">Time Savings (80.6x faster context loading)</span>
                <span className="font-bold text-green-400">$480</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300">Rework Avoided (35.2pp success rate gain)</span>
                <span className="font-bold text-green-400">$260</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-sky-500 font-bold text-lg">
                <span className="text-gray-200">Total Annual Savings</span>
                <span className="text-sky-300">$1,400+</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Based on 2080 hours/year, $120K avg salary, $15/day API spend, 100 daily context loads, 3 tasks/dev/day
            </p>
          </div>
        </div>
      )}

      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Revenue Streams</h2>
            <div className="space-y-4">
              {REVENUE_STREAMS.map((stream) => (
                <div key={stream.name} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-900/30 rounded-lg flex items-center justify-center text-sky-300">
                    {stream.share}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-200">{stream.name} ({stream.share})</h3>
                    <p className="text-sm text-gray-400">{stream.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Unit Economics</h2>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-sky-300">$19</p>
                <p className="text-xs text-gray-500">ARPU (Pro plan, monthly)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-300">85%</p>
                <p className="text-xs text-gray-500">Gross margin (SaaS)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-300">1:5</p>
                <p className="text-xs text-gray-500">CAC:LTV ratio</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "strategy" && (
        <div className="space-y-6">
          <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Go-to-Market Strategy</h2>
            <div className="space-y-6">
              {GTM_STRATEGY.map((phase) => (
                <div key={phase.phase} className="flex gap-4">
                  <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {phase.phase.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-200">{phase.phase}</h3>
                    <p className="text-sm text-gray-400 mb-1">{phase.description}</p>
                    <p className="text-xs text-gray-500">KPI: {phase.kpi}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Target Market</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold mb-2 text-gray-200">TAM ($120B)</h3>
                <p className="text-sm text-gray-400">Global developer tools & AI coding assistants market</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold mb-2 text-gray-200">SAM ($40B)</h3>
                <p className="text-sm text-gray-400">Enterprise engineering teams using LLM-powered dev tools</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold mb-2 text-gray-200">SOM ($2.4B)</h3>
                <p className="text-sm text-gray-400">Capture 6% of SAM by 2027</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
