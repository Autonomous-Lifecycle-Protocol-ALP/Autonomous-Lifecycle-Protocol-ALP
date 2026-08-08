import { useState, useEffect } from "react";
import api from "../utils/api.js";
import Skeleton from "../components/Skeleton.jsx";

export default function BillingPage() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    api.get("/billing/subscription")
      .then(({ data }) => setSubscription(data))
      .catch(() => setError("Failed to load billing data"))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (planId) => {
    try {
      setProcessing(planId);
      const { data } = await api.post("/billing/checkout", { plan: planId });
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-100">Billing & Plans</h1>
      <Skeleton className="h-32 w-full" />
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
  if (error) return <div className="bg-red-900/40 text-red-300 p-4 rounded-lg">{error}</div>;

  const plans = subscription?.prices || {};
  const currentPlan = subscription?.currentPlan || "community";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Billing & Plans</h1>

      {currentPlan && (
        <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-200">Current Plan</h2>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-sky-300 capitalize">{currentPlan}</span>
            <span className="px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-300">Active</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([planId, plan]) => {
          const isCurrent = currentPlan === planId;
          const priceDisplay = plan.custom ? "Custom" : `$${plan.monthly}/mo`;
          const features = plan.custom
            ? ["Unlimited developers", "RBAC & audit logging", "SSO/SAML", "Dedicated support", "SLA (99.9% uptime)", "On-premises deployment"]
            : [`Up to ${plan.seats} seats`, "Cloud deployment", "Team collaboration", "Advanced analytics", "Priority support"];

          return (
            <div key={planId} className={`glass-dark rounded-xl shadow-lg border-2 p-6 ${isCurrent ? "border-sky-500" : "border-gray-700"}`}>
              {isCurrent && (
                <div className="bg-sky-600 text-white text-center py-1 rounded-lg text-xs font-semibold mb-4">
                  Current Plan
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-100 capitalize">{planId}</h3>
              <p className="text-3xl font-bold text-sky-300 my-4">{priceDisplay}</p>
              <ul className="space-y-2 mb-6 text-sm">
                {features.map((f) => <li key={f} className="flex items-center text-gray-300">• {f}</li>)}
              </ul>
              <button
                onClick={() => handleCheckout(planId)}
                disabled={isCurrent || processing}
                className={`w-full py-2 rounded-lg font-medium transition-colors ${
                  isCurrent
                    ? "bg-gray-700/40 text-gray-400 cursor-not-allowed"
                    : "bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                }`}
              >
                {processing === planId ? "Processing..." : isCurrent ? "Current Plan" : "Select"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
