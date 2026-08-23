import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { expenseService, type IExpense } from "../../services/expense.service";
import { useBusinessStore } from "../../store/businessStore";
import ExpenseModal from "../../components/shared/ExpenseModal";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { paymentMethodLabel } from "../../i18n/labels";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const ExpensesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, date: fmtDate } = useFormat();

  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(searchParams.get("new") === "1");

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await expenseService.getAll(activeBusiness._id, { limit: "50" });
      setExpenses(data.expenses);
    } catch {
      toast.error(t("expense.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeBusiness?._id]);

  const totalThisList = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {t("expense.title")}
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: "#ef4444", color: "#fff" }}
          >
            <Plus size={15} /> {t("expense.add")}
          </button>
        </div>

        {expenses.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("expense.totalRecent")}</p>
            <p className="text-2xl font-bold" style={{ color: "#ef4444", fontFamily: "'DM Serif Display', serif" }}>
              {money(totalThisList)}
            </p>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <Receipt size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("expense.empty")}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("expense.emptyHintBusiness")}</p>
            </div>
          ) : (
            expenses.map((e) => (
              <div
                key={e._id}
                className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)" }}
                >
                  {e.category?.icon || "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {e.category?.name ?? t("expense.fallbackName")}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                    {t("expense.dateAndMethod", {
                      date: fmtDate(e.date, "short"),
                      method: paymentMethodLabel(t, e.paymentMethod),
                    })}
                  </p>
                </div>
                <p className="text-sm font-semibold flex-shrink-0" style={{ color: "#ef4444" }}>
                  {money(-e.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(e) => setExpenses((prev) => [e, ...prev])}
      />
    </div>
  );
};

export default ExpensesPage;
