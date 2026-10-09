import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Settings,
  LogOut,
  User,
  Plus,
  FileText,
  Search,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useBusinessStore } from "../../store/businessStore";
import { useOfflineStore } from "../../store/offlineStore";
import { useTranslation } from "../../i18n/useTranslation";
import { type IBusiness } from "../../services/business.service";
import BusinessSwitcher from "../../components/shared/BusinessSwitcher";
import ThemeToggle from "../../components/shared/ThemeToggle";
import LanguageToggle from "../../components/shared/LanguageToggle";
import SyncStatusIndicator from "../../components/shared/SyncStatusIndicator";
import FloatingAI from "../../pages/Ai/FloatingAI";

const C = {
  bg: "var(--bg)",
  sidebar: "var(--bg-sidebar)",
  border: "var(--border-light)",
  navActive: "var(--nav-active-bg)",
};

const PAGE_TITLE_KEYS: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/transactions": "nav.transactions",
  "/members": "nav.members",
  "/meals": "nav.meals",
  "/settings": "nav.settings",
  "/dues": "nav.dues",
  "/invoices": "nav.invoices",
  "/mess": "nav.messSummary",
  "/business/new": "nav.newBusiness",
  "/customers": "nav.customers",
  "/suppliers": "nav.suppliers",
  "/products": "nav.products",
  "/sales": "nav.sales",
  "/purchases": "nav.purchases",
  "/expenses": "nav.expenses",
  "/baki": "nav.baki",
  "/ledger": "nav.ledger",
  "/reports": "nav.reports",
  "/business/settings": "nav.businessSettings",
};

const getPageTitleKey = (path: string) => {
  const exact = PAGE_TITLE_KEYS[path];
  if (exact) return exact;
  const partial = Object.entries(PAGE_TITLE_KEYS).find(([k]) => path.startsWith(k) && k !== "/");
  return partial ? partial[1] : "app.name";
};

export interface DesktopLayoutProps {
  visibleNav: Array<{
    to: string;
    icon: React.ElementType;
    labelKey: string;
    group: string;
  }>;
  onBusinessSwitch: (biz: IBusiness) => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  visibleNav,
  onBusinessSwitch,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();

  const [showUserMenu, setShowUserMenu] = useState(false);

  // Sync state
  const connectivity = useOfflineStore((s) => s.connectivity);
  const syncing = useOfflineStore((s) => s.syncing);
  const pending = useOfflineStore((s) => s.pending);
  const failed = useOfflineStore((s) => s.failed);
  const conflicts = useOfflineStore((s) => s.conflicts);
  const allSynced =
    failed === 0 &&
    conflicts === 0 &&
    pending === 0 &&
    !syncing &&
    connectivity !== "offline";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isActive = (to: string) =>
    to === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(to);

  const pageTitle = t(getPageTitleKey(location.pathname));

  const isBusinessMode = activeBusiness?.type === "business";

  return (
    <div className="min-h-screen flex w-full" style={{ background: C.bg }}>
      {/* ── Desktop Persistent Sidebar (260px) ────────────────── */}
      <aside
        className="w-64 flex-col flex-shrink-0 h-screen sticky top-0 flex z-30 select-none"
        style={{
          background: C.sidebar,
          borderRight: `1px solid ${C.border}`,
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/20">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <span
                className="font-bold text-lg leading-none tracking-tight block truncate"
                style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
              >
                {t("app.name")}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Web Workspace
              </span>
            </div>
          </div>

          {allSynced && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              title={t("offline.allSynced")}
              aria-label={t("offline.allSynced")}
              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
            >
              <Check size={14} />
            </div>
          )}
        </div>

        {/* Business Switcher Context */}
        <div className="px-3.5 mb-3 flex-shrink-0">
          <BusinessSwitcher onSelect={onBusinessSwitch} />
        </div>

        {/* Nav Links */}
        <nav
          className="flex-1 min-h-0 px-3 space-y-1 overflow-y-auto overscroll-contain"
          style={{ scrollbarWidth: "thin" }}
        >
          {visibleNav.map(({ to, icon: Icon, labelKey }) => {
            const active = isActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all group font-medium"
                style={{
                  background: active ? C.navActive : "transparent",
                  color: active ? "#10b981" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = active ? C.navActive : "transparent";
                }}
              >
                <Icon
                  size={17}
                  className={`transition-colors ${
                    active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                  }`}
                />
                <span className="truncate flex-1">{t(labelKey)}</span>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </NavLink>
            );
          })}

          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all group font-medium"
            style={{
              background: isActive("/settings") ? C.navActive : "transparent",
              color: isActive("/settings") ? "#10b981" : "var(--text-secondary)",
            }}
          >
            <Settings size={17} className="text-slate-400 group-hover:text-slate-200" />
            <span className="truncate">{t("nav.settings")}</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer: Theme, Language & User */}
        <div className="p-3 border-t border-[var(--border-light)] flex-shrink-0 space-y-2 bg-[var(--surface-1)]/40">
          <div className="space-y-1.5">
            <ThemeToggle variant="row" />
            <LanguageToggle variant="row" />
          </div>

          <div className="pt-2 border-t border-[var(--border-light)] flex items-center gap-2.5 px-2 py-1.5 rounded-xl">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs shadow-sm"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-[var(--text-primary)]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10.5px] truncate text-[var(--text-faint)] leading-tight">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title={t("nav.logout")}
              aria-label={t("nav.logout")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Desktop Canvas ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar Command Header */}
        <header
          className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 lg:px-8 border-b backdrop-blur-md"
          style={{
            background: "var(--header-bg)",
            borderColor: C.border,
          }}
        >
          {/* Left: Breadcrumbs & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
                <span>{activeBusiness?.name || t("app.name")}</span>
                <ChevronRight size={12} />
                <span className="capitalize">{activeBusiness?.type || "personal"}</span>
              </div>
              <h1 className="text-lg font-bold truncate text-[var(--text-primary)] leading-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Actions, Sync & Profile */}
          <div className="flex items-center gap-3">
            <SyncStatusIndicator />

            {/* Quick Action Buttons */}
            {isBusinessMode ? (
              <button
                type="button"
                onClick={() => navigate("/sales/new")}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>+ New Sale</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>+ Add Transaction</span>
              </button>
            )}

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-xs transition-transform active:scale-95 shadow-sm"
                style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div
                    className="absolute right-0 top-11 z-50 w-56 rounded-2xl py-1 overflow-hidden shadow-xl"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    <div className="px-4 py-2.5 border-b border-[var(--border-light)]">
                      <p className="text-xs font-bold truncate text-[var(--text-primary)]">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-[11px] truncate text-[var(--text-faint)]">
                        {user?.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { navigate("/settings"); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
                    >
                      <User size={14} />
                      <span>{t("nav.profileSettings")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { navigate("/business/settings"); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left hover:bg-[var(--surface-2)] text-[var(--text-secondary)]"
                    >
                      <Settings size={14} />
                      <span>{t("nav.businessSettings")}</span>
                    </button>

                    <div className="border-t border-[var(--border-light)] my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left text-red-500 hover:bg-red-500/10 font-medium"
                    >
                      <LogOut size={14} />
                      <span>{t("nav.logout")}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Desktop Content Canvas */}
        <main className="flex-1 min-w-0 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <FloatingAI />
    </div>
  );
};

export default DesktopLayout;
