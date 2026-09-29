import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { isNativeApp } from "../native/bridge";
import { isValidFcmToken, registerFcmToken } from "../services/fcmService";

/**
 * Android WebView FCM token → backend registration.
 *
 * Flow:
 *
 *   1. The Android shell pushes the FCM device token into
 *      {@code window.onAndroidFcmTokenReceived(token)} at some point —
 *      before, during or after React has mounted.
 *   2. This hook installs the receiver, validates the token, and stashes it.
 *   3. When the user becomes authenticated, the token is sent to the backend
 *      via {@code POST /users/fcm-token}.
 *   4. If a new token arrives after login (FCM can rotate the device token),
 *      it is forwarded immediately.
 *
 * Outside the Android WebView shell the hook is a no-op — the website keeps
 * working on Chrome/Firefox/Edge/mobile browsers.
 */

let pendingToken: string | null = null;
let tokenListenerInstalled = false;

/**
 * Install {@code window.onAndroidFcmTokenReceived} exactly once across the
 * app lifetime. Subsequent mounts of the hook reuse the existing receiver so
 * HMR and StrictMode double-mounts never lose a token.
 */
function installReceiver(): void {
  if (typeof window === "undefined" || tokenListenerInstalled) return;
  tokenListenerInstalled = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as unknown as { onAndroidFcmTokenReceived?: (t: string) => void };
  w.onAndroidFcmTokenReceived = (raw: string) => {
    if (!isValidFcmToken(raw)) {
      // eslint-disable-next-line no-console
      console.warn("[FCM] Ignoring invalid token from native");
      return;
    }
    pendingToken = raw.trim();
  };
}

/**
 * useAndroidFcm
 *
 * Mount once near the root of the app. It:
 *   - installs the {@code window.onAndroidFcmTokenReceived} receiver,
 *   - registers the token with the backend once the user is logged in,
 *   - registers again on token rotation.
 */
export function useAndroidFcm(): void {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  // Latest-auth-state ref so the receiver and effect can read fresh values
  // without re-binding on every render.
  const authRef = useRef({ token, userId: user?._id });
  useEffect(() => {
    authRef.current = { token, userId: user?._id };
  }, [token, user?._id]);

  // (userId, token) memo so we don't spam the backend on every render or
  // remount. Cleared on logout so a second user on the same device can
  // re-register the same token against their own account.
  const lastRegisteredRef = useRef<{ userId?: string; token?: string }>({});

  const registerNow = useCallback(async (tokenValue: string) => {
    const { token: authToken, userId } = authRef.current;
    if (!authToken || !userId) return; // not logged in — wait for login
    if (
      lastRegisteredRef.current.userId === userId &&
      lastRegisteredRef.current.token === tokenValue
    ) {
      return; // already done for this session
    }
    // Optimistic guard: stamp the memo before the await so a second mount
    // (StrictMode/HMR) can't fire a duplicate POST in the race window.
    const previous = lastRegisteredRef.current;
    lastRegisteredRef.current = { userId, token: tokenValue };
    try {
      const res = await registerFcmToken({
        token: tokenValue,
        platform: "android",
      });
      if (!res?.success) {
        lastRegisteredRef.current = previous; // let a retry happen
      }
    } catch (err) {
      lastRegisteredRef.current = previous; // let a retry happen
      // eslint-disable-next-line no-console
      console.warn("[FCM] token registration failed", err);
    }
  }, []);

  useEffect(() => {
    if (!isNativeApp()) return; // Web — nothing to do.
    installReceiver();

    // Pick up a token that arrived before this hook instance mounted.
    if (pendingToken && isValidFcmToken(pendingToken)) {
      void registerNow(pendingToken);
    }
  }, [registerNow]);

  useEffect(() => {
    if (!token || !user?._id) {
      // Logged out — clear our memo so the next user on the same device can
      // re-register the same token against their own account (the backend
      // transfers ownership).
      lastRegisteredRef.current = {};
      return;
    }
    if (pendingToken && isValidFcmToken(pendingToken)) {
      void registerNow(pendingToken);
    }
  }, [token, user?._id, registerNow]);
}

/** Test-only — clears the pending token between unit tests. */
export function __resetFcmPendingTokenForTests(): void {
  pendingToken = null;
  tokenListenerInstalled = false;
}
