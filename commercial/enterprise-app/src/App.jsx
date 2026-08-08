import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "./hooks/useAuth.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Layout from "./components/Layout.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const WorkspacesPage = lazy(() => import("./pages/WorkspacesPage.jsx"));
const SavingsPage = lazy(() => import("./pages/SavingsPage.jsx"));
const BillingPage = lazy(() => import("./pages/BillingPage.jsx"));
const IdePage = lazy(() => import("./pages/IdePage.jsx"));
const BusinessModelPage = lazy(() => import("./pages/BusinessModelPage.jsx"));
const ProductsPage = lazy(() => import("./pages/ProductsPage.jsx"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage.jsx"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard.jsx"));
const CloudWorkspacePage = lazy(() => import("./pages/CloudWorkspacePage.jsx"));
const MobileAppPage = lazy(() => import("./pages/MobileAppPage.jsx"));
const AgentStudioPage = lazy(() => import("./pages/AgentStudioPage.jsx"));
const SecurityScannerPage = lazy(() => import("./pages/SecurityScannerPage.jsx"));
const AnalyticsBiPage = lazy(() => import("./pages/AnalyticsBiPage.jsx"));
const DevOpsBridgePage = lazy(() => import("./pages/DevOpsBridgePage.jsx"));
const ModelHubPage = lazy(() => import("./pages/ModelHubPage.jsx"));
const DataPipelineStudioPage = lazy(() => import("./pages/DataPipelineStudioPage.jsx"));
const HybridEngineerPage = lazy(() => import("./pages/HybridEngineerPage.jsx"));
const QuantumEngineerPage = lazy(() => import("./pages/QuantumEngineerPage.jsx"));
const ChipDesignStudioPage = lazy(() => import("./pages/ChipDesignStudioPage.jsx"));
const SocSentinelPage = lazy(() => import("./pages/SocSentinelPage.jsx"));
const ThreatIntelPage = lazy(() => import("./pages/ThreatIntelPage.jsx"));
const ZeroTrustPage = lazy(() => import("./pages/ZeroTrustPage.jsx"));
const ReasoningStudioPage = lazy(() => import("./pages/ReasoningStudioPage.jsx"));
const DocsPage = lazy(() => import("./pages/DocsPage.jsx"));
const EcosystemPage = lazy(() => import("./pages/EcosystemPage.jsx"));
const FederationStudioPage = lazy(() => import("./pages/FederationStudioPage.jsx"));
const ZKProofStudioPage = lazy(() => import("./pages/ZKProofStudioPage.jsx"));
const DownloadsPage = lazy(() => import("./pages/DownloadsPage.jsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));
const TeamPage = lazy(() => import("./pages/TeamPage.jsx"));
const ApiExplorerPage = lazy(() => import("./pages/ApiExplorerPage.jsx"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage.jsx"));
const StatusPage = lazy(() => import("./pages/StatusPage.jsx"));
const NeuromorphicStudioPage = lazy(() => import("./pages/NeuromorphicStudioPage.jsx"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center text-gray-300">Loading...</div>
);

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        {user ? (
          <Route path="/*" element={<Layout />}>
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="workspaces" element={<Suspense fallback={<PageLoader />}><WorkspacesPage /></Suspense>} />
            <Route path="ide/:id" element={<Suspense fallback={<PageLoader />}><IdePage /></Suspense>} />
            <Route path="business-model" element={<Suspense fallback={<PageLoader />}><BusinessModelPage /></Suspense>} />
            <Route path="products" element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsDashboard /></Suspense>} />
            <Route path="products/cloud-workspace" element={<Suspense fallback={<PageLoader />}><CloudWorkspacePage /></Suspense>} />
            <Route path="products/mobile-app" element={<Suspense fallback={<PageLoader />}><MobileAppPage /></Suspense>} />
            <Route path="products/agent-studio" element={<Suspense fallback={<PageLoader />}><AgentStudioPage /></Suspense>} />
            <Route path="products/security-scanner" element={<Suspense fallback={<PageLoader />}><SecurityScannerPage /></Suspense>} />
            <Route path="products/analytics-bi" element={<Suspense fallback={<PageLoader />}><AnalyticsBiPage /></Suspense>} />
            <Route path="products/devops-bridge" element={<Suspense fallback={<PageLoader />}><DevOpsBridgePage /></Suspense>} />
            <Route path="products/model-hub" element={<Suspense fallback={<PageLoader />}><ModelHubPage /></Suspense>} />
            <Route path="products/data-pipeline-studio" element={<Suspense fallback={<PageLoader />}><DataPipelineStudioPage /></Suspense>} />
            <Route path="products/hybrid-engineer" element={<Suspense fallback={<PageLoader />}><HybridEngineerPage /></Suspense>} />
            <Route path="products/quantum-engineer" element={<Suspense fallback={<PageLoader />}><QuantumEngineerPage /></Suspense>} />
            <Route path="products/chip-design-studio" element={<Suspense fallback={<PageLoader />}><ChipDesignStudioPage /></Suspense>} />
            <Route path="products/soc-sentinel" element={<Suspense fallback={<PageLoader />}><SocSentinelPage /></Suspense>} />
            <Route path="products/threat-intel" element={<Suspense fallback={<PageLoader />}><ThreatIntelPage /></Suspense>} />
            <Route path="products/zero-trust" element={<Suspense fallback={<PageLoader />}><ZeroTrustPage /></Suspense>} />
            <Route path="products/reasoning-studio" element={<Suspense fallback={<PageLoader />}><ReasoningStudioPage /></Suspense>} />
            <Route path="reasoning-studio" element={<Suspense fallback={<PageLoader />}><ReasoningStudioPage /></Suspense>} />
            <Route path="ecosystem" element={<Suspense fallback={<PageLoader />}><EcosystemPage /></Suspense>} />
            <Route path="federation-studio" element={<Suspense fallback={<PageLoader />}><FederationStudioPage /></Suspense>} />
            <Route path="zk-proofs" element={<Suspense fallback={<PageLoader />}><ZKProofStudioPage /></Suspense>} />
            <Route path="downloads" element={<Suspense fallback={<PageLoader />}><DownloadsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
            <Route path="team" element={<Suspense fallback={<PageLoader />}><TeamPage /></Suspense>} />
            <Route path="api-explorer" element={<Suspense fallback={<PageLoader />}><ApiExplorerPage /></Suspense>} />
            <Route path="marketplace" element={<Suspense fallback={<PageLoader />}><MarketplacePage /></Suspense>} />
            <Route path="status" element={<Suspense fallback={<PageLoader />}><StatusPage /></Suspense>} />
            <Route path="neuromorphic-studio" element={<Suspense fallback={<PageLoader />}><NeuromorphicStudioPage /></Suspense>} />
            <Route path="products/:id" element={<Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>} />
            <Route path="docs" element={<Suspense fallback={<PageLoader />}><DocsPage /></Suspense>} />
            <Route path="hybrid-engineer" element={<Suspense fallback={<PageLoader />}><HybridEngineerPage /></Suspense>} />
            <Route path="savings" element={<Suspense fallback={<PageLoader />}><SavingsPage /></Suspense>} />
            <Route path="billing" element={<Suspense fallback={<PageLoader />}><BillingPage /></Suspense>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </ErrorBoundary>
  );
}

