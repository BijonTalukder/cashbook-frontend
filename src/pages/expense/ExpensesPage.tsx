import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Receipt } from "lucide-react";
import { expenseService, type IExpense } from "../../services/expense.service";
import { useBusinessStore } from "../../store/businessStore";
import ExpenseModal from "../../components/shared/ExpenseModal";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { paymentMethodLabel } from "../../i18n/labels";
import { useRefreshHandler } from "../../native/refresh";
import LoadFailedState from "../../components/shared/LoadFailedState";
import { toastLoadFailure } from "../../offline/notify";
import { haptic } from "../../native/bridge";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const ExpensesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
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
      setFailed(false);
    } catch {
      setFailed(true);
      toastLoadFailure(t("expense.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);

  useEffect(() => { load(); }, [activeBusiness?._id]);

  const totalThisList = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100">
      <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-4">
        {/* Header section with native hierarchy */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              {t("expense.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {t("expenses.vouchersCount", { count: num(expenses.length) })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic("medium");
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 h-11 rounded-2xl text-sm font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all text-white shadow-md shadow-rose-600/20 shrink-0 select-none"
          >
            <Plus size={16} />
            <span>{t("expense.add")}</span>
          </button>
        </div>

        {/* Total Expenses Hero Banner */}
        {expenses.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                {t("expense.totalRecent")}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1 tracking-tight">
                {money(totalThisList)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Receipt size={24} />
            </div>
          </div>
        )}

        {/* Expenses List Surface */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-2xl bg-slate-100 dark:bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
          ) : failed ? (
            <LoadFailedState onRetry={load} />
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                <Receipt size={22} />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {t("expense.empty")}
              </p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-sm">
                {t("expense.emptyHintBusiness")}
              </p>
            </div>
          ) : (
            expenses.map((e) => (
              <div
                key={e._id}
                className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors select-none"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-base bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 shadow-xs">
                  {e.category?.icon || "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">
                      {e.category?.name ?? t("expense.fallbackName")}
                    </p>
                    {e.note && (
                      <span className="text-xs text-slate-400 dark:text-neutral-500 truncate hidden sm:inline">
                        — {e.note}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                    <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold text-[10px]">
                      {paymentMethodLabel(t, e.paymentMethod)}
                    </span>
                    <span>{fmtDate(e.date, "short")}</span>
                  </div>
                </div>
                <p className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 shrink-0">
                  {money(-e.amount, { signed: true })}
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
