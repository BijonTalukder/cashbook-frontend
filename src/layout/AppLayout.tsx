import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  UtensilsCrossed,
  HandCoins,
  FileText,
  Calculator,
  Contact,
  Truck,
  Package,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  ScrollText,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useBusinessStore } from "../store/businessStore";
import { businessService, type IBusiness } from "../services/business.service";
import { useIsDesktop } from "../hooks/useViewport";
import MobileLayout from "../mobile/layouts/MobileLayout";
import DesktopLayout from "../web/layouts/DesktopLayout";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard", group: "overview" },
  { to: "/transactions", icon: ArrowLeftRight, labelKey: "nav.transactions", hideForBusiness: true, group: "money" },
  { to: "/members", icon: Users, labelKey: "nav.members", hideForPersonal: true, group: "team" },
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
  { to: "/ledger", icon: ScrollText, labelKey: "nav.ledger", businessModeOnly: true, allowCompany: true, group: "money" },
  { to: "/reports", icon: BarChart3, labelKey: "nav.reports", businessModeOnly: true, allowCompany: true, group: "money" },
];

export const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const isDesktop = useIsDesktop();

  /** Seed `activeBusiness` so direct deep-links never render without one */
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
        // Fallback or retry when online
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, user?.defaultBusiness, setActiveBusiness]);

  const isMass = activeBusiness?.type === "mass" || activeBusiness?.mealEnabled;
  const isBusinessMode = activeBusiness?.type === "business";
  const isCompany = activeBusiness?.type === "company";
  const isPersonal = activeBusiness?.type === "personal";

  const visibleNav = navItems.filter(
    (n) =>
      (!n.massOnly || !!isMass) &&
      (!n.hideForBusiness || !isBusinessMode) &&
      (!n.hideForPersonal || !isPersonal) &&
      (!n.businessModeOnly || isBusinessMode || (n.allowCompany && isCompany)),
  );

  const handleBusinessSwitch = (newBiz: IBusiness) => {
    const path = location.pathname;
    const isNewMass = newBiz.type === "mass" || newBiz.mealEnabled;
    const isNewBusiness = newBiz.type === "business";
    const isNewCompany = newBiz.type === "company";
    const isNewPersonal = newBiz.type === "personal";

    const retailOnlyPaths = [
      "/customers",
      "/suppliers",
      "/products",
      "/sales",
      "/purchases",
      "/baki",
    ];
    const massOnlyPaths = ["/meals", "/mess"];
    const nonBusinessPaths = ["/transactions", "/dues"];

    const isRetailOnly = retailOnlyPaths.some((p) => path.startsWith(p));
    const isMassOnly = massOnlyPaths.some((p) => path.startsWith(p));
    const isNonBusinessOnly = nonBusinessPaths.some((p) => path.startsWith(p));
    const isPersonalRestricted = path.startsWith("/members");

    if (
      (!isNewBusiness && isRetailOnly) ||
      (!isNewMass && isMassOnly) ||
      (isNewPersonal && isPersonalRestricted) ||
      (isNewBusiness && isNonBusinessOnly) ||
      path.includes("/new")
    ) {
      navigate("/dashboard");
    }
  };

  return isDesktop ? (
    <DesktopLayout
      visibleNav={visibleNav}
      onBusinessSwitch={handleBusinessSwitch}
    />
  ) : (
    <MobileLayout
      visibleNav={visibleNav}
      onBusinessSwitch={handleBusinessSwitch}
    />
  );
};

export default AppLayout;