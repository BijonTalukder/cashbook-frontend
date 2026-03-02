import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const GuestRoute = () => {
  const token = useAuthStore((s) => s.token);
  const defaultBusiness = useAuthStore((s) => s.user?.defaultBusiness);

  // ✅ token আছে + onboarding হয়ে গেছে → dashboard
  if (token && defaultBusiness) return <Navigate to="/dashboard" replace />;

  // ✅ token আছে কিন্তু onboarding বাকি → onboarding
  if (token) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
};

export default GuestRoute;
