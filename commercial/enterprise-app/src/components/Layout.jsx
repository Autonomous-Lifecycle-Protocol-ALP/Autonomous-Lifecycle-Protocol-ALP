import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  DashboardIcon,
  WorkspaceIcon,
  BusinessModelIcon,
  ProductsIcon,
  AnalyticsIcon,
  HybridEngineerIcon,
  ReasoningIcon,
  LogoIcon,
  DocsIcon,
  SavingsIcon,
  BillingIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
} from "./Icons.jsx";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: DashboardIcon },
  { path: "/workspaces", label: "Workspaces", icon: WorkspaceIcon },
  { path: "/reasoning-studio", label: "Reasoning Studio", icon: ReasoningIcon },
  { path: "/hybrid-engineer", label: "Hybrid Engineer AI", icon: HybridEngineerIcon },
  { path: "/products", label: "Products", icon: ProductsIcon },
  { path: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { path: "/business-model", label: "Business Model", icon: BusinessModelIcon },
  { path: "/docs", label: "Documentation", icon: DocsIcon },
  { path: "/savings", label: "Savings Calculator", icon: SavingsIcon },
  { path: "/billing", label: "Billing", icon: BillingIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [drawerOpen]);

  const getUserInitials = (user) => {
    if (user?.name) {
      return user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen text-gray-100">
      <nav className="glass-dark border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center space-x-3 group">
                  <div className="w-9 h-9 bg-gradient-to-br from-sky-400 via-indigo-500 to-emerald-400 rounded-xl p-0.5 shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-smooth">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
                      <LogoIcon size="md" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black gradient-text tracking-tight leading-none">ALP Enterprise</span>
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">Protocol v82.0</span>
                  </div>
                </Link>
              </div>

              <div className="hidden lg:ml-10 lg:flex lg:items-center lg:space-x-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth ${
                        isActive
                          ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/20"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon size="sm" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-300">{user?.name || user?.email}</span>
                <div className="w-8 h-8 bg-sky-900/40 rounded-full flex items-center justify-center">
                  <span className="text-sky-300 font-medium text-xs">
                    {getUserInitials(user)}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800/40 transition-smooth"
                  title="Logout"
                >
                  <LogoutIcon size="sm" />
                </button>
              </div>
            </div>

            <div className="lg:hidden flex items-center ml-2">
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 rounded-lg transition-smooth"
                title={drawerOpen ? "Close menu" : "Open menu"}
              >
                {drawerOpen ? <CloseIcon size="md" /> : <MenuIcon size="md" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu overlay"
        />
      )}

      <div
        className={`fixed top-16 left-0 bottom-0 w-64 glass-dark shadow-xl transform transition-transform duration-300 ease-in-out z-40 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pt-2 pb-4 overflow-y-auto h-full">
          <nav className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                    isActive
                      ? "glass-dark bg-sky-900/40 text-sky-300"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
                  }`}
                >
                  <Icon size="md" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-700 mt-4 pt-4 px-2">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 transition-smooth"
            >
              <LogoutIcon size="md" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
