import { useLocation, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, LogOut, ChevronLeft, ArrowLeft,
  MoreHorizontal, User, Trash2, X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useBackHandler, forceUnlockBodyScroll } from "../../native/hooks";
import { haptic, exitApp, isNativeApp, pushBackHandler } from "../../native/bridge";
import PageTransition from "../../components/ui/PageTransition";
import PullToRefresh from "../../components/ui/PullToRefresh";
import { RefreshProvider, useRefreshRunner } from "../../native/refresh";
import { useBusinessStore } from "../../store/businessStore";
import { type IBusiness } from "../../services/business.service";
import BusinessSwitcher from "../../components/shared/BusinessSwitcher";
import FloatingAI from "../../pages/Ai/FloatingAI";
import ThemeToggle from "../../components/shared/ThemeToggle";
import LanguageToggle from "../../components/shared/LanguageToggle";
import SyncStatusIndicator from "../../components/shared/SyncStatusIndicator";
import { useTranslation } from "../../i18n/useTranslation";
import { toast } from "sonner";

const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  border: "var(--border-light)",
  navActive: "var(--nav-active-bg)",
};

const ROOT_PATHS = [
  "/dashboard", "/transactions", "/members", "/meals", "/settings",
  "/dues", "/invoices", "/mess", "/customers", "/suppliers",
  "/products", "/sales", "/purchases", "/expenses", "/baki",
  "/ledger", "/reports",
];
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

export interface MobileLayoutProps {
  visibleNav: Array<{
    to: string;
    icon: React.ElementType;
    labelKey: string;
    group: string;
  }>;
  onBusinessSwitch: (biz: IBusiness) => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  visibleNav,
  onBusinessSwitch,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const GROUP_LABEL_KEYS: Record<string, string> = {
    sales: "nav.groups.sales",
    inventory: "nav.groups.inventory",
    money: "nav.groups.money",
    mess: "nav.groups.mess",
    team: "nav.groups.team",
  };
  const GROUP_ORDER = ["sales", "inventory", "money", "mess", "team"];

  const bottomMain = visibleNav.slice(0, 4);
  const bottomMore = visibleNav.slice(4);
  const bottomMoreGroups = GROUP_ORDER
    .map((key) => ({ key, label: t(GROUP_LABEL_KEYS[key]), items: bottomMore.filter((n) => n.group === key) }))
    .filter((g) => g.items.length > 0);

  const showBack = !isRootPath(location.pathname);
  const pageTitle = t(getPageTitleKey(location.pathname));

  const [showMore, setShowMore] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    forceUnlockBodyScroll();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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

  /* Edge swipe to go back */
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const swipeActive = useRef(false);
  const [swipeProgress, setSwipeProgress] = useState(0);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      swipeActive.current = touchStartX.current < 40;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!swipeActive.current) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dy > 30) { swipeActive.current = false; setSwipeProgress(0); return; }
      if (dx > 0) {
        setSwipeProgress(Math.min(dx / 120, 1));
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
      <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
        {/* Swipe indicator */}
        {swipeProgress > 0 && (
          <div
            className="fixed left-0 top-0 bottom-0 z-[60] pointer-events-none flex items-center"
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

        {/* Mobile Top Header */}
        <header
          className="sticky top-0 z-50"
          style={{
            background: "var(--header-bg)",
            borderBottom: `1px solid ${lifted ? "var(--border)" : "transparent"}`,
            boxShadow: lifted ? "0 1px 12px rgba(0,0,0,0.12)" : "none",
            transition:
              "box-shadow var(--dur-base) var(--ease-emphasized), border-color var(--dur-base) var(--ease-emphasized)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            paddingTop: "var(--safe-top)",
            paddingLeft: "var(--safe-left)",
            paddingRight: "var(--safe-right)",
          }}
        >
          <div className="flex items-center px-4 gap-2" style={{ height: "var(--header-h)" }}>
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

            <div className="flex-1 min-w-0">
              {showBack ? (
                <h1
                  className="text-[17px] font-semibold truncate"
                  style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
                >
                  {pageTitle}
                </h1>
              ) : (
                <BusinessSwitcher variant="appbar" onSelect={onBusinessSwitch} />
              )}
            </div>

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

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div
                    className="absolute right-0 top-11 z-50 w-64 rounded-2xl py-1 overflow-hidden"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-elevated)" }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--surface-4)" }}>
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-faint)" }}>
                        {user?.email}
                      </p>
                    </div>

                    <div className="px-2 py-2 space-y-1.5" style={{ borderBottom: "1px solid var(--surface-4)" }}>
                      <ThemeToggle variant="row" />
                      <LanguageToggle variant="row" />
                    </div>

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

        {/* Main Content */}
        <main
          className="flex-1 min-w-0 pb-[calc(var(--bottomnav-total)+4.5rem)]"
          style={{
            paddingLeft: "var(--safe-left)",
            paddingRight: "var(--safe-right)",
          }}
        >
          <ScreenHost />
        </main>

        <FloatingAI />

        {/* Mobile Bottom Navigation */}
        <nav
          className="fixed bottom-0 inset-x-0 z-50"
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

        {/* More Drawer */}
        {showMore && (
          <>
            <div
              className="fixed inset-0 z-[55] anim-scrim-in"
              style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowMore(false)}
            />
            <div
              className="fixed inset-y-0 left-0 z-[60] w-72 flex flex-col anim-slide-in-left shadow-2xl"
              style={{
                background: "var(--bg-elevated)",
                borderRight: `1px solid ${C.border}`,
                paddingTop: "var(--safe-top)",
                paddingBottom: "var(--safe-bottom)",
              }}
            >
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
                    <TrendingUp size={14} className="text-emerald-950" />
                  </div>
                  <span className="font-bold text-base" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
                    {t("app.name")}
                  </span>
                </div>
                <button
                  onClick={() => setShowMore(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg press"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                {bottomMoreGroups.map(({ key, label, items }) => (
                  <div key={key}>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider px-3 mb-1" style={{ color: "var(--text-faint)" }}>
                      {label}
                    </p>
                    <div className="space-y-0.5">
                      {items.map(({ to, icon: Icon, labelKey }) => {
                        const active = isActive(to);
                        return (
                          <NavLink
                            key={to}
                            to={to}
                            onClick={() => setShowMore(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all press"
                            style={{
                              background: active ? "var(--nav-active-bg)" : "transparent",
                              color: active ? "#10b981" : "var(--text-primary)",
                              fontWeight: active ? 500 : 400,
                            }}
                          >
                            <Icon size={17} style={{ color: active ? "#10b981" : "var(--text-muted)" }} />
                            <span>{t(labelKey)}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </RefreshProvider>
  );
};

export default MobileLayout;
