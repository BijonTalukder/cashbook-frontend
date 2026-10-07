import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  FileText,
  RotateCcw,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { transactionService, type ITransaction } from "../../services/transaction.service";
import { customerService, type ICustomer } from "../../services/customer.service";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { enumLabel, paymentMethodLabel } from "../../i18n/labels";
import { useRefreshHandler } from "../../native/refresh";
import LoadFailedState from "../../components/shared/LoadFailedState";
import ReportHeader from "../../components/shared/ReportHeader";
import { printElementAsReport } from "../../utils/printReport";
import { toastLoadFailure } from "../../offline/notify";
import { haptic } from "../../native/bridge";

const LedgerPage = () => {
  const { activeBusiness } = useBusinessStore();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showFilters, setShowFilters] = useState(!!searchParams.get("sourceType"));
  const printRef = useRef<HTMLDivElement>(null);

  const [type, setType] = useState("");
  const [sourceType, setSourceType] = useState(searchParams.get("sourceType") ?? "");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!activeBusiness) return;
    customerService.getAll(activeBusiness._id).then(setCustomers).catch(() => {});
    supplierService.getAll(activeBusiness._id).then(setSuppliers).catch(() => {});
  }, [activeBusiness?._id]);

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (type) params.type = type;
      if (sourceType) params.sourceType = sourceType;
      if (customerId) params.customerId = customerId;
      if (supplierId) params.supplierId = supplierId;
      if (paymentMethod) params.paymentMethod = paymentMethod;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await transactionService.getAll(activeBusiness._id, params);
      setTransactions(data.transactions);
      setFailed(false);
    } catch {
      setFailed(true);
      toastLoadFailure(t("ledger.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?._id, type, sourceType, customerId, supplierId, paymentMethod, startDate, endDate]);

  const clearFilters = () => {
    haptic("light");
    setType("");
    setSourceType("");
    setCustomerId("");
    setSupplierId("");
    setPaymentMethod("");
    setStartDate("");
    setEndDate("");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (type) count++;
    if (sourceType) count++;
    if (customerId) count++;
    if (supplierId) count++;
    if (paymentMethod) count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  }, [type, sourceType, customerId, supplierId, paymentMethod, startDate, endDate]);

  const hasFilters = activeFiltersCount > 0;

  // Calculate totals for currently filtered transactions
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const txn of transactions) {
      if (txn.type === "income") income += txn.amount;
      else if (txn.type === "expense") expense += txn.amount;
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  const exportCsv = () => {
    if (transactions.length === 0) {
      toast.error(t("ledger.nothingToExport"));
      return;
    }
    haptic("light");
    const header = [
      t("ledger.csv.date"),
      t("ledger.csv.type"),
      t("ledger.csv.source"),
      t("ledger.csv.party"),
      t("ledger.csv.category"),
      t("ledger.csv.paymentMethod"),
      t("ledger.csv.amount"),
    ];
    const rows = transactions.map((txn) => [
      fmtDate(txn.date),
      enumLabel(t, "txn", txn.type),
      txn.source ? enumLabel(t, "source", txn.source.type) : "",
      txn.customer?.name ?? txn.supplier?.name ?? "",
      txn.category?.name ?? "",
      paymentMethodLabel(t, txn.paymentMethod),
      String(txn.amount),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${activeBusiness?.name ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (transactions.length === 0) {
      toast.error(t("ledger.nothingToExport"));
      return;
    }
    if (!printRef.current) return;
    haptic("light");
    try {
      await printElementAsReport(printRef.current, {
        title: `Ledger — ${activeBusiness?.name ?? "Report"}`,
      });
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-28 text-slate-900 dark:text-neutral-100">
      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              {t("ledger.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {num(transactions.length)}টি খতিয়ান এন্ট্রি
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 h-10 rounded-2xl text-xs font-semibold bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-neutral-100 active:scale-95 transition-all shadow-xs select-none"
              title={t("common.download")}
              aria-label={t("common.download")}
            >
              <FileText size={14} />
              <span className="hidden sm:inline">{t("common.download")}</span>
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 h-10 rounded-2xl text-xs font-semibold bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-neutral-100 active:scale-95 transition-all shadow-xs select-none"
              title={t("common.export")}
              aria-label={t("common.export")}
            >
              <Download size={14} />
              <span className="hidden sm:inline">{t("common.export")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic("selection");
                setShowFilters((v) => !v);
              }}
              className={`flex items-center gap-1.5 px-3.5 h-10 rounded-2xl text-xs font-bold transition-all shadow-xs select-none active:scale-95 ${
                hasFilters
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-neutral-100"
              }`}
            >
              <Filter size={14} />
              <span>{t("ledger.filters")}</span>
              {hasFilters && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-700 text-[11px] font-bold flex items-center justify-center ml-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Ledger Summary Strip */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 block truncate">
                মোট জমা (Credit)
              </span>
              <p className="text-sm sm:text-lg font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                {money(totals.income)}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-rose-200/60 dark:border-rose-900/40 shadow-xs">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 block truncate">
                মোট খরচ (Debit)
              </span>
              <p className="text-sm sm:text-lg font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                {money(totals.expense)}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 block truncate">
                নিট জের (Net)
              </span>
              <p
                className={`text-sm sm:text-lg font-bold font-mono tracking-tight mt-0.5 truncate ${
                  totals.net >= 0
                    ? "text-slate-900 dark:text-neutral-100"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {money(totals.net)}
              </p>
            </div>
          </div>
        )}

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">{t("ledger.allTypes")}</option>
                <option value="income">{t("txn.income")}</option>
                <option value="expense">{t("txn.expense")}</option>
              </select>

              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">{t("ledger.allSources")}</option>
                <option value="sale">{t("ledger.sourceSales")}</option>
                <option value="purchase">{t("ledger.sourcePurchases")}</option>
                <option value="expense">{t("ledger.sourceExpenses")}</option>
                <option value="payment">{t("ledger.sourcePayments")}</option>
              </select>

              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">{t("ledger.allCustomers")}</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">{t("ledger.allSuppliers")}</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">{t("ledger.allMethods")}</option>
                {(activeBusiness?.paymentMethods ?? ["cash", "bank"]).map((m) => (
                  <option key={m} value={m}>
                    {paymentMethodLabel(t, m)}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  aria-label={t("ledger.startDate")}
                  title={t("ledger.startDate")}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl text-xs font-mono font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <input
                  type="date"
                  aria-label={t("ledger.endDate")}
                  title={t("ledger.endDate")}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl text-xs font-mono font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {hasFilters && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 active:scale-95 transition-all"
                >
                  <RotateCcw size={12} />
                  <span>{t("ledger.clearFilters")}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ledger Surface */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
          {loading ? (
            <div className="p-4 space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl animate-pulse bg-slate-100 dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : failed ? (
            <LoadFailedState onRetry={load} />
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                <ArrowLeftRight size={22} />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {t("ledger.empty")}
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {hasFilters ? t("ledger.emptyFiltered") : t("ledger.emptyHint")}
              </p>
            </div>
          ) : (
            transactions.map((txn) => {
              const isIncome = txn.type === "income";
              return (
                <div
                  key={txn._id}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors select-none"
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-slate-900 dark:text-neutral-100">
                      {txn.source
                        ? enumLabel(t, "source", txn.source.type)
                        : txn.category?.name ?? t("ledger.fallbackEntry")}
                      {(txn.customer || txn.supplier) && (
                        <span className="text-slate-500 dark:text-neutral-400 font-normal">
                          {" "}
                          • {txn.customer?.name ?? txn.supplier?.name}
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-neutral-400 mt-0.5">
                      {txn.paymentMethod
                        ? t("ledger.dateAndMethod", {
                            date: fmtDate(txn.date),
                            method: paymentMethodLabel(t, txn.paymentMethod),
                          })
                        : fmtDate(txn.date)}
                    </p>
                  </div>

                  <p
                    className={`text-sm sm:text-base font-bold font-mono tracking-tight shrink-0 ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {money(isIncome ? txn.amount : -txn.amount, { signed: true })}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Off-screen printable report for PDF iframe generation */}
        {transactions.length > 0 && (
          <div
            ref={printRef}
            className="p-6 bg-white text-slate-900 border border-slate-200 rounded-2xl"
            style={{
              position: "absolute",
              left: "-9999px",
              top: 0,
              width: "800px",
            }}
            aria-hidden="true"
          >
            <ReportHeader
              reportTitle={t("ledger.title")}
              reportMeta={
                startDate || endDate
                  ? `${startDate || "…"} → ${endDate || "…"}`
                  : fmtDate(new Date().toISOString(), "short")
              }
            />
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-2 font-medium">{t("ledger.csv.date")}</th>
                  <th className="text-left py-2 font-medium">{t("ledger.csv.type")}</th>
                  <th className="text-left py-2 font-medium">{t("ledger.csv.source")}</th>
                  <th className="text-left py-2 font-medium">{t("ledger.csv.party")}</th>
                  <th className="text-left py-2 font-medium">{t("ledger.csv.category")}</th>
                  <th className="text-left py-2 font-medium">{t("ledger.csv.paymentMethod")}</th>
                  <th className="text-right py-2 font-medium">{t("ledger.csv.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn._id} className="border-b border-slate-100">
                    <td className="py-2">{fmtDate(txn.date)}</td>
                    <td className="py-2">{enumLabel(t, "txn", txn.type)}</td>
                    <td className="py-2">{txn.source ? enumLabel(t, "source", txn.source.type) : ""}</td>
                    <td className="py-2">{txn.customer?.name ?? txn.supplier?.name ?? ""}</td>
                    <td className="py-2">{txn.category?.name ?? ""}</td>
                    <td className="py-2">{txn.paymentMethod ? paymentMethodLabel(t, txn.paymentMethod) : ""}</td>
                    <td
                      className={`py-2 text-right font-mono font-bold ${
                        txn.type === "income" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {money(txn.type === "income" ? txn.amount : -txn.amount, { signed: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerPage;
