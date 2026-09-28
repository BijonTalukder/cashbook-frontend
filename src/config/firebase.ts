import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type Auth,
} from "firebase/auth";
import {
  getAnalytics,
  isSupported,
  logEvent,
  type Analytics,
} from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * Firebase is only used to prove the user's Google identity to our API.
 * Initialize lazily and defensively so missing env vars never break the app.
 */
const createAuth = (): Auth | null => {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return getAuth(app);
  } catch {
    return null;
  }
};

export const firebaseAuth = createAuth();

export const isFirebaseConfigured = () => firebaseAuth !== null;

/** Opens the Google popup and returns the Firebase ID token for our API. */
export const signInWithGoogle = async (): Promise<string> => {
  if (!firebaseAuth) {
    const error = new Error(
      "Google sign-in is not configured",
    ) as Error & { code: string };
    error.code = "GOOGLE_NOT_CONFIGURED";
    throw error;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(firebaseAuth, provider);
  return result.user.getIdToken();
};

/** Clears the local Firebase session (application tokens are cleared separately). */
export const signOutFirebase = async (): Promise<void> => {
  if (!firebaseAuth) return;
  try {
    await signOut(firebaseAuth);
  } catch {
    // best-effort — never block the existing logout flow
  }
};

/* ── Analytics ─────────────────────────────────────────────── */

let analyticsInstance: Analytics | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

/**
 * Initializes Firebase Analytics exactly once, client-side only.
 * Best-effort: unsupported browsers, missing env vars, ad-blockers and any
 * SDK error resolve to `null` instead of throwing — analytics must never
 * break the app.
 */
export const initFirebaseAnalytics = (): Promise<Analytics | null> => {
  if (analyticsPromise) return analyticsPromise;

  analyticsPromise = (async () => {
    if (typeof window === "undefined") return null;
    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.projectId ||
      !firebaseConfig.measurementId
    ) {
      return null;
    }
    try {
      if (!(await isSupported())) return null;
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    } catch {
      return null;
    }
  })();

  return analyticsPromise;
};

/** Fire-and-forget event logging (queues behind `initFirebaseAnalytics`). */
export const logAnalyticsEvent = (
  name: string,
  params?: Record<string, string | number | boolean>,
): void => {
  void initFirebaseAnalytics()
    .then((analytics) => {
      if (!analytics) return;
      try {
        logEvent(analytics, name, params);
      } catch {
        // best-effort — never surface analytics failures to the UI
      }
    })
    .catch(() => {});
};
