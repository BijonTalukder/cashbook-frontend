import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { expenseService, type IExpense } from "../../services/expense.service";
import { transactionService, type ITxnCategory } from "../../services/transaction.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { paymentMethodLabel } from "../../i18n/labels";
import Sheet from "../ui/Sheet";

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
    <Sheet open={open} onClose={onClose} size="md" title={t("expense.add")}>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("common.category")}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setCategoryId(c._id)}
                  className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-medium border flex-shrink-0 whitespace-nowrap press"
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
            <input type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
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
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold press disabled:opacity-60"
            style={{ background: "#ef4444", color: "#fff" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {t("expense.add")}
          </button>
        </form>
    </Sheet>
  );
};

export default ExpenseModal;
