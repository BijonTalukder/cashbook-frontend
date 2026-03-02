import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  UtensilsCrossed,
  Settings,
  LogOut,
  Bell,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useBusinessStore } from "../store/businessStore";

/* ─── Design tokens ───────────────────────────────────── */
const C = {
  bg: "#0a0f1e",
  sidebar: "#080d19",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  navActive: "rgba(16,185,129,0.1)",
  navHover: "rgba(255,255,255,0.04)",
};

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/members", icon: Users, label: "Members" },
  { to: "/meals", icon: UtensilsCrossed, label: "Meals", massOnly: true },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeBusiness } = useBusinessStore();

  const isMass = activeBusiness?.type === "mass";
  const visibleNav = navItems.filter((n) => !n.massOnly || isMass);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isActive = (to: string) =>
    to === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(to);

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: C.bg }}
    >
      {/* ── Desktop Sidebar ──────────────────────── */}
      <aside
        className="hidden lg:flex w-60 flex-col flex-shrink-0 min-h-screen sticky top-0"
        style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 pt-7 pb-6">
          <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
            <TrendingUp size={15} className="text-emerald-950" />
          </div>
          <span
            className="text-white font-bold text-lg"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            CashBook
          </span>
        </div>

        {/* Active business pill */}
        {activeBusiness && (
          <div
            className="mx-4 mb-5 px-3 py-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <Building2 size={11} style={{ color: "#10b981" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">
                {activeBusiness.name}
              </p>
              <p
                className="text-[10px] capitalize"
                style={{ color: "#475569" }}
              >
                {activeBusiness.type}
              </p>
            </div>
            <ChevronRight size={12} style={{ color: "#334155" }} />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {visibleNav.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                style={{
                  background: active ? C.navActive : "transparent",
                  color: active ? "#10b981" : "#64748b",
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      C.navHover;
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div
          className="p-3 mt-4"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #10b981, #0d9488)",
              }}
            >
              <span className="text-[11px] font-bold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: "#475569" }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="transition-colors p-1"
              style={{ color: "#334155" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#334155";
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header ───────────────────── */}
      <header
        className="lg:hidden sticky top-0 z-50"
        style={{
          background: "rgba(8,13,25,0.95)",
          borderBottom: `1px solid ${C.border}`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center px-4 h-14 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={13} className="text-emerald-950" />
            </div>
            <span
              className="text-white font-bold text-base"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              CashBook
            </span>
          </div>

          {/* Active business name — centered */}
          {activeBusiness && (
            <div className="flex-1 flex justify-center">
              <span
                className="text-xs truncate max-w-[140px]"
                style={{ color: "#64748b" }}
              >
                {activeBusiness.name}
              </span>
            </div>
          )}

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "#64748b" }}
            >
              <Bell size={16} />
            </button>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #10b981, #0d9488)",
              }}
            >
              <span className="text-[10px] font-bold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────── */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ───────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50"
        style={{
          background: "rgba(8,13,25,0.97)",
          borderTop: `1px solid ${C.border}`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          className="flex items-center justify-around px-2 pt-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {visibleNav.slice(0, 5).map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
              >
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                  style={{
                    background: active ? "rgba(16,185,129,0.1)" : "transparent",
                  }}
                >
                  <Icon
                    size={20}
                    style={{ color: active ? "#10b981" : "#475569" }}
                  />
                </div>
                <span
                  className="text-[10px] transition-colors"
                  style={{
                    color: active ? "#10b981" : "#475569",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
