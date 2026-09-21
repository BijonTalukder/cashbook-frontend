import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HandCoins, ArrowDownCircle, ArrowUpCircle, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { customerService, type ICustomer } from "../../services/customer.service";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { useBusinessStore } from "../../store/businessStore";
import PaymentModal from "../../components/shared/PaymentModal";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { useRefreshHandler } from "../../native/refresh";
import LoadFailedState from "../../components/shared/LoadFailedState";
import ReportHeader from "../../components/shared/ReportHeader";
import { printElementAsReport } from "../../utils/printReport";
import { toastLoadFailure } from "../../offline/notify";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const BakiPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money } = useFormat();

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [receivableFailed, setReceivableFailed] = useState(false);
  const [payableFailed, setPayableFailed] = useState(false);
  const [tab, setTab] = useState<"receive" | "pay">(searchParams.get("tab") === "pay" ? "pay" : "receive");
  const [payModal, setPayModal] = useState<{ mode: "receive" | "pay"; party: { id: string; name: string; due: number } } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const hasData = tab === "receive" ? customers.length > 0 : suppliers.length > 0;
    if (!hasData) {
      toast.error(t("ledger.nothingToExport"));
      return;
    }
    try {
      await printElementAsReport(printRef.current, {
        title: `${tab === "receive" ? "Receivables" : "Payables"} — ${activeBusiness?.name ?? "Report"}`,
      });
    } catch {
      toast.error(t("common.error"));
    }
  };

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);

    /* The two halves of this screen have different offline capabilities:
       customers are mirrored to IndexedDB, suppliers are not. Settled
       separately so a dropped connection costs the user the payables half
       only — the receivables they are chasing at the counter still show. */
    const [c, s] = await Promise.allSettled([
      customerService.getAll(activeBusiness._id),
      supplierService.getAll(activeBusiness._id),
    ]);

    if (c.status === "fulfilled") {
      setCustomers(c.value.filter((x) => x.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue));
    }
    if (s.status === "fulfilled") {
      setSuppliers(s.value.filter((x) => x.totalPayable > 0).sort((a, b) => b.totalPayable - a.totalPayable));
    }

    setReceivableFailed(c.status === "rejected");
    setPayableFailed(s.status === "rejected");
    if (c.status === "rejected" && s.status === "rejected") toastLoadFailure(t("baki.loadFailed"));

    setLoading(false);
  };

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);


  useEffect(() => { load(); }, [activeBusiness?._id]);

  const totalReceivable = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + s.totalPayable, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {t("baki.title")}
          </h1>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium press"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            title={t("common.download")}
            aria-label={t("common.download")}
          >
            <Download size={13} /> {t("common.download")}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-xs" style={{ color: "rgba(16,185,129,0.8)" }}>{t("baki.willReceive")}</p>
            <p className="text-xl font-bold mt-1" style={{ color: receivableFailed ? "var(--text-faint)" : "#10b981", fontFamily: "'DM Serif Display', serif" }}>
              {receivableFailed ? "—" : money(totalReceivable)}
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-xs" style={{ color: "rgba(239,68,68,0.8)" }}>{t("baki.willPay")}</p>
            <p className="text-xl font-bold mt-1" style={{ color: payableFailed ? "var(--text-faint)" : "#ef4444", fontFamily: "'DM Serif Display', serif" }}>
              {payableFailed ? "—" : money(totalPayable)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-light)" }}>
          {(["receive", "pay"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === key ? (key === "receive" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                color: tab === key ? (key === "receive" ? "#10b981" : "#ef4444") : "var(--text-faint)",
              }}
            >
              {key === "receive" ? t("baki.willReceive") : t("baki.willPay")}
            </button>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : tab === "receive" ? (
            receivableFailed ? (
              <LoadFailedState onRetry={load} />
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                  <HandCoins size={20} style={{ color: "var(--text-faint)" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("baki.noReceivables")}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("baki.noReceivablesHint")}</p>
              </div>
            ) : (
              customers.map((c) => (
                <div key={c._id} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <button onClick={() => navigate(`/customers/${c._id}`)} className="flex-1 min-w-0 text-left flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{t("customer.totalDue", { amount: money(c.totalDue) })}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setPayModal({ mode: "receive", party: { id: c._id, name: c.name, due: c.totalDue } })}
                    className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap press"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                  >
                    <ArrowDownCircle size={12} /> {t("baki.receive")}
                  </button>
                  <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
                </div>
              ))
            )
          ) : payableFailed ? (
            <LoadFailedState onRetry={load} />
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <HandCoins size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("baki.noPayables")}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("baki.noPayablesHint")}</p>
            </div>
          ) : (
            suppliers.map((s) => (
              <div key={s._id} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <button onClick={() => navigate(`/suppliers/${s._id}`)} className="flex-1 min-w-0 text-left flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{t("supplier.totalPayable", { amount: money(s.totalPayable) })}</p>
                  </div>
                </button>
                <button
                  onClick={() => setPayModal({ mode: "pay", party: { id: s._id, name: s.name, due: s.totalPayable } })}
                  className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap press"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                >
                  <ArrowUpCircle size={12} /> {t("baki.pay")}
                </button>
                <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
              </div>
            ))
          )}
        </div>

        {/* Off-screen printable report. Positioned absolutely so it never
            affects layout, but kept in the DOM so the print iframe can
            clone it. */}
        <div
          ref={printRef}
          className="p-6"
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: "800px",
            background: "#ffffff",
            color: "#111827",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
          }}
          aria-hidden="true"
        >
          <ReportHeader
            reportTitle={tab === "receive" ? t("baki.willReceive") : t("baki.willPay")}
            reportMeta={tab === "receive" ? t("baki.title") : t("baki.title")}
          />
          {tab === "receive" ? (
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                  <th className="text-left py-2 font-medium">{t("ledger.csv.party")}</th>
                  <th className="text-right py-2 font-medium">{t("ledger.csv.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td className="py-2">{c.name}</td>
                    <td className="py-2 text-right" style={{ color: "#ef4444", fontWeight: 600 }}>
                      {money(c.totalDue)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-semibold" style={{ borderTop: "1px solid #e5e7eb" }}>
                    {t("common.total")}
                  </td>
                  <td
                    className="py-2 text-right font-bold"
                    style={{ color: "#ef4444", borderTop: "1px solid #e5e7eb" }}
                  >
                    {money(totalReceivable)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                  <th className="text-left py-2 font-medium">{t("ledger.csv.party")}</th>
                  <th className="text-right py-2 font-medium">{t("ledger.csv.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td className="py-2">{s.name}</td>
                    <td className="py-2 text-right" style={{ color: "#ef4444", fontWeight: 600 }}>
                      {money(s.totalPayable)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-semibold" style={{ borderTop: "1px solid #e5e7eb" }}>
                    {t("common.total")}
                  </td>
                  <td
                    className="py-2 text-right font-bold"
                    style={{ color: "#ef4444", borderTop: "1px solid #e5e7eb" }}
                  >
                    {money(totalPayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      <PaymentModal
        open={!!payModal}
        mode={payModal?.mode ?? "receive"}
        presetParty={payModal?.party}
        onClose={() => setPayModal(null)}
        onSuccess={load}
      />
    </div>
  );
};

export default BakiPage;
