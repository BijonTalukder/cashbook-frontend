import api from "./api";

/**
 * FCM token registration API.
 *
 * The Android WebView shell hands the FCM device token to the web layer via
 * {@code window.onAndroidFcmTokenReceived(token)}. This module takes that token
 * and registers it against the currently authenticated user on the backend.
 *
 * Why this lives here (and not inline in the hook):
 *  - Centralises the API contract.
 *  - Keeps the hook focused on lifecycle and timing.
 *  - Lets future entry points (e.g. a "push opt-in" toggle in settings) call
 *    the same helper without duplicating the axios plumbing.
 */

export type FcmPlatform = "android";

export interface RegisterFcmTokenPayload {
  token: string;
  platform: FcmPlatform;
}

export interface RegisterFcmTokenResponse {
  success: boolean;
  message: string;
}

/**
 * Register an FCM token against the authenticated user.
 *
 * The JWT is attached automatically by the shared axios interceptor in
 * {@link ./api}, so callers don't need to handle auth here.
 *
 * Throws on network/server errors. The hook is responsible for deciding
 * whether to retry.
 */
export async function registerFcmToken(
  payload: RegisterFcmTokenPayload,
): Promise<RegisterFcmTokenResponse> {
  const { data } = await api.post<RegisterFcmTokenResponse>(
    "/users/fcm-token",
    payload,
  );
  return data;
}

/**
 * Cheap validation for an incoming token. Anything not looking like an FCM
 * registration token is dropped — we never forward garbage to the backend.
 *
 * FCM tokens are long base64-ish strings; we just enforce "string, non-empty,
 * not absurdly large".
 */
export function isValidFcmToken(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 4096) return false;
  return true;
}
