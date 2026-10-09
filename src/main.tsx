import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initFirebaseAnalytics } from "./config/firebase";

// Auto-recover from stale chunks right after new deployments
window.addEventListener("vite:preloadError", (event) => {
  const key = "hisabboi_chunk_reload";
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "1");
    event.preventDefault();
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* Firebase Analytics — client-only, best-effort (never blocks first paint). */
void initFirebaseAnalytics();

/**
 * Retire the boot splash once the first frame has actually painted.
 * Two rAFs: the first fires before layout, the second after the browser has
 * committed it — dismissing on the first would reveal an unstyled frame.
 */
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    const splash = document.getElementById("boot-splash");
    if (!splash) return;
    splash.classList.add("is-hidden");
    splash.addEventListener("transitionend", () => splash.remove(), { once: true });
    // Belt and braces: if the transition never fires (reduced motion, a
    // backgrounded tab), the splash must still not stay on top of the app.
    setTimeout(() => splash.remove(), 600);
  }),
);
