import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { reportRequestOutcome } from "../offline/network";

const api = axios.create({
  baseURL: API_BASE_URL,

  // "https://backend-1-theta-sepia.vercel.app/api/", http://localhost:5000/api/
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth-storage");
  if (raw) {
    const parsed = JSON.parse(raw);
    const token = parsed?.state?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    // A successful GET may have come from the service worker's cache, so it is
    // not on its own proof that the API is up — see reportRequestOutcome.
    reportRequestOutcome(true, res.config.method?.toLowerCase() !== "get");
    return res;
  },
  (error) => {
    // A response of any status proves the API answered; only a transport
    // failure means it is unreachable. This is the third connectivity signal
    // the offline layer folds in, alongside the browser link and the probe.
    reportRequestOutcome(!!error.response);

    if (error.response?.status === 401) {
      const isAuthRequest =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register");
      const isAuthPage =
        typeof window !== "undefined" &&
        (window.location.pathname === "/login" ||
          window.location.pathname === "/register");

      if (!isAuthRequest && !isAuthPage) {
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
