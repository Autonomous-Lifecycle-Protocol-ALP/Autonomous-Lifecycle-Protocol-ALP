import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS } from "./ProductsPage.jsx";
import {
  CheckIcon,
  XIcon,
  ReasoningIcon,
  ShieldIcon,
  AnalyticsIcon,
  ManufacturingIcon,
  LogoIcon,
  LayersIcon,
  ProductsIcon,
  ServerIcon,
  IoTIcon,
  CheckCircleIcon,
} from "../components/Icons.jsx";
import { trackProductView, trackCTAClick } from "../utils/analytics.js";

const ICON_MAP = {
  "Agent Persona": { Icon: ReasoningIcon, color: "text-sky-400", bg: "bg-sky-900/40" },
  "Marketplace": { Icon: ProductsIcon, color: "text-purple-400", bg: "bg-purple-900/40" },
  "Mobile": { Icon: IoTIcon, color: "text-emerald-400", bg: "bg-emerald-900/40" },
  "Security": { Icon: ShieldIcon, color: "text-rose-400", bg: "bg-rose-900/40" },
  "Analytics": { Icon: AnalyticsIcon, color: "text-blue-400", bg: "bg-blue-900/40" },
  "DevOps": { Icon: ManufacturingIcon, color: "text-orange-400", bg: "bg-orange-900/40" },
  "Platform": { Icon: LayersIcon, color: "text-indigo-400", bg: "bg-indigo-900/40" },
  "SaaS": { Icon: ServerIcon, color: "text-cyan-400", bg: "bg-cyan-900/40" },
  "AI Security Ops": { Icon: ShieldIcon, color: "text-rose-400", bg: "bg-rose-900/40" },
  "AI Agent": { Icon: LogoIcon, color: "text-sky-400", bg: "bg-sky-900/40" },
  "Network Security": { Icon: LayersIcon, color: "text-emerald-400", bg: "bg-emerald-900/40" },
  "EDA Platform": { Icon: ManufacturingIcon, color: "text-amber-400", bg: "bg-amber-900/40" },
  "Data Engineering": { Icon: AnalyticsIcon, color: "text-indigo-400", bg: "bg-indigo-900/40" },
};

function getStatusClasses(status) {
  switch (status) {
    case "Beta": return "bg-sky-950/50 text-sky-300 border border-sky-800/60";
    case "Alpha": return "bg-purple-950/50 text-purple-300 border border-purple-800/60";
    default: return "bg-slate-900/60 text-slate-400 border border-slate-800";
  }
}

function parseTier(tier) {
  if (!tier) return [];
  const parts = tier.split("•").map((s) => s.trim()).filter(Boolean);
  return parts.map((part) => {
    if (part === "Free") return { name: "Free", price: "Free", raw: part };
    const lower = part.toLowerCase();
    if (lower.startsWith("pro ")) {
      return { name: "Pro", price: part.slice(4), raw: part };
    }
    if (lower.startsWith("enterprise ")) {
      return { name: "Enterprise", price: part.slice(11), raw: part };
    }
    return { name: part, price: "", raw: part };
  });
}

export default function ProductPageTemplate({ product, children }) {
  const iconInfo = ICON_MAP[product.category] || { Icon: ProductsIcon, color: "text-slate-400", bg: "bg-slate-800/40" };
  const Icon = iconInfo.Icon;
  const tiers = parseTier(product.tier);

  useEffect(() => {
    trackProductView(product.id, product.name);
  }, [product.id, product.name]);

  const handleCTAClick = (cta) => {
    trackCTAClick(cta, product.id, product.name);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/products" className="text-xs text-slate-400 hover:text-sky-300 transition font-semibold">
          ← Back to Products
        </Link>
      </div>

      <div className="card-glass rounded-2xl p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl ${iconInfo.bg} border border-slate-800 flex-shrink-0 ${iconInfo.color}`}>
            <Icon size="xl" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100">{product.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{product.tagline}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-slate-300 font-medium">{product.tier}</span>
              <span className={`px-2.5 py-1 text-[10px] font-mono font-semibold rounded-full ${getStatusClasses(product.status)}`}>
                {product.status}
              </span>
            </div>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed border-t border-b border-slate-800/80 py-4">{product.description}</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Features</h3>
            <ul className="space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircleIcon className="text-emerald-400 flex-shrink-0" size="sm" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ALP Integration</h3>
            <p className="text-xs text-indigo-300 leading-relaxed font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-800">{product.integration}</p>
          </div>
        </div>

        {tiers.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pricing</h3>
            <div className={`grid gap-6 ${tiers.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`border rounded-2xl p-6 ${
                    tier.name === "Pro" ? "border-sky-500/60 bg-sky-950/20" : "border-slate-800 bg-slate-950/80"
                  }`}
                >
                  <h3 className="text-lg font-extrabold mb-2 text-slate-100">{tier.name}</h3>
                  <p className="text-2xl font-black text-sky-400 mb-4">{tier.price}</p>
                  <button
                    className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:from-sky-400 hover:to-indigo-500 transition shadow-lg shadow-sky-500/20"
                    onClick={() => handleCTAClick(tier.name === 'Free' ? 'Get Started' : tier.name === 'Pro' ? 'Start Free Trial' : 'Contact Sales')}
                  >
                    {tier.name === "Free" ? "Get Started" : tier.name === "Pro" ? "Start Free Trial" : "Contact Sales"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-sky-500/20"
            onClick={() => handleCTAClick('Request Access')}
          >
            Request Enterprise Access
          </button>
          <button
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-6 py-2.5 rounded-xl text-xs font-semibold transition"
            onClick={() => handleCTAClick('View Documentation')}
          >
            View Documentation
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}
