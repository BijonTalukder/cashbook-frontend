import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/*
  OnboardingRoute — token আছে কিন্তু onboarding বাকি users এর জন্য
  1. No token              → /login
  2. onboarding শেষ হয়ে গেছে → /dashboard (আর দেখাবে না)
  3. token আছে, onboarding বাকি → render OnboardingPage
*/
const OnboardingRoute = () => {
  const token = useAuthStore((s) => s.token);
  const onboardingCompleted = useAuthStore((s) => s.user?.onboardingCompleted);
  const defaultBusiness = useAuthStore((s) => s.user?.defaultBusiness);
  console.log(token, onboardingCompleted, defaultBusiness);
  if (!token) return <Navigate to="/login" replace />;

  if (onboardingCompleted && defaultBusiness) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default OnboardingRoute;
