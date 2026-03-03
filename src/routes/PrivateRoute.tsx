import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/*
  PrivateRoute — 3 cases:
  1. No token              → /login
  2. Token but onboarding not done → /onboarding
  3. Token + onboarding done       → render children
*/
const PrivateRoute = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) return <Navigate to="/login" replace />;

  // onboardingCompleted false হলে onboarding এ পাঠাও
  // defaultBusiness না থাকলেও onboarding এ পাঠাও (extra safety)
  if (!user?.onboardingCompleted || !user?.defaultBusiness) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;