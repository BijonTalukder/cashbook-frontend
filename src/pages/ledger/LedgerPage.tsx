import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, ArrowLeftRight, ArrowDownCircle, ArrowUpCircle, Download } from "lucide-react";
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
import { toastLoadFailure } from "../../offline/notify";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
  input: "var(--surface-2)",
  inputBorder: "var(--border-strong)",
};

const LedgerPage = () => {
  const { activeBusiness } = useBusinessStore();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { money, date: fmtDate } = useFormat();

  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showFilters, setShowFilters] = useState(!!searchParams.get("sourceType"));

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
    setType(""); setSourceType(""); setCustomerId(""); setSupplierId("");
    setPaymentMethod(""); setStartDate(""); setEndDate("");
  };
  const hasFilters = !!(type || sourceType || customerId || supplierId || paymentMethod || startDate || endDate);

  const exportCsv = () => {
    if (transactions.length === 0) {
      toast.error(t("ledger.nothingToExport"));
      return;
    }
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {t("ledger.title")}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-muted)" }}
            >
              <Download size={13} /> {t("common.export")}
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: hasFilters ? "rgba(16,185,129,0.1)" : C.card,
                border: `1px solid ${hasFilters ? "rgba(16,185,129,0.4)" : C.border}`,
                color: hasFilters ? "#10b981" : "var(--text-muted)",
              }}
            >
              <Filter size={13} /> {t("ledger.filters")}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="grid grid-cols-2 gap-3">
              <select value={type} onChange={(e) => setType(e.target.value)}
                style={{ background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13 }}>
                <option value="">{t("ledger.allTypes")}</option>
                <option value="income">{t("txn.income")}</option>
                <option value="expense">{t("txn.expense")}</option>
              </select>
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}
                style={{ background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13 }}>
                <option value="">{t("ledger.allSources")}</option>
                <option value="sale">{t("ledger.sourceSales")}</option>
                <option value="purchase">{t("ledger.sourcePurchases")}</option>
                <option value="expense">{t("ledger.sourceExpenses")}</option>
                <option value="payment">{t("ledger.sourcePayments")}</option>
              </select>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                style={{ background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13 }}>
                <option value="">{t("ledger.allCustomers")}</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                style={{ background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13 }}>
                <option value="">{t("ledger.allSuppliers")}</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13 }}>
                <option value="">{t("ledger.allMethods")}</option>
                {(activeBusiness?.paymentMethods ?? ["cash", "bank"]).map((m) => (
                  <option key={m} value={m}>{paymentMethodLabel(t, m)}</option>
                ))}
              </select>
              <div />
              <input type="date" aria-label={t("ledger.startDate")} title={t("ledger.startDate")} value={startDate} onChange={(e) => setStartDate(e.target.value)}
                style={{ background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13 }} />
              <input type="date" aria-label={t("ledger.endDate")} title={t("ledger.endDate")} value={endDate} onChange={(e) => setEndDate(e.target.value)}
                style={{ background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13 }} />
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs font-medium" style={{ color: "#ef4444" }}>
                {t("ledger.clearFilters")}
              </button>
            )}
          </div>
        )}

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : failed ? (
            <LoadFailedState onRetry={load} />
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <ArrowLeftRight size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("ledger.empty")}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                {hasFilters ? t("ledger.emptyFiltered") : t("ledger.emptyHint")}
              </p>
            </div>
          ) : (
            transactions.map((txn) => (
              <div
                key={txn._id}
                className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: txn.type === "income" ? "#10b98115" : "#ef444415",
                    color: txn.type === "income" ? "#10b981" : "#ef4444",
                  }}
                >
                  {txn.type === "income" ? <ArrowDownCircle size={15} /> : <ArrowUpCircle size={15} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {txn.source
                      ? enumLabel(t, "source", txn.source.type)
                      : txn.category?.name ?? t("ledger.fallbackEntry")}
                    {(txn.customer || txn.supplier) && (
                      <span style={{ color: "var(--text-faint)" }}> · {txn.customer?.name ?? txn.supplier?.name}</span>
                    )}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                    {txn.paymentMethod
                      ? t("ledger.dateAndMethod", {
                          date: fmtDate(txn.date),
                          method: paymentMethodLabel(t, txn.paymentMethod),
                        })
                      : fmtDate(txn.date)}
                  </p>
                </div>
                <p
                  className="text-sm font-semibold flex-shrink-0"
                  style={{ color: txn.type === "income" ? "#10b981" : "#ef4444" }}
                >
                  {money(txn.type === "income" ? txn.amount : -txn.amount, { signed: true })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerPage;
