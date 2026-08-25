/**
 * API origin, shared by the axios client and the offline connectivity probe.
 * Kept out of `services/api.ts` so the probe can reach the health endpoint
 * without importing the interceptor-laden client (and creating a cycle).
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  "https://backend-1-theta-sepia.vercel.app/api/";

export const HEALTH_URL = `${API_BASE_URL.replace(/\/$/, "")}/health`;
