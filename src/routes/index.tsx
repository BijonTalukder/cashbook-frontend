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

  /* ── Private routes ─────────────────────────────────── */
  {
    element: <PrivateRoute />,
    children: [
      /* onboarding — AppLayout ছাড়া (no sidebar needed) */
      { path: "/onboarding", element: <OnboardingPage /> },

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
        ],
      },
    ],
  },
  { path: "/invite/:token", element: <InvitePage /> },

  /* ── Fallback ────────────────────────────────────────── */
  { path: "*", element: <Navigate to="/login" replace /> },
]);
