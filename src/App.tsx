import { useEffect } from "react";
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "sonner";
import { startOfflineRuntime } from "./offline/bootstrap";
import { probeApi } from "./offline/network";
import { scheduleSync } from "./offline/syncManager";
import OfflineAnnouncer from "./components/shared/OfflineAnnouncer";
import ConfirmHost from "./components/ui/ConfirmDialog";
import { installNativeHooks, isNativeApp, setSystemBars } from "./native/bridge";
import { useThemeStore } from "./store/themeStore";
import { useAndroidFcm } from "./hooks/useAndroidFcm";

function App() {
  const theme = useThemeStore((s) => s.theme);

  // No-op outside the WebView shell.
  useAndroidFcm();

  // Connectivity watching, queue recovery and the sync triggers all start here,
  // before the first route renders, so a reload with pending work picks it up.
  useEffect(() => {
    startOfflineRuntime();
  }, []);

  // Native → web entry points must exist before the wrapper's first call.
  useEffect(() => {
    installNativeHooks({
      onNetworkChange: (online) => {
        // Mirrors the browser events the offline runtime already listens to,
        // so the wrapper's connectivity callback needs no special casing.
        window.dispatchEvent(new Event(online ? "online" : "offline"));
      },
      onResume: () => {
        // Coming back from the recents list should re-check reachability and
        // flush anything queued while the app was backgrounded. Deliberately a
        // probe rather than a synthetic "online" event: the app may well have
        // been resumed with no connection, and faking the event would tell the
        // connectivity layer the link is up before it has checked.
        void probeApi();
        scheduleSync(300);
      },
    });
  }, []);

  // Status and navigation bars follow the in-app theme; a mismatched strip at
  // the top of the screen is the fastest way to look like a wrapped web page.
  useEffect(() => {
    setSystemBars(theme === "dark" ? "#0a0f1e" : "#f8fafc", theme === "dark");
  }, [theme]);

  return (
    <>
      <RouterProvider router={router} />
      <OfflineAnnouncer />
      <ConfirmHost />
      <Toaster
        richColors
        position={isNativeApp() ? "top-center" : "top-right"}
        // Sonner switches to `mobileOffset` under 600px, which is every phone
        // this ships to — setting only `offset` left toasts sitting on top of
        // the app bar.
        offset="calc(var(--safe-top) + var(--header-h) + 10px)"
        mobileOffset={{
          top: "calc(var(--safe-top) + var(--header-h) + 10px)",
          left: "12px",
          right: "12px",
        }}
        toastOptions={{ style: { borderRadius: "14px" } }}
      />
    </>
  );
}

export default App;
