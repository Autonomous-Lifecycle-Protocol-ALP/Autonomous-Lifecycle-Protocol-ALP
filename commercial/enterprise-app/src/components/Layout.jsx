import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import NotificationCenter from "./NotificationCenter.jsx";
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
  LayersIcon,
  ShieldIcon,
  DownloadIcon,
  SettingsIcon,
  UsersIcon,
  CodeIcon,
  SparklesIcon,
  ActivityIcon,
} from "./Icons.jsx";
import { LuChevronDown } from "react-icons/lu";

const PRIMARY_NAV = [
  { path: "/", label: "Dashboard", icon: DashboardIcon },
  { path: "/workspaces", label: "Workspaces", icon: WorkspaceIcon },
  { path: "/reasoning-studio", label: "Reasoning Studio", icon: ReasoningIcon },
  { path: "/products", label: "Products", icon: ProductsIcon },
  { path: "/ecosystem", label: "Ecosystem Hub", icon: LayersIcon },
  { path: "/docs", label: "Docs", icon: DocsIcon },
];

const SECONDARY_NAV = [
  { path: "/neuromorphic-studio", label: "Swarm Neuromorphic Mesh", icon: SparklesIcon },
  { path: "/marketplace", label: "Swarm Marketplace", icon: SparklesIcon },
  { path: "/api-explorer", label: "API Explorer", icon: CodeIcon },
  { path: "/status", label: "System Status", icon: ActivityIcon },
  { path: "/team", label: "Team & Governance", icon: UsersIcon },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
  { path: "/downloads", label: "Downloads", icon: DownloadIcon },
  { path: "/federation-studio", label: "Swarm Federation", icon: LayersIcon },
  { path: "/zk-proofs", label: "ZK Policy Proofs", icon: ShieldIcon },
  { path: "/hybrid-engineer", label: "Hybrid Engineer AI", icon: HybridEngineerIcon },
  { path: "/analytics", label: "Analytics & BI", icon: AnalyticsIcon },
  { path: "/business-model", label: "Business Model", icon: BusinessModelIcon },
  { path: "/savings", label: "Savings Calculator", icon: SavingsIcon },
  { path: "/billing", label: "Billing & Subscription", icon: BillingIcon },
];

const ALL_NAV_ITEMS = [...PRIMARY_NAV, ...SECONDARY_NAV];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [drawerOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserInitials = (user) => {
    if (user?.name) {
      return user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const isSecondaryActive = SECONDARY_NAV.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen text-slate-100 bg-slate-950">
      <nav className="glass-dark border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-6 flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-9 h-9 bg-gradient-to-br from-sky-400 via-indigo-500 to-emerald-400 rounded-xl p-0.5 shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-smooth">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
                    <LogoIcon size="md" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black gradient-text tracking-tight leading-none">ALP Enterprise</span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">Protocol v85.0</span>
                </div>
              </Link>

              {/* Primary Navigation Links */}
              <div className="hidden lg:flex lg:items-center lg:space-x-1">
                {PRIMARY_NAV.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-smooth ${
                        isActive
                          ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/20"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon size="sm" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}

                {/* More Tools Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-smooth ${
                      isSecondaryActive || moreDropdownOpen
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <LayersIcon size="sm" />
                    <span>Ecosystem</span>
                    <LuChevronDown className={`text-xs transition-transform duration-200 ${moreDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {moreDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-56 card-glass border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="text-[10px] font-mono text-slate-500 px-3 py-1 uppercase font-semibold">
                        Tools & Services
                      </div>
                      {SECONDARY_NAV.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMoreDropdownOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-smooth ${
                              isActive
                                ? "bg-sky-500/20 text-sky-300 font-semibold"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                            }`}
                          >
                            <Icon size="sm" className="text-sky-400" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="hidden sm:flex sm:items-center sm:gap-3 flex-shrink-0">
              {/* Cluster Health Badge */}
              <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-mono text-slate-300">99.98% Uptime</span>
              </div>

              {/* Notification Center */}
              <NotificationCenter />

              {/* User Profile & Logout */}
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <span className="text-xs text-slate-300 font-medium hidden md:inline">{user?.name || user?.email}</span>
                <div className="w-8 h-8 bg-sky-900/40 rounded-full flex items-center justify-center border border-sky-500/30">
                  <span className="text-sky-300 font-semibold text-xs">
                    {getUserInitials(user)}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800/60 transition-smooth"
                  title="Logout"
                >
                  <LogoutIcon size="sm" />
                </button>
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-smooth"
                title={drawerOpen ? "Close menu" : "Open menu"}
              >
                {drawerOpen ? <CloseIcon size="md" /> : <MenuIcon size="md" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Backdrop Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu overlay"
        />
      )}

      {/* Mobile Side Drawer */}
      <div
        className={`fixed top-16 left-0 bottom-0 w-72 glass-dark shadow-2xl transform transition-transform duration-300 ease-in-out z-40 lg:hidden border-r border-slate-800 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pt-3 pb-6 overflow-y-auto h-full space-y-4 px-3 custom-scrollbar">
          <div className="text-[10px] font-mono text-slate-500 uppercase px-2 font-bold tracking-wider">
            Main Navigation
          </div>
          <nav className="space-y-1">
            {ALL_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-smooth ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-300 border border-sky-500/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon size="sm" className="text-sky-400" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 pt-4 px-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Account</span>
              <span className="font-semibold text-slate-200">{user?.name || user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition-smooth"
            >
              <LogoutIcon size="sm" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
