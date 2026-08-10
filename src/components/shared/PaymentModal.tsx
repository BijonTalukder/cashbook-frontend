import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { paymentService } from "../../services/payment.service";
import { customerService, type ICustomer } from "../../services/customer.service";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { useBusinessStore } from "../../store/businessStore";

const C = {
  overlay: "var(--overlay-scrim)", card: "var(--bg-elevated)",
  border: "var(--border)", input: "var(--surface-2)",
  inputBorder: "var(--border-strong)",
};
const inputCss: React.CSSProperties = {
  width: "100%", background: C.input, border: `1px solid ${C.inputBorder}`,
  borderRadius: "12px", padding: "10px 14px", color: "var(--text-primary)",
  fontSize: "14px", outline: "none",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

interface PresetParty {
  id: string;
  name: string;
  due: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "receive" | "pay";
  presetParty?: PresetParty | null;
}

const PaymentModal = ({ open, onClose, onSuccess, mode, presetParty }: Props) => {
  const { activeBusiness } = useBusinessStore();
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;
  const paymentMethods = activeBusiness?.paymentMethods?.length ? activeBusiness.paymentMethods : ["cash", "bank"];

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [partyId, setPartyId] = useState(presetParty?.id ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(paymentMethods[0] ?? "cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const options = mode === "receive" ? customers.filter((c) => c.totalDue > 0) : suppliers.filter((s) => s.totalPayable > 0);
  const selectedDue = presetParty
    ? presetParty.due
    : mode === "receive"
      ? customers.find((c) => c._id === partyId)?.totalDue ?? 0
      : suppliers.find((s) => s._id === partyId)?.totalPayable ?? 0;

  useEffect(() => {
    if (!open || !activeBusiness || presetParty) return;
    if (mode === "receive") customerService.getAll(activeBusiness._id).then(setCustomers).catch(() => {});
    else supplierService.getAll(activeBusiness._id).then(setSuppliers).catch(() => {});
  }, [open, activeBusiness, mode, presetParty]);

  useEffect(() => {
    if (!open) return;
    setPartyId(presetParty?.id ?? "");
    setAmount("");
    setMethod(paymentMethods[0] ?? "cash");
    setNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetParty]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    const parsedAmount = Number(amount);
    if (!partyId) { toast.error(mode === "receive" ? "Select a customer" : "Select a supplier"); return; }
    if (!parsedAmount || parsedAmount <= 0) { toast.error("Enter a valid amount"); return; }
    if (parsedAmount > selectedDue) { toast.error("Amount cannot exceed the outstanding balance"); return; }

    setSubmitting(true);
    try {
      if (mode === "receive") {
        await paymentService.receive({
          businessId: activeBusiness._id, customerId: partyId, amount: parsedAmount, method, note: note || undefined,
        });
        toast.success("Payment received");
      } else {
        await paymentService.pay({
          businessId: activeBusiness._id, supplierId: partyId, amount: parsedAmount, method, note: note || undefined,
        });
        toast.success("Payment made");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Payment failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: C.overlay, backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-base font-semibold"
            style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {mode === "receive" ? "Receive Payment" : "Make Payment"}
          </h2>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {presetParty ? (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{presetParty.name}</span>
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>Due: {currencySymbol}{fmt(presetParty.due)}</span>
            </div>
          ) : (
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                {mode === "receive" ? "Customer" : "Supplier"}
              </label>
              <select value={partyId} onChange={(e) => setPartyId(e.target.value)} style={inputCss}>
                <option value="">Select {mode === "receive" ? "customer" : "supplier"}</option>
                {options.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name} — due {currencySymbol}{fmt(mode === "receive" ? (o as ICustomer).totalDue : (o as ISupplier).totalPayable)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>Amount</label>
              {selectedDue > 0 && (
                <button type="button" onClick={() => setAmount(String(selectedDue))} className="text-[11px] font-medium" style={{ color: "#10b981" }}>
                  Pay full ({currencySymbol}{fmt(selectedDue)})
                </button>
              )}
            </div>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0" style={inputCss} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputCss}>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={inputCss} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {mode === "receive" ? "Receive Payment" : "Make Payment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
