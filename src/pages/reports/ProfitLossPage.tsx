import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { reportService, type IProfitLoss } from "../../services/report.service";
import { useBusinessStore } from "../../store/businessStore";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0 }).format(n);

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
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;

  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(toISO(new Date()));
  const [customTo, setCustomTo] = useState(toISO(new Date()));
  const [data, setData] = useState<IProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);

  const range = getRange(period, customFrom, customTo);

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const result = await reportService.getProfitLoss(activeBusiness._id, range.from, range.to);
      setData(result);
    } catch {
      toast.error("Failed to load Profit & Loss");
    } finally {
      setLoading(false);
    }
  };

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
      { label: "Total Sales", current: data.current.totalSales, previous: data.previous.totalSales },
      { label: "Cost of Goods Sold", current: data.current.costOfGoodsSold, previous: data.previous.costOfGoodsSold, negative: true },
      { label: "Gross Profit", current: data.current.grossProfit, previous: data.previous.grossProfit, bold: true },
      { label: "Business Expenses", current: data.current.expenses, previous: data.previous.expenses, negative: true },
      { label: "Net Profit", current: data.current.netProfit, previous: data.previous.netProfit, bold: true, highlight: true },
    ]
    : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
          Profit &amp; Loss
        </h1>

        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-light)" }}>
          {([
            { value: "today", label: "Today" },
            { value: "week", label: "This Week" },
            { value: "month", label: "This Month" },
            { value: "custom", label: "Custom" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: period === value ? "rgba(16,185,129,0.15)" : "transparent",
                color: period === value ? "#10b981" : "var(--text-faint)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm" style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-primary)" }} />
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm" style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-primary)" }} />
          </div>
        )}

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
              ))}
            </div>
          ) : (
            rows.map(({ label, current, previous, bold, negative, highlight }) => {
              const pct = change(current, previous);
              const isUp = pct > 0;
              const Icon = pct === 0 ? Minus : isUp ? TrendingUp : TrendingDown;
              return (
                <div
                  key={label}
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{
                    borderBottom: "1px solid var(--border-light)",
                    background: highlight ? "rgba(16,185,129,0.04)" : undefined,
                  }}
                >
                  <span className={bold ? "text-sm font-semibold" : "text-sm"} style={{ color: "var(--text-primary)" }}>
                    {label}
                  </span>
                  <div className="text-right">
                    <p
                      className={bold ? "text-base font-bold" : "text-sm font-medium"}
                      style={{
                        color: highlight ? (current >= 0 ? "#10b981" : "#ef4444") : "var(--text-primary)",
                        fontFamily: bold ? "'DM Serif Display', serif" : undefined,
                      }}
                    >
                      {negative && current > 0 ? "-" : ""}{currencySymbol}{fmt(Math.abs(current))}
                    </p>
                    <p
                      className="text-[10px] flex items-center gap-0.5 justify-end"
                      style={{ color: pct === 0 ? "var(--text-faint)" : isUp ? "#10b981" : "#ef4444" }}
                    >
                      <Icon size={9} /> {Math.abs(pct).toFixed(0)}% vs previous period
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfitLossPage;
