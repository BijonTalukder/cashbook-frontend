import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Sheet from "./Sheet";
import { haptic } from "../../native/bridge";
import { registerConfirmHost, type PendingConfirm } from "./confirm";

/** Renders whatever `confirmAction()` asks for. Mount once, near the router. */
const ConfirmHost = () => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    registerConfirmHost((p) => {
      setPending(p);
      setOpen(!!p);
    });
    return () => registerConfirmHost(null);
  }, []);

  const settle = (value: boolean) => {
    pending?.resolve(value);
    setOpen(false);
    // Let the sheet play its exit animation before the content disappears.
    setTimeout(() => setPending(null), 240);
  };

  if (!pending) return null;

  return (
    <Sheet
      open={open}
      onClose={() => settle(false)}
      size="sm"
      hideClose
      footer={
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              haptic("light");
              settle(false);
            }}
            className="flex-1 rounded-xl py-3.5 text-sm font-semibold press"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
          >
            {pending.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => {
              haptic(pending.danger ? "heavy" : "medium");
              settle(true);
            }}
            className="flex-1 rounded-xl py-3.5 text-sm font-semibold press"
            style={{
              background: pending.danger ? "#ef4444" : "var(--brand)",
              color: pending.danger ? "#fff" : "var(--brand-ink)",
            }}
          >
            {pending.confirmLabel ?? "OK"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center gap-3 py-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: pending.danger
              ? "rgba(239,68,68,0.12)"
              : "rgba(16,185,129,0.12)",
          }}
        >
          <AlertTriangle
            size={24}
            style={{ color: pending.danger ? "#ef4444" : "var(--brand)" }}
          />
        </div>
        <h3 className="text-base font-semibold px-2" style={{ color: "var(--text-primary)" }}>
          {pending.title}
        </h3>
        {pending.message && (
          <p className="text-sm leading-relaxed px-2" style={{ color: "var(--text-muted)" }}>
            {pending.message}
          </p>
        )}
      </div>
    </Sheet>
  );
};

export default ConfirmHost;
