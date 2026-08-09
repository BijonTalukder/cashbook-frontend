import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, LayoutDashboard, ArrowLeftRight, Users,
  UtensilsCrossed, Settings, LogOut, Bell, HandCoins,
  ChevronLeft, FileText, Calculator, MoreHorizontal,
  User, Trash2, X,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useBusinessStore } from "../store/businessStore";
import BusinessSwitcher from "../components/shared/BusinessSwitcher";
import FloatingAI from "../pages/Ai/FloatingAI";
import ThemeToggle from "../components/shared/ThemeToggle";

const C = {
  bg: "var(--bg)",
  sidebar: "var(--bg-sidebar)",
  card: "var(--surface-1)",
  border: "var(--border-light)",
  navActive: "var(--nav-active-bg)",
};

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/members", icon: Users, label: "Members" },
  { to: "/meals", icon: UtensilsCrossed, label: "Meals", massOnly: true },
  { to: "/mess", icon: Calculator, label: "Mess", massOnly: true },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/dues", icon: HandCoins, label: "Dues" },
  // Settings is always shown in More drawer separately
];

// Root-level pages where back button should NOT show
const ROOT_PATHS = ["/dashboard", "/transactions", "/members", "/meals", "/settings", "/dues", "/invoices", "/mess"];
const isRootPath = (path: string) => ROOT_PATHS.some((r) => path === r);

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/members": "Members",
  "/meals": "Meals",
  "/settings": "Settings",
  "/dues": "Dues",
  "/invoices": "Invoices",
  "/mess": "Mess Summary",
  "/business/new": "New Business",
};

const getPageTitle = (path: string) => {
  const exact = PAGE_TITLES[path];
  if (exact) return exact;
  const partial = Object.entries(PAGE_TITLES).find(([k]) => path.startsWith(k) && k !== "/");
  return partial ? partial[1] : "HisabBoi";
};

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeBusiness } = useBusinessStore();

  const isMass = activeBusiness?.type === "mass";
  const visibleNav = navItems.filter((n) => !n.massOnly || isMass);

  // Bottom nav: first 4 fixed + "More" drawer for the rest
  const bottomMain = visibleNav.slice(0, 4);
  const bottomMore = visibleNav.slice(4);

  const showBack = !isRootPath(location.pathname);
  const pageTitle = getPageTitle(location.pathname);

  const [showMore, setShowMore] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const isActive = (to: string) =>
    to === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(to);

  /* ── Swipe-to-go-back gesture ─────────────────────────
     Edge swipe from left (within 40px) → go back
     Only active on mobile (touch devices)
  ─────────────────────────────────────────────────────── */
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const swipeActive = useRef(false);
  const [swipeProgress, setSwipeProgress] = useState(0); // 0–1

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      swipeActive.current = touchStartX.current < 40; // only edge swipe
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!swipeActive.current) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dy > 30) { swipeActive.current = false; setSwipeProgress(0); return; }
      if (dx > 0) {
        const progress = Math.min(dx / 120, 1);
        setSwipeProgress(progress);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!swipeActive.current) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      setSwipeProgress(0);
      swipeActive.current = false;
      if (dx > 80) navigate(-1);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: C.bg }}
    >
      {/* ── Swipe indicator (left edge) ─────────── */}
      {swipeProgress > 0 && (
        <div
          className="lg:hidden fixed left-0 top-0 bottom-0 z-[60] pointer-events-none flex items-center"
          style={{ width: `${swipeProgress * 60}px`, background: "linear-gradient(to right, rgba(16,185,129,0.15), transparent)" }}
        >
          <div
            className="ml-1 flex items-center justify-center"
            style={{ opacity: swipeProgress, transform: `translateX(${swipeProgress * 8}px)` }}
          >
            <ChevronLeft size={20} style={{ color: "#10b981" }} />
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ──────────────────────── */}
      <aside
        className="hidden lg:flex w-60 flex-col flex-shrink-0 min-h-screen sticky top-0"
        style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 pt-7 pb-5">
          <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
            <TrendingUp size={15} className="text-emerald-950" />
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            HisabBoi
          </span>
        </div>

        {/* Business switcher */}
        <div className="px-3 mb-4">
          <BusinessSwitcher onSelect={() => navigate("/transactions")} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {[...visibleNav, { to: "/settings", icon: Settings, label: "Settings" }].map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: active ? C.navActive : "transparent",
                  color: active ? "#10b981" : "var(--text-muted)",
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = active ? C.navActive : "transparent";
                }}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="px-3 mt-3">
          <ThemeToggle variant="row" />
        </div>

        {/* User */}
        <div className="p-3 mt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              <span className="text-[11px] font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight" style={{ color: "var(--text-primary)" }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 transition-colors"
              style={{ color: "var(--text-faint)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-faint)"; }}
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
          background: "var(--header-bg)",
          borderBottom: `1px solid ${C.border}`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center px-3 h-14 gap-2">

          {/* Left: back button OR logo */}
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all active:scale-90"
              style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
                <TrendingUp size={13} className="text-emerald-950" />
              </div>
              <span
                className="font-bold text-base"
                style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
              >
                HisabBoi
              </span>
            </div>
          )}

          {/* Center: page title (when back) or business switcher (root) */}
          <div className="flex-1 flex justify-center">
            {showBack ? (
              <p
                className="text-sm font-semibold truncate px-2"
                style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
              >
                {pageTitle}
              </p>
            ) : (
              <BusinessSwitcher onSelect={() => navigate("/transactions")} />
            )}
          </div>

          {/* Right: theme toggle + avatar with dropdown */}
          <div className="flex items-center gap-1.5 flex-shrink-0 relative">
            <ThemeToggle />
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              <span className="text-[10px] font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="absolute right-0 top-10 z-50 w-52 rounded-2xl py-1 overflow-hidden"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-elevated)" }}
                >
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--surface-4)" }}>
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: User, label: "Profile & Settings", action: () => { navigate("/settings"); setShowUserMenu(false); } },
                    { icon: LogOut, label: "Logout", action: handleLogout, danger: false },
                    { icon: Trash2, label: "Delete Account", action: () => { navigate("/data-deletion"); setShowUserMenu(false); }, danger: true },
                  ].map(({ icon: Icon, label, action, danger }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                      style={{ color: danger ? "#ef4444" : "var(--text-secondary)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────── */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-0">
        <Outlet />
      </main>
      <FloatingAI />
      {/* ── Mobile Bottom Nav ───────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50"
        style={{
          background: "var(--header-bg)",
          borderTop: `1px solid ${C.border}`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          className="flex items-center justify-around px-2 pt-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {bottomMain.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <NavLink key={to} to={to} className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                  style={{ background: active ? "var(--nav-active-bg)" : "transparent" }}>
                  <Icon size={20} style={{ color: active ? "#10b981" : "var(--text-faint)" }} />
                </div>
                <span className="text-[10px]"
                  style={{ color: active ? "#10b981" : "var(--text-faint)", fontWeight: active ? 500 : 400 }}>
                  {label}
                </span>
              </NavLink>
            );
          })}

          {/* More button */}
          {bottomMore.length > 0 && (
            <button
              onClick={() => setShowMore((v) => !v)}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
                style={{ background: showMore ? "var(--nav-active-bg)" : "transparent" }}>
                <MoreHorizontal size={20} style={{ color: showMore ? "#10b981" : "var(--text-faint)" }} />
              </div>
              <span className="text-[10px]" style={{ color: showMore ? "#10b981" : "var(--text-faint)" }}>
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* ── More Drawer ──────────────────────────── */}
      {showMore && (
        <>
          <div className="lg:hidden fixed inset-0 z-[55]" style={{ background: "var(--overlay-scrim)" }}
            onClick={() => setShowMore(false)} />
          <div
            className="lg:hidden fixed bottom-0 inset-x-0 z-[60] rounded-t-2xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--surface-8)" }} />
            </div>
            <div className="px-4 pb-2">
              <p className="text-xs font-semibold mb-3 mt-2" style={{ color: "var(--text-faint)" }}>MORE</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {bottomMore.map(({ to, icon: Icon, label }) => {
                  const active = isActive(to);
                  return (
                    <NavLink key={to} to={to}
                      onClick={() => setShowMore(false)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                      style={{ background: active ? "rgba(16,185,129,0.08)" : "var(--surface-1)" }}>
                      <Icon size={20} style={{ color: active ? "#10b981" : "var(--text-secondary)" }} />
                      <span className="text-[10px] text-center leading-tight"
                        style={{ color: active ? "#10b981" : "var(--text-muted)" }}>{label}</span>
                    </NavLink>
                  );
                })}
                {/* Settings always in More */}
                <NavLink to="/settings" onClick={() => setShowMore(false)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                  style={{ background: isActive("/settings") ? "rgba(16,185,129,0.08)" : "var(--surface-1)" }}>
                  <Settings size={20} style={{ color: isActive("/settings") ? "#10b981" : "var(--text-secondary)" }} />
                  <span className="text-[10px]" style={{ color: isActive("/settings") ? "#10b981" : "var(--text-muted)" }}>Settings</span>
                </NavLink>
              </div>

              {/* Logout */}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-3 text-sm"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
            <div style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }} />
          </div>
        </>
      )}
    </div>
  );
};

export default AppLayout;