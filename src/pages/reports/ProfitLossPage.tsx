import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Download, Calendar, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { reportService, type IProfitLoss } from "../../services/report.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { useRefreshHandler } from "../../native/refresh";
import ReportHeader from "../../components/shared/ReportHeader";
import { printElementAsReport } from "../../utils/printReport";
import { haptic } from "../../native/bridge";

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
    haptic("light");
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

  const isNetProfit = (data?.current.netProfit ?? 0) >= 0;
  const netProfitPct = data ? change(data.current.netProfit, data.previous.netProfit) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-28 text-slate-900 dark:text-neutral-100">
      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              {t("profitLoss.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {range.from} — {range.to}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-2xl text-xs font-semibold bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-neutral-100 active:scale-95 transition-all shadow-xs shrink-0 select-none"
            title={t("common.download")}
            aria-label={t("common.download")}
          >
            <Download size={14} />
            <span>{t("common.download")}</span>
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-neutral-800/80 border border-slate-200/60 dark:border-neutral-700/60">
          {(
            [
              { value: "today", labelKey: "profitLoss.today" },
              { value: "week", labelKey: "profitLoss.thisWeek" },
              { value: "month", labelKey: "profitLoss.thisMonth" },
              { value: "custom", labelKey: "profitLoss.custom" },
            ] as const
          ).map(({ value, labelKey }) => {
            const active = period === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  haptic("selection");
                  setPeriod(value);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all select-none active:scale-95 ${
                  active
                    ? "bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
                }`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Picker */}
        {period === "custom" && (
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                <Calendar size={12} />
                <span>{t("profitLoss.from")}</span>
              </label>
              <input
                type="date"
                aria-label={t("profitLoss.from")}
                title={t("profitLoss.from")}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs font-mono font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                <Calendar size={12} />
                <span>{t("profitLoss.to")}</span>
              </label>
              <input
                type="date"
                aria-label={t("profitLoss.to")}
                title={t("profitLoss.to")}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs font-mono font-medium bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        )}

        {/* High-Level Net Profit Summary Card */}
        {data && (
          <div
            className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-all ${
              isNetProfit
                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50"
                : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                  {isNetProfit ? t("profitLoss.totalNetProfit") : t("profitLoss.totalNetLoss")}
                </span>
                <p
                  className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                    isNetProfit
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {money(data.current.netProfit)}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isNetProfit
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                }`}
              >
                {isNetProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-neutral-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-neutral-400">
                {t("profitLoss.salesTotalLabel")} <strong className="font-mono text-slate-800 dark:text-neutral-200">{money(data.current.totalSales)}</strong>
              </span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  netProfitPct >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {netProfitPct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {t("profitLoss.vsPrevious", {
                  pct: num(Math.abs(netProfitPct), { maximumFractionDigits: 1 }),
                })}
              </span>
            </div>
          </div>
        )}

        {/* Printable & Screen Report Content */}
        <div
          ref={printRef}
          className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs"
        >
          <ReportHeader
            reportTitle={t("profitLoss.title")}
            reportMeta={`${range.from} → ${range.to}`}
          />

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-xl animate-pulse bg-slate-100 dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-neutral-800/80">
              {rows.map(({ key, label, current, previous, bold, negative, highlight }) => {
                const pct = change(current, previous);
                const isUp = pct > 0;
                const Icon = pct === 0 ? Minus : isUp ? TrendingUp : TrendingDown;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between py-3.5 px-2 rounded-xl transition-colors ${
                      highlight
                        ? isNetProfit
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                          : "bg-rose-50/50 dark:bg-rose-950/20"
                        : ""
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        bold
                          ? "font-bold text-slate-900 dark:text-neutral-100"
                          : "font-medium text-slate-700 dark:text-neutral-300"
                      }`}
                    >
                      {label}
                    </span>

                    <div className="text-right">
                      <p
                        className={`font-mono ${
                          bold ? "text-base font-bold tracking-tight" : "text-sm font-semibold"
                        } ${
                          highlight
                            ? isNetProfit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                            : "text-slate-900 dark:text-neutral-100"
                        }`}
                      >
                        {money(negative && current > 0 ? -current : current)}
                      </p>
                      <p
                        className={`text-[10px] flex items-center gap-0.5 justify-end mt-0.5 font-medium ${
                          pct === 0
                            ? "text-slate-400 dark:text-neutral-500"
                            : isUp
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        <Icon size={10} />{" "}
                        {t("profitLoss.vsPrevious", {
                          pct: num(Math.abs(pct), { maximumFractionDigits: 0 }),
                        })}
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
