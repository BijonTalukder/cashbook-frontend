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
import { NativeCard } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonList } from "../../components/ui/Skeleton";

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
  const [tab, setTab] = useState<"receive" | "pay">(
    searchParams.get("tab") === "pay" ? "pay" : "receive"
  );
  const [payModal, setPayModal] = useState<{
    mode: "receive" | "pay";
    party: { id: string; name: string; due: number };
  } | null>(null);
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

  useRefreshHandler(load);

  useEffect(() => {
    load();
  }, [activeBusiness?._id]);

  const totalReceivable = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + s.totalPayable, 0);

  const tabOptions = [
    {
      value: "receive" as const,
      label: t("baki.willReceive"),
      badge: customers.length > 0 ? customers.length : undefined,
    },
    {
      value: "pay" as const,
      label: t("baki.willPay"),
      badge: suppliers.length > 0 ? suppliers.length : undefined,
    },
  ];

  return (
    <div className="min-h-screen pb-12 bg-[var(--bg)]">
      <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {t("baki.title")}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t("bizDashboard.receivableAndPayable")}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            className="gap-1.5"
            aria-label={t("common.download")}
          >
            <Download size={14} /> {t("common.download")}
          </Button>
        </div>

        {/* Balance Metric Cards with Clean Native Styling */}
        <div className="grid grid-cols-2 gap-3">
          <NativeCard variant="elevated" className="bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20">
            <p className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
              {t("baki.willReceive")}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              {receivableFailed ? "—" : money(totalReceivable)}
            </p>
          </NativeCard>

          <NativeCard variant="elevated" className="bg-red-500/5 dark:bg-red-950/20 border-red-500/20">
            <p className="text-[12px] font-medium text-red-700 dark:text-red-400">
              {t("baki.willPay")}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-red-600 dark:text-red-400 tracking-tight font-mono">
              {payableFailed ? "—" : money(totalPayable)}
            </p>
          </NativeCard>
        </div>

        {/* Tactile Native Segmented Control */}
        <SegmentedControl
          options={tabOptions}
          value={tab}
          onChange={(newTab) => setTab(newTab)}
          size="md"
        />

        {/* List Content Container */}
        <NativeCard noPadding variant="elevated">
          {loading ? (
            <div className="p-4">
              <SkeletonList count={4} />
            </div>
          ) : tab === "receive" ? (
            receivableFailed ? (
              <LoadFailedState onRetry={load} />
            ) : customers.length === 0 ? (
              <EmptyState
                icon={HandCoins}
                title={t("baki.noReceivables")}
                description={t("baki.noReceivablesHint")}
              />
            ) : (
              customers.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800/80 last:border-b-0"
                >
                  <button
                    onClick={() => navigate(`/customers/${c._id}`)}
                    className="flex-1 min-w-0 text-left flex items-center gap-3 select-none active:opacity-75 transition-opacity"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-red-500 dark:text-red-400 font-semibold tracking-tight mt-0.5">
                        {t("customer.totalDue", { amount: money(c.totalDue) })}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setPayModal({
                          mode: "receive",
                          party: { id: c._id, name: c.name, due: c.totalDue },
                        })
                      }
                      className="gap-1.5 h-9 px-3 text-xs"
                    >
                      <ArrowDownCircle size={14} /> {t("baki.receive")}
                    </Button>
                    <button
                      onClick={() => navigate(`/customers/${c._id}`)}
                      className="p-1 text-neutral-400 hover:text-neutral-600"
                      aria-label="View customer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : payableFailed ? (
            <LoadFailedState onRetry={load} />
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title={t("baki.noPayables")}
              description={t("baki.noPayablesHint")}
            />
          ) : (
            suppliers.map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800/80 last:border-b-0"
              >
                <button
                  onClick={() => navigate(`/suppliers/${s._id}`)}
                  className="flex-1 min-w-0 text-left flex items-center gap-3 select-none active:opacity-75 transition-opacity"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold tracking-tight mt-0.5">
                      {t("supplier.totalPayable", { amount: money(s.totalPayable) })}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setPayModal({
                        mode: "pay",
                        party: { id: s._id, name: s.name, due: s.totalPayable },
                      })
                    }
                    className="gap-1.5 h-9 px-3 text-xs"
                  >
                    <ArrowUpCircle size={14} /> {t("baki.pay")}
                  </Button>
                  <button
                    onClick={() => navigate(`/suppliers/${s._id}`)}
                    className="p-1 text-neutral-400 hover:text-neutral-600"
                    aria-label="View supplier"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </NativeCard>

        {/* Off-screen printable report */}
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
            reportMeta={t("baki.title")}
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
