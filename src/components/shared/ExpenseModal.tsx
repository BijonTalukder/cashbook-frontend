import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
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
const ACCENT = "#ef4444";
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
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const catInputRef = useRef<HTMLInputElement>(null);

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
    setAddingCat(false); setNewCatName("");
  }, [open]);

  useEffect(() => {
    if (addingCat) setTimeout(() => catInputRef.current?.focus(), 50);
  }, [addingCat]);

  const handleCreateCat = async () => {
    const name = newCatName.trim();
    if (!name || !activeBusiness) return;
    setSavingCat(true);
    try {
      const newCat = await transactionService.createCategory({
        name, type: "expense", businessId: activeBusiness._id,
      });
      setCategories((prev) => [...prev, newCat]);
      setCategoryId(newCat._id);
      setNewCatName(""); setAddingCat(false);
      toast.success(t("txn.categoryAdded", { name }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("txn.createCategoryFailed");
      toast.error(msg);
    } finally { setSavingCat(false); }
  };

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
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {categories.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setCategoryId(c._id)}
                  className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-medium border flex-shrink-0 whitespace-nowrap press"
                  style={{
                    background: categoryId === c._id ? `${ACCENT}15` : C.input,
                    borderColor: categoryId === c._id ? `${ACCENT}40` : C.inputBorder,
                    color: categoryId === c._id ? ACCENT : "var(--text-secondary)",
                  }}
                >
                  {c.icon && <span>{c.icon}</span>}
                  {c.name}
                </button>
              ))}
              {!addingCat && (
                <button type="button" onClick={() => setAddingCat(true)}
                  className="flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-medium border flex-shrink-0 whitespace-nowrap press"
                  style={{
                    background: "transparent",
                    border: `1px dashed ${C.inputBorder}`,
                    color: "var(--text-faint)",
                  }}>
                  <Plus size={11} /> {t("txn.newCategory")}
                </button>
              )}
            </div>
            {addingCat && (
              <div className="flex items-center gap-2 mt-2">
                <input ref={catInputRef} value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleCreateCat(); }
                    if (e.key === "Escape") { setAddingCat(false); setNewCatName(""); }
                  }}
                  placeholder={t("txn.categoryNamePlaceholder")}
                  className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ background: C.input, border: `1px solid ${ACCENT}55`, color: "var(--text-primary)" }} />
                <button type="button" onClick={handleCreateCat}
                  disabled={!newCatName.trim() || savingCat}
                  className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 disabled:opacity-40"
                  style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                  {savingCat ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
                <button type="button" onClick={() => { setAddingCat(false); setNewCatName(""); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: C.input, color: "var(--text-faint)", border: `1px solid ${C.inputBorder}` }}>
                  <X size={13} />
                </button>
              </div>
            )}
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
            style={{ background: ACCENT, color: "#fff" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {t("expense.add")}
          </button>
        </form>
    </Sheet>
  );
};

export default ExpenseModal;
