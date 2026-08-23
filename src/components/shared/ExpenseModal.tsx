import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { expenseService, type IExpense } from "../../services/expense.service";
import { transactionService, type ITxnCategory } from "../../services/transaction.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { paymentMethodLabel } from "../../i18n/labels";

const C = {
  overlay: "var(--overlay-scrim)", card: "var(--bg-elevated)",
  border: "var(--border)", input: "var(--surface-2)",
  inputBorder: "var(--border-strong)",
};
const inputCss = (err?: boolean): React.CSSProperties => ({
  width: "100%", background: C.input,
  border: `1px solid ${err ? "#f87171" : C.inputBorder}`,
  borderRadius: "12px", padding: "10px 14px",
  color: "var(--text-primary)", fontSize: "14px", outline: "none",
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (expense: IExpense) => void;
}

const ExpenseModal = ({ open, onClose, onSuccess }: Props) => {
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ITxnCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const paymentMethods = activeBusiness?.paymentMethods?.length ? activeBusiness.paymentMethods : ["cash", "bank"];

  useEffect(() => {
    if (!open || !activeBusiness) return;
    transactionService.getCategories(activeBusiness._id)
      .then((cats) => setCategories(cats.filter((c) => c.type === "expense" || c.type === "both")))
      .catch(() => toast.error(t("expense.loadCategoriesFailed")));
  }, [open, activeBusiness, t]);

  useEffect(() => {
    if (!open) return;
    setCategoryId(""); setAmount(""); setPaymentMethod("cash");
    setDate(new Date().toISOString().slice(0, 10)); setNote(""); setAttachmentUrl("");
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    const parsedAmount = Number(amount);
    if (!categoryId) { toast.error(t("expense.selectCategory")); return; }
    if (!parsedAmount || parsedAmount <= 0) { toast.error(t("expense.invalidAmount")); return; }

    setSubmitting(true);
    try {
      const result = await expenseService.create({
        businessId: activeBusiness._id,
        categoryId,
        amount: parsedAmount,
        paymentMethod,
        date,
        note: note || undefined,
        attachmentUrl: attachmentUrl || undefined,
      });
      toast.success(t("expense.recorded"));
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("expense.failed");
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
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.border}`, maxHeight: "90dvh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-base font-semibold"
            style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {t("expense.add")}
          </h2>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("common.category")}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setCategoryId(c._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                  style={{
                    background: categoryId === c._id ? "rgba(239,68,68,0.1)" : "var(--surface-2)",
                    borderColor: categoryId === c._id ? "rgba(239,68,68,0.4)" : C.border,
                    color: categoryId === c._id ? "#ef4444" : "var(--text-secondary)",
                  }}
                >
                  {c.icon && <span>{c.icon}</span>}
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("common.amount")}</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={t("common.zero")} style={inputCss()} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("paymentMethod.label")}</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputCss()}>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{paymentMethodLabel(t, m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("common.date")}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputCss()} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("expense.note")}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={inputCss()} />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("expense.receiptUrl")}</label>
            <input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder={t("product.urlPlaceholder")} style={inputCss()} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#ef4444", color: "#fff" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {t("expense.add")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
