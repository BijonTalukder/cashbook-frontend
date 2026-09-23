import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, LayoutDashboard, ArrowLeftRight, Users,
  UtensilsCrossed, Settings, LogOut, HandCoins,
  ChevronLeft, ArrowLeft, FileText, Calculator, MoreHorizontal,
  User, Trash2, X, Contact, Truck, Package, ShoppingCart, ShoppingBag, Receipt, ScrollText, BarChart3,
  Check,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useBackHandler } from "../native/hooks";
import { haptic, exitApp, isNativeApp, pushBackHandler } from "../native/bridge";
import PageTransition from "../components/ui/PageTransition";
import PullToRefresh from "../components/ui/PullToRefresh";
import { RefreshProvider, useRefreshRunner } from "../native/refresh";
import { useBusinessStore } from "../store/businessStore";
import { businessService } from "../services/business.service";
import BusinessSwitcher from "../components/shared/BusinessSwitcher";
import FloatingAI from "../pages/Ai/FloatingAI";
import ThemeToggle from "../components/shared/ThemeToggle";
import LanguageToggle from "../components/shared/LanguageToggle";
import SyncStatusIndicator from "../components/shared/SyncStatusIndicator";
import { useTranslation } from "../i18n/useTranslation";
import { useOfflineStore } from "../store/offlineStore";
import { toast } from "sonner";

const C = {
  bg: "var(--bg)",
  sidebar: "var(--bg-sidebar)",
  card: "var(--surface-1)",
  border: "var(--border-light)",
  navActive: "var(--nav-active-bg)",
};

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard", group: "overview" },
  { to: "/transactions", icon: ArrowLeftRight, labelKey: "nav.transactions", hideForBusiness: true, group: "money" },
  { to: "/members", icon: Users, labelKey: "nav.members", group: "team" },
  { to: "/meals", icon: UtensilsCrossed, labelKey: "nav.meals", massOnly: true, group: "mess" },
  { to: "/mess", icon: Calculator, labelKey: "nav.mess", massOnly: true, group: "mess" },
  { to: "/invoices", icon: FileText, labelKey: "nav.invoices", group: "sales" },
  { to: "/dues", icon: HandCoins, labelKey: "nav.dues", hideForBusiness: true, group: "money" },
  { to: "/customers", icon: Contact, labelKey: "nav.customers", businessModeOnly: true, group: "sales" },
  { to: "/suppliers", icon: Truck, labelKey: "nav.suppliers", businessModeOnly: true, group: "inventory" },
  { to: "/products", icon: Package, labelKey: "nav.products", businessModeOnly: true, group: "inventory" },
  { to: "/sales", icon: ShoppingCart, labelKey: "nav.sales", businessModeOnly: true, group: "sales" },
  { to: "/purchases", icon: ShoppingBag, labelKey: "nav.purchases", businessModeOnly: true, group: "inventory" },
  { to: "/expenses", icon: Receipt, labelKey: "nav.expenses", businessModeOnly: true, group: "money" },
  { to: "/baki", icon: HandCoins, labelKey: "nav.baki", businessModeOnly: true, group: "sales" },
  { to: "/ledger", icon: ScrollText, labelKey: "nav.ledger", businessModeOnly: true, group: "money" },
  { to: "/reports", icon: BarChart3, labelKey: "nav.reports", businessModeOnly: true, group: "money" },
  // More Business Mode-only items are appended as their pages land
  // Settings is always shown in the drawer's footer separately
];

const GROUP_LABEL_KEYS: Record<string, string> = {
  sales: "nav.groups.sales",
  inventory: "nav.groups.inventory",
  money: "nav.groups.money",
  mess: "nav.groups.mess",
  team: "nav.groups.team",
};
const GROUP_ORDER = ["sales", "inventory", "money", "mess", "team"];

// Root-level pages where back button should NOT show
const ROOT_PATHS = ["/dashboard", "/transactions", "/members", "/meals", "/settings", "/dues", "/invoices", "/mess", "/customers", "/suppliers", "/products", "/sales", "/purchases", "/expenses", "/baki", "/ledger", "/reports"];
const isRootPath = (path: string) => ROOT_PATHS.some((r) => path === r);

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

/** Lives under RefreshProvider so it can reach whatever screen registered itself. */
const ScreenHost = () => {
  const runRefresh = useRefreshRunner();
  return (
    <PullToRefresh onRefresh={runRefresh}>
      <PageTransition>
        <Outlet />
      </PageTransition>
    </PullToRefresh>
  );
};

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const { t } = useTranslation();

  /** Seed `activeBusiness` so the first protected page a user lands on — a
   *  deep-link straight to /transactions, or right after onboarding — never
   *  renders "Select a business". Only the dashboard used to self-heal, on its
   *  own mount; direct navigation bypassed it. Also stops one account inheriting
   *  the previous account's cached business (the store is shared/localStorage). */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const memberships = await businessService.getMyBusinesses();
        if (cancelled || memberships.length === 0) return;
        const current = useBusinessStore.getState().activeBusiness;
        if (current && memberships.some((m) => m.business._id === current._id)) return;
        const def =
          memberships.find((m) => m.business._id === user.defaultBusiness) ?? memberships[0];
        setActiveBusiness(def.business);
      } catch {
        // Dashboard and the switcher will retry when the network is back.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, user?.defaultBusiness, setActiveBusiness]);

  const isMass = activeBusiness?.type === "mass" || activeBusiness?.mealEnabled;
  const isBusinessMode = activeBusiness?.type === "business";
  const visibleNav = navItems.filter(
    (n) =>
      (!n.massOnly || !!isMass) &&
      (!n.hideForBusiness || !isBusinessMode) &&
      (!n.businessModeOnly || isBusinessMode),
  );

  /* Sync status — read straight from the store so the logo badge reflects
     the live state without an extra subscribe in SyncStatusIndicator. */
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

  // Bottom nav: first 4 fixed + "More" opens a left drawer for the rest
  const bottomMain = visibleNav.slice(0, 4);
  const bottomMore = visibleNav.slice(4);
  const bottomMoreGroups = GROUP_ORDER
    .map((key) => ({ key, label: t(GROUP_LABEL_KEYS[key]), items: bottomMore.filter((n) => n.group === key) }))
    .filter((g) => g.items.length > 0);

  const showBack = !isRootPath(location.pathname);
  const pageTitle = t(getPageTitleKey(location.pathname));

  const [showMore, setShowMore] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  /* A native app bar is flat while the screen is at rest and lifts once
     content slides under it. Without the cue, a translucent header just looks
     like it is bleeding into the page. */
  const [lifted, setLifted] = useState(false);
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  /* ── Android back button ──────────────────────────────
     Transient UI first (drawer, user menu — Sheet registers its own), then
     in-app navigation, and only at a root screen does a second press within
     two seconds actually leave the app. Anything less and the app feels like
     a browser tab that closes on the first back press. */
  useBackHandler(showMore, () => setShowMore(false));
  useBackHandler(showUserMenu, () => setShowUserMenu(false));

  const exitArmed = useRef(false);
  useEffect(() => {
    if (!isNativeApp()) return;
    return pushBackHandler(() => {
      if (!isRootPath(location.pathname)) {
        navigate(-1);
        return true;
      }
      if (location.pathname !== "/dashboard") {
        navigate("/dashboard");
        return true;
      }
      if (exitArmed.current) {
        exitApp();
        return true;
      }
      exitArmed.current = true;
      toast(t("nav.pressBackAgain"));
      setTimeout(() => { exitArmed.current = false; }, 2000);
      return true;
    });
  }, [location.pathname, navigate, t]);

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
  const drawerStartX = useRef<number>(0);

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
      if (dx > 80) {
        haptic("light");
        navigate(-1);
      }
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
    <RefreshProvider>
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
        className="hidden lg:flex w-60 flex-col flex-shrink-0 h-screen sticky top-0"
        style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-6 pt-7 pb-5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={15} className="text-emerald-950" />
            </div>
            <span className="font-bold text-lg truncate" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
              {t("app.name")}
            </span>
          </div>
          {/* Sync status icon — only visible when everything is in sync and we
              are online. No label, no menu: a passive Check that the user can
              hover/tap for the tooltip. */}
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

        {/* Business switcher */}
        <div className="px-3 mb-4 flex-shrink-0">
          <BusinessSwitcher onSelect={() => navigate("/transactions")} />
        </div>

        {/* Nav */}
        <nav className="flex-1 min-h-0 px-3 space-y-0.5 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "thin" }}>
          {[...visibleNav, { to: "/settings", icon: Settings, labelKey: "nav.settings" }].map(({ to, icon: Icon, labelKey }) => {
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
                {t(labelKey)}
              </NavLink>
            );
          })}
        </nav>

        {/* Appearance & language (sync status now lives on the logo, top-right) */}
        <div className="px-3 mt-3 space-y-2 flex-shrink-0">
          <ThemeToggle variant="row" />
          <LanguageToggle variant="row" />
        </div>

        {/* User */}
        <div className="p-3 mt-2 flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              <span className="text-xs font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-snug" style={{ color: "var(--text-primary)" }}>
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
          borderBottom: `1px solid ${lifted ? "var(--border)" : "transparent"}`,
          boxShadow: lifted ? "0 1px 12px rgba(0,0,0,0.12)" : "none",
          transition:
            "box-shadow var(--dur-base) var(--ease-emphasized), border-color var(--dur-base) var(--ease-emphasized)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          // Edge-to-edge (Android 15 / targetSdk 35) draws the WebView behind
          // the status bar — without this the title sits under the clock.
          paddingTop: "var(--safe-top)",
          paddingLeft: "var(--safe-left)",
          paddingRight: "var(--safe-right)",
        }}
      >
        <div
          className="flex items-center px-4 gap-2"
          style={{ height: "var(--header-h)" }}
        >

          {/* Leading — a navigation icon on a pushed screen, nothing on a root
              one. Material app bars use a bare arrow with a circular ripple,
              not a filled chip. */}
          {showBack && (
            <button
              onClick={() => { haptic("light"); navigate(-1); }}
              aria-label={t("common.back")}
              className="ripple w-10 h-10 -ml-1 flex items-center justify-center rounded-full flex-shrink-0 press"
              style={{ color: "var(--text-primary)" }}
            >
              <ArrowLeft size={22} />
            </button>
          )}

          {/* Title — left-aligned, the Android convention. A centred title is
              an iOS idiom, and it was also what forced the trailing actions off
              the right edge of a 360dp screen. On a root screen the title *is*
              the business switcher. */}
          <div className="flex-1 min-w-0">
            {showBack ? (
              <h1
                className="text-[17px] font-semibold truncate"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
              >
                {pageTitle}
              </h1>
            ) : (
              <BusinessSwitcher variant="appbar" onSelect={() => navigate("/dashboard")} />
            )}
          </div>

          {/* Right: theme toggle + avatar with dropdown */}
          <div className="flex items-center gap-1.5 flex-shrink-0 relative">
            <SyncStatusIndicator />
            <button
              onClick={() => { haptic("light"); setShowUserMenu((v) => !v); }}
              aria-label={t("nav.profileSettings")}
              className="w-9 h-9 rounded-full flex items-center justify-center press"
              style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
            >
              <span className="text-xs font-bold text-white">
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
                  className="absolute right-0 top-11 z-50 w-64 rounded-2xl py-1 overflow-hidden"
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

                  {/* Appearance & language — moved out of the app bar so the
                      trailing cluster fits a 360dp screen. */}
                  <div className="px-2 py-2 space-y-1.5" style={{ borderBottom: "1px solid var(--surface-4)" }}>
                    <ThemeToggle variant="row" />
                    <LanguageToggle variant="row" />
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: User, label: t("nav.profileSettings"), action: () => { navigate("/settings"); setShowUserMenu(false); } },
                    { icon: LogOut, label: t("nav.logout"), action: handleLogout, danger: false },
                    { icon: Trash2, label: t("nav.deleteAccount"), action: () => { navigate("/data-deletion"); setShowUserMenu(false); }, danger: true },
                  ].map(({ icon: Icon, label, action, danger }) => (
                    <button
                      key={label}
                      onClick={() => { haptic("selection"); action(); }}
                      className="w-full flex items-center gap-3 px-4 h-12 text-sm text-left row-press"
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
      <main
        className="flex-1 min-w-0 pb-[calc(var(--bottomnav-total)+0.75rem)] lg:pb-0"
        style={{
          paddingLeft: "var(--safe-left)",
          paddingRight: "var(--safe-right)",
        }}
      >
        <ScreenHost />
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
          className="flex items-stretch justify-around px-1"
          style={{
            minHeight: "var(--bottomnav-h)",
            paddingBottom: "var(--safe-bottom)",
            paddingLeft: "var(--safe-left)",
            paddingRight: "var(--safe-right)",
          }}
        >
          {bottomMain.map(({ to, icon: Icon, labelKey }) => {
            const active = isActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => haptic("selection")}
                className="flex flex-col items-center justify-center gap-0.5 px-2 pt-1.5 pb-1 rounded-xl flex-1 min-w-0 press-sm"
              >
                <div
                  className="w-14 h-7 flex items-center justify-center rounded-full transition-all"
                  style={{ background: active ? "var(--nav-active-bg)" : "transparent" }}
                >
                  <Icon size={19} style={{ color: active ? "#10b981" : "var(--text-faint)" }} />
                </div>
                <span
                  className="text-[10.5px] leading-tight truncate max-w-full"
                  style={{ color: active ? "#10b981" : "var(--text-faint)", fontWeight: active ? 500 : 400 }}
                >
                  {t(labelKey)}
                </span>
              </NavLink>
            );
          })}

          {/* More button */}
          {bottomMore.length > 0 && (
            <button
              onClick={() => { haptic("selection"); setShowMore((v) => !v); }}
              className="flex flex-col items-center justify-center gap-0.5 px-2 pt-1.5 pb-1 rounded-xl flex-1 min-w-0 press-sm"
            >
              <div
                className="w-14 h-7 flex items-center justify-center rounded-full transition-all"
                style={{ background: showMore ? "var(--nav-active-bg)" : "transparent" }}
              >
                <MoreHorizontal size={19} style={{ color: showMore ? "#10b981" : "var(--text-faint)" }} />
              </div>
              <span
                className="text-[10.5px] leading-tight truncate max-w-full"
                style={{ color: showMore ? "#10b981" : "var(--text-faint)" }}
              >
                {t("nav.more")}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* ── More Drawer (left slide-out, grouped by category) ──── */}
      {showMore && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-[55] anim-scrim-in"
            style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowMore(false)}
          />
          <div
            className="lg:hidden fixed left-0 top-0 bottom-0 z-[60] w-[80vw] max-w-[320px] flex flex-col rounded-r-3xl"
            onTouchStart={(e) => { drawerStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const dx = drawerStartX.current - e.changedTouches[0].clientX;
              if (dx > 50) {
                haptic("light");
                setShowMore(false);
              }
            }}
            style={{
              background: "var(--bg-elevated)",
              borderRight: "1px solid var(--border-strong)",
              boxShadow: "var(--shadow-elevated)",
              animation: "page-forward var(--dur-base) var(--ease-decelerate)",
              paddingLeft: "var(--safe-left)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 pb-3 flex-shrink-0"
              style={{ paddingTop: "calc(var(--safe-top) + 1rem)", borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
                  <TrendingUp size={13} className="text-emerald-950" />
                </div>
                <span className="font-bold text-base" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
                  {t("app.name")}
                </span>
              </div>
              <button
                onClick={() => { haptic("light"); setShowMore(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg press"
                style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Grouped nav list */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {bottomMoreGroups.map(({ key, label, items }) => (
                <div key={key} className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide px-3 mb-1.5" style={{ color: "var(--text-faint)" }}>
                    {label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map(({ to, icon: Icon, labelKey }) => {
                      const active = isActive(to);
                      return (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={() => { haptic("selection"); setShowMore(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm press-sm"
                          style={{
                            background: active ? "var(--nav-active-bg)" : "transparent",
                            color: active ? "#10b981" : "var(--text-secondary)",
                            fontWeight: active ? 500 : 400,
                          }}
                        >
                          <Icon size={18} />
                          {t(labelKey)}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: Settings + Logout, pinned */}
            <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: "1px solid var(--border-light)" }}>
              <NavLink
                to="/settings"
                onClick={() => { haptic("selection"); setShowMore(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-1 press-sm"
                style={{
                  background: isActive("/settings") ? "var(--nav-active-bg)" : "transparent",
                  color: isActive("/settings") ? "#10b981" : "var(--text-secondary)",
                  fontWeight: isActive("/settings") ? 500 : 400,
                }}
              >
                <Settings size={18} /> {t("nav.settings")}
              </NavLink>
              <button
                onClick={() => { haptic("light"); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm press-sm"
                style={{ color: "#ef4444" }}
              >
                <LogOut size={18} /> {t("nav.logout")}
              </button>
              <div style={{ paddingBottom: "var(--safe-bottom)" }} />
            </div>
          </div>
        </>
      )}
    </div>
    </RefreshProvider>
  );
};

export default AppLayout;