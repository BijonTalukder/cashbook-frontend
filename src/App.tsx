import { useEffect } from "react";
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "sonner";
import { startOfflineRuntime } from "./offline/bootstrap";
import OfflineAnnouncer from "./components/shared/OfflineAnnouncer";

function App() {
  // Connectivity watching, queue recovery and the sync triggers all start here,
  // before the first route renders, so a reload with pending work picks it up.
  useEffect(() => {
    startOfflineRuntime();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <OfflineAnnouncer />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
