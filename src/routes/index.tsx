import { createBrowserRouter, Navigate } from "react-router-dom";
import GuestRoute from "./GuestRoute";
import PrivateRoute from "./PrivateRoute";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import OnboardingPage from "../pages/on-board/OnboardingPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import TransactionsPage from "../pages/transactions/TransactionsPage";
import AppLayout from "../layout/AppLayout"; // ✅ import AppLayout
import MembersPage from "../pages/business-member/MembersPage";
import InvitePage from "../pages/invite/InvitePage";
import PendingDuesPage from "../pages/dues/PendingDuesPage";
import SettingsPage from "../pages/settings/SettingsPage";
import MealsPage from "../pages/meal/MealsPage";
import NewBusinessPage from "../pages/business/NewBusinessPage";
import OnboardingRoute from "./OnboardingRoute";
import InvoicePage from "../pages/invoice/InvoicePage";
import InvoiceDetailPage from "../pages/invoice/InvoiceDetailPage";
import MessSummaryPage from "../pages/mass/MessSummaryPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicy/PrivacyPolicyPage";
import DataDeletionPage from "../pages/DataDeletionPage/DataDeletionPage";
import CustomersPage from "../pages/customer/CustomersPage";
import CustomerDetailPage from "../pages/customer/CustomerDetailPage";
import SuppliersPage from "../pages/supplier/SuppliersPage";
import SupplierDetailPage from "../pages/supplier/SupplierDetailPage";
import ProductsPage from "../pages/product/ProductsPage";
import SalesPage from "../pages/sale/SalesPage";
import NewSalePage from "../pages/sale/NewSalePage";
import SaleDetailPage from "../pages/sale/SaleDetailPage";
import SaleInvoicePage from "../pages/sale/SaleInvoicePage";
import PurchasesPage from "../pages/purchase/PurchasesPage";
import NewPurchasePage from "../pages/purchase/NewPurchasePage";
import PurchaseDetailPage from "../pages/purchase/PurchaseDetailPage";
import ExpensesPage from "../pages/expense/ExpensesPage";
import BakiPage from "../pages/baki/BakiPage";
import LedgerPage from "../pages/ledger/LedgerPage";
import ProfitLossPage from "../pages/reports/ProfitLossPage";
import ReportsPage from "../pages/reports/ReportsPage";
import BusinessSettingsPage from "../pages/settings/BusinessSettingsPage";

export const router = createBrowserRouter([
  /* ── Guest routes (login/register) ─────────────────────
     token থাকলে GuestRoute dashboard/onboarding এ পাঠাবে  */
  {
    element: <GuestRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  {
    element: <OnboardingRoute />,
    children: [{ path: "/onboarding", element: <OnboardingPage /> }],
  },

  /* ── Private routes ─────────────────────────────────── */
  {
    element: <PrivateRoute />,
    children: [
      /* onboarding — AppLayout ছাড়া (no sidebar needed) */
      // { path: "/onboarding", element: <OnboardingPage /> },

      /* ✅ AppLayout এর ভেতরে — সব protected pages যেখানে header/sidebar দরকার */
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/transactions", element: <TransactionsPage /> },
          { path: "/members", element: <MembersPage /> },
          { path: "/dues", element: <PendingDuesPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/meals", element: <MealsPage /> },
          { path: "/business/new", element: <NewBusinessPage /> },
          { path: "/invoices", element: <InvoicePage /> },
          { path: "/customers", element: <CustomersPage /> },
          { path: "/customers/:id", element: <CustomerDetailPage /> },
          { path: "/suppliers", element: <SuppliersPage /> },
          { path: "/suppliers/:id", element: <SupplierDetailPage /> },
          { path: "/products", element: <ProductsPage /> },
          { path: "/sales", element: <SalesPage /> },
          { path: "/sales/new", element: <NewSalePage /> },
          { path: "/sales/:id", element: <SaleDetailPage /> },
          { path: "/sales/:id/invoice", element: <SaleInvoicePage /> },
          { path: "/purchases", element: <PurchasesPage /> },
          { path: "/purchases/new", element: <NewPurchasePage /> },
          { path: "/purchases/:id", element: <PurchaseDetailPage /> },
          { path: "/expenses", element: <ExpensesPage /> },
          { path: "/baki", element: <BakiPage /> },
          { path: "/ledger", element: <LedgerPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/business/settings", element: <BusinessSettingsPage /> },
          { path: "/reports/profit-loss", element: <ProfitLossPage /> },
          { path: "/invite/:token", element: <InvitePage /> },
          {
            path: "/mess",
            element: <MessSummaryPage />,
          },
          {
            path: "/invoices/:businessId/:invoiceId",
            element: <InvoiceDetailPage />,
          },
        ],
      },
    ],
  },
  { path: "/invite/:token", element: <InvitePage /> },
  { path: "/privacy-policy", element: <PrivacyPolicyPage /> },
  { path: "/data-deletion", element: <DataDeletionPage /> },
  /* ── Fallback ────────────────────────────────────────── */
  { path: "*", element: <Navigate to="/login" replace /> },
]);
