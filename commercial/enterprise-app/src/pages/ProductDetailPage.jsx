import { useParams, Link } from "react-router-dom";
import { PRODUCTS } from "./ProductsPage.jsx";

const ICON_MAP = {
  "Agent Persona": { icon: "🧠", color: "text-sky-300", bg: "bg-sky-900/40" },
  "Marketplace": { icon: "🛒", color: "text-purple-300", bg: "bg-purple-900/40" },
  "Mobile": { icon: "📱", color: "text-emerald-300", bg: "bg-emerald-900/40" },
  "Security": { icon: "🛡️", color: "text-red-300", bg: "bg-red-900/40" },
  "Analytics": { icon: "📊", color: "text-blue-300", bg: "bg-blue-900/40" },
  "DevOps": { icon: "🔧", color: "text-orange-300", bg: "bg-orange-900/40" },
  "Platform": { icon: "⚙️", color: "text-indigo-300", bg: "bg-indigo-900/40" },
  "SaaS": { icon: "☁️", color: "text-cyan-300", bg: "bg-cyan-900/40" },
  "AI Security Ops": { icon: "🔒", color: "text-red-300", bg: "bg-red-900/40" },
  "AI Agent": { icon: "🤖", color: "text-sky-300", bg: "bg-sky-900/40" },
  "Network Security": { icon: "🌐", color: "text-emerald-300", bg: "bg-emerald-900/40" },
  "EDA Platform": { icon: "🔩", color: "text-yellow-300", bg: "bg-yellow-900/40" },
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center glass-dark">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">404</h1>
        <p className="text-gray-400 mb-6">Product not found</p>
        <Link to="/products" className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors">
          Back to Products
        </Link>
      </div>
    );
  }

  const iconInfo = ICON_MAP[product.category] || { icon: "📦", color: "text-gray-300", bg: "bg-gray-800/40" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/products" className="text-sm text-gray-400 hover:text-gray-200">
          ← Back to Products
        </Link>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-xl ${iconInfo.bg} flex-shrink-0`}>
            <span className="text-3xl">{iconInfo.icon}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">{product.name}</h1>
            <p className="text-gray-400 mt-1">{product.tagline}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm text-gray-300">{product.tier}</span>
              <span className={`px-2 py-1 text-xs rounded ${
                product.status === "Beta" ? "bg-blue-900/30 text-blue-300" :
                product.status === "Alpha" ? "bg-purple-900/30 text-purple-300" :
                "bg-gray-700/40 text-gray-400"
              }`}>
                {product.status}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-300 mb-6 leading-relaxed">{product.description}</p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="glass-dark rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Key Features</h3>
            <ul className="space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-sky-400 mt-0.5">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-dark rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">ALP Integration</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{product.integration}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="bg-sky-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-sky-700 transition-colors">
            Request Access
          </button>
          <button className="glass-dark border border-gray-600 text-gray-200 px-6 py-2.5 rounded-lg font-medium hover:border-gray-500 transition-colors">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
