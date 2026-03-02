import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const PrivateRoute = () => {
  const token = useAuthStore((s) => s.token);
  console.log(token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
