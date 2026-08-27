import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy, type ComponentType } from "react";
import GuestRoute from "./GuestRoute";
import PrivateRoute from "./PrivateRoute";
import OnboardingRoute from "./OnboardingRoute";
import AppLayout from "../layout/AppLayout";
import ScreenFallback from "../components/ui/ScreenFallback";
import RouteError from "../components/ui/RouteError";

/* Auth screens stay in the entry chunk — they are the cold-start destination
   for a logged-out user, and a spinner there would be the first thing anyone
   ever sees of the app. */
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

/**
 * Everything else is split.
 *
 * The app ships inside an Android WebView on phones that are frequently
 * low-end and on metered data, where a single 1.4 MB bundle costs seconds of
 * blank screen on every cold start. Per-route chunks mean a user who only ever
 * opens the dashboard never downloads the reports charting library.
 */
const page = (loader: () => Promise<{ default: ComponentType }>) => {
  const Component = lazy(loader);
  return (
    <Suspense fallback={<ScreenFallback />}>
      <Component />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  /* ── Guest routes (login/register) ─────────────────────
     token থাকলে GuestRoute dashboard/onboarding এ পাঠাবে  */
  {
    element: <GuestRoute />,
    errorElement: <RouteError />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  {
    element: <OnboardingRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/onboarding",
        element: page(() => import("../pages/on-board/OnboardingPage")),
      },
    ],
  },

  /* ── Private routes ─────────────────────────────────── */
  {
    element: <PrivateRoute />,
    errorElement: <RouteError />,
    children: [
      /* ✅ AppLayout এর ভেতরে — সব protected pages যেখানে header/sidebar দরকার */
      {
        element: <AppLayout />,
        errorElement: <RouteError />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: page(() => import("../pages/dashboard/DashboardPage")) },
          { path: "/transactions", element: page(() => import("../pages/transactions/TransactionsPage")) },
          { path: "/members", element: page(() => import("../pages/business-member/MembersPage")) },
          { path: "/dues", element: page(() => import("../pages/dues/PendingDuesPage")) },
          { path: "/settings", element: page(() => import("../pages/settings/SettingsPage")) },
          { path: "/meals", element: page(() => import("../pages/meal/MealsPage")) },
          { path: "/business/new", element: page(() => import("../pages/business/NewBusinessPage")) },
          { path: "/invoices", element: page(() => import("../pages/invoice/InvoicePage")) },
          { path: "/customers", element: page(() => import("../pages/customer/CustomersPage")) },
          { path: "/customers/:id", element: page(() => import("../pages/customer/CustomerDetailPage")) },
          { path: "/suppliers", element: page(() => import("../pages/supplier/SuppliersPage")) },
          { path: "/suppliers/:id", element: page(() => import("../pages/supplier/SupplierDetailPage")) },
          { path: "/products", element: page(() => import("../pages/product/ProductsPage")) },
          { path: "/sales", element: page(() => import("../pages/sale/SalesPage")) },
          { path: "/sales/new", element: page(() => import("../pages/sale/NewSalePage")) },
          { path: "/sales/:id", element: page(() => import("../pages/sale/SaleDetailPage")) },
          { path: "/sales/:id/invoice", element: page(() => import("../pages/sale/SaleInvoicePage")) },
          { path: "/purchases", element: page(() => import("../pages/purchase/PurchasesPage")) },
          { path: "/purchases/new", element: page(() => import("../pages/purchase/NewPurchasePage")) },
          { path: "/purchases/:id", element: page(() => import("../pages/purchase/PurchaseDetailPage")) },
          { path: "/expenses", element: page(() => import("../pages/expense/ExpensesPage")) },
          { path: "/baki", element: page(() => import("../pages/baki/BakiPage")) },
          { path: "/ledger", element: page(() => import("../pages/ledger/LedgerPage")) },
          { path: "/reports", element: page(() => import("../pages/reports/ReportsPage")) },
          { path: "/reports/profit-loss", element: page(() => import("../pages/reports/ProfitLossPage")) },
          { path: "/business/settings", element: page(() => import("../pages/settings/BusinessSettingsPage")) },
          { path: "/invite/:token", element: page(() => import("../pages/invite/InvitePage")) },
          { path: "/mess", element: page(() => import("../pages/mass/MessSummaryPage")) },
          {
            path: "/invoices/:businessId/:invoiceId",
            element: page(() => import("../pages/invoice/InvoiceDetailPage")),
          },
        ],
      },
    ],
  },
  { path: "/invite/:token", element: page(() => import("../pages/invite/InvitePage")) },
  { path: "/privacy-policy", element: page(() => import("../pages/PrivacyPolicy/PrivacyPolicyPage")) },
  { path: "/data-deletion", element: page(() => import("../pages/DataDeletionPage/DataDeletionPage")) },
  /* ── Fallback ────────────────────────────────────────── */
  { path: "*", element: <Navigate to="/login" replace /> },
]);
