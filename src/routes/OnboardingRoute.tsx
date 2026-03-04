import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const OnboardingRoute = () => {
  const token = useAuthStore((s) => s.token);
  const onboardingCompleted = useAuthStore((s) => s.user?.onboardingCompleted);
  const defaultBusiness = useAuthStore((s) => s.user?.defaultBusiness);
  console.log(token, onboardingCompleted, defaultBusiness);
  if (!token) return <Navigate to="/login" replace />;

  if (onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default OnboardingRoute;
