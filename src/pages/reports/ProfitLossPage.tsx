import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { toast } from "sonner";
import { reportService, type IProfitLoss } from "../../services/report.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { useRefreshHandler } from "../../native/refresh";
import ReportHeader from "../../components/shared/ReportHeader";
import { printElementAsReport } from "../../utils/printReport";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const toISO = (d: Date) => d.toISOString().slice(0, 10);

type Period = "today" | "week" | "month" | "custom";

const getRange = (period: Period, customFrom: string, customTo: string) => {
  const now = new Date();
  if (period === "today") return { from: toISO(now), to: toISO(now) };
  if (period === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: toISO(from), to: toISO(now) };
  }
  if (period === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toISO(from), to: toISO(now) };
  }
  return { from: customFrom || toISO(now), to: customTo || toISO(now) };
};

const ProfitLossPage = () => {
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num } = useFormat();

  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(toISO(new Date()));
  const [customTo, setCustomTo] = useState(toISO(new Date()));
  const [data, setData] = useState<IProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const range = getRange(period, customFrom, customTo);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      await printElementAsReport(printRef.current, {
        title: `Profit & Loss — ${activeBusiness?.name ?? "Report"}`,
      });
    } catch {
      toast.error(t("common.error"));
    }
  };

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const result = await reportService.getProfitLoss(activeBusiness._id, range.from, range.to);
      setData(result);
    } catch {
      toast.error(t("profitLoss.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);


  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?._id, period, customFrom, customTo]);

  const change = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const rows = data
    ? [
      { key: "totalSales", label: t("profitLoss.totalSales"), current: data.current.totalSales, previous: data.previous.totalSales },
      { key: "cogs", label: t("profitLoss.cogs"), current: data.current.costOfGoodsSold, previous: data.previous.costOfGoodsSold, negative: true },
      { key: "grossProfit", label: t("profitLoss.grossProfit"), current: data.current.grossProfit, previous: data.previous.grossProfit, bold: true },
      { key: "expenses", label: t("profitLoss.businessExpenses"), current: data.current.expenses, previous: data.previous.expenses, negative: true },
      { key: "netProfit", label: t("profitLoss.netProfit"), current: data.current.netProfit, previous: data.previous.netProfit, bold: true, highlight: true },
    ]
    : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {t("profitLoss.title")}
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

        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-light)" }}>
          {([
            { value: "today", labelKey: "profitLoss.today" },
            { value: "week", labelKey: "profitLoss.thisWeek" },
            { value: "month", labelKey: "profitLoss.thisMonth" },
            { value: "custom", labelKey: "profitLoss.custom" },
          ] as const).map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: period === value ? "rgba(16,185,129,0.15)" : "transparent",
                color: period === value ? "#10b981" : "var(--text-faint)",
              }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <input type="date" aria-label={t("profitLoss.from")} title={t("profitLoss.from")} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm" style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-primary)" }} />
            <input type="date" aria-label={t("profitLoss.to")} title={t("profitLoss.to")} value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm" style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-primary)" }} />
          </div>
        )}

        {/* Printable report content. Same component tree as the on-screen
            card, but rendered here inside a white "paper" container so it
            screenshots / prints cleanly. */}
        <div
          ref={printRef}
          className="rounded-2xl p-6"
          style={{ background: "#ffffff", border: "1px solid var(--border)", color: "#111827" }}
        >
          <ReportHeader
            reportTitle={t("profitLoss.title")}
            reportMeta={`${range.from} → ${range.to}`}
          />
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: "#f3f4f6" }} />
              ))}
            </div>
          ) : (
            <div>
              {rows.map(({ key, label, current, previous, bold, negative, highlight }) => {
                const pct = change(current, previous);
                const isUp = pct > 0;
                const Icon = pct === 0 ? Minus : isUp ? TrendingUp : TrendingDown;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3"
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      background: highlight ? "rgba(16,185,129,0.04)" : undefined,
                    }}
                  >
                    <span className={bold ? "text-sm font-semibold" : "text-sm"} style={{ color: "#111827" }}>
                      {label}
                    </span>
                    <div className="text-right">
                      <p
                        className={bold ? "text-base font-bold" : "text-sm font-medium"}
                        style={{
                          color: highlight ? (current >= 0 ? "#10b981" : "#ef4444") : "#111827",
                          fontFamily: bold ? "'DM Serif Display', serif" : undefined,
                        }}
                      >
                        {money(negative && current > 0 ? -current : current)}
                      </p>
                      <p
                        className="text-[10px] flex items-center gap-0.5 justify-end"
                        style={{ color: pct === 0 ? "#9ca3af" : isUp ? "#10b981" : "#ef4444" }}
                      >
                        <Icon size={9} />{" "}
                        {t("profitLoss.vsPrevious", { pct: num(Math.abs(pct), { maximumFractionDigits: 0 }) })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfitLossPage;
