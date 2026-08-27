import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Users,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Minus,
  SplitSquareHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import api from "../../services/api";
import SharedCostsModal from "./SharedCostsModal";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { toCurrency } from "../../utils/currency";

/* ── Tokens ─────────────────────────────────────── */
const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  border: "var(--border)",
};

/* ── Types ──────────────────────────────────────── */
interface MessMember {
  memberId: string;
  name: string;
  email: string;
  totalPaid: number;
  totalDeposited: number;
  share: number;
  balance: number;
  expenses: { category: string; amount: number; date: string; note?: string }[];
}

interface Settlement {
  from: string;
  fromId: string;
  to: string;
  toId: string;
  amount: number;
}

interface MessData {
  period: { year: number; month: number };
  memberCount: number;
  totalExpense: number;
  totalIncome: number;
  perPersonShare: number;
  members: MessMember[];
  settlements: Settlement[];
}

/* ── Member Balance Card ────────────────────────── */
const MemberCard = ({ m }: { m: MessMember }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { money } = useFormat();
  const isCredit = m.balance > 0;
  const isEven = Math.abs(m.balance) < 0.01;
  const color = isEven ? "var(--text-muted)" : isCredit ? "#10b981" : "#ef4444";
  const Icon = isEven ? Minus : isCredit ? TrendingUp : TrendingDown;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="row-press w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "var(--surface-1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
        >
          {m.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {m.name}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            {t("mess.paidAndShare", {
              paid: money(m.totalPaid, { decimals: 0 }),
              share: money(m.share, { decimals: 0 }),
            })}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center justify-end gap-1.5 mb-0.5">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: `${color}18`, color }}
            >
              <Icon size={11} />
            </div>
            <p className="text-sm font-bold" style={{ color }}>
              {isEven
                ? t("mess.even")
                : money(m.balance, { decimals: 0, signed: true })}
            </p>
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            {isEven ? t("mess.settledLabel") : isCredit ? t("mess.toReceive") : t("mess.toPay")}
          </p>
        </div>
      </button>

      {open && m.expenses.length > 0 && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mt-3 mb-2"
            style={{ color: "var(--text-faint)" }}
          >
            {t("mess.expenseBreakdown")}
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {m.expenses.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(239,68,68,0.05)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span style={{ color: "var(--text-faint)" }}>
                    {e.date.slice(5)}
                  </span>
                  <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                    {e.category}
                  </span>
                  {e.note && (
                    <span className="truncate" style={{ color: "var(--text-faint)" }}>
                      · {e.note}
                    </span>
                  )}
                </div>
                <span
                  className="font-semibold ml-2 flex-shrink-0"
                  style={{ color: "#ef4444" }}
                >
                  {money(e.amount, { decimals: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && m.expenses.length === 0 && (
        <div
          className="px-4 pb-3 pt-2"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t("mess.noExpenses")}
          </p>
        </div>
      )}
    </div>
  );
};

/* ── Main Page ──────────────────────────────────── */
const MessSummaryPage = () => {
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, monthName } = useFormat(toCurrency(activeBusiness?.currency));

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<MessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSharedCosts, setShowSharedCosts] = useState(false); // ← NEW

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setData(null);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setData(null);
  };

  const load = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const res = await api.get("/mess/summary", {
        params: { businessId: activeBusiness._id, year, month },
      });
      setData(res.data.data);
    } catch {
      toast.error(t("mess.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, year, month, t]);

  useState(() => {
    load();
  });

  if (!activeBusiness || (activeBusiness.type !== "mass" && !activeBusiness.mealEnabled)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.bg }}
      >
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          {t("mess.selectMessBusiness")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-6 lg:py-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
            >
              {t("mess.title")}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
              {activeBusiness.name}
            </p>
          </div>
          <button
            onClick={load}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              color: "var(--text-muted)",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── Shared Monthly Costs button ── NEW */}
        <button
          onClick={() => setShowSharedCosts(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
          style={{
            background: "rgba(139,92,246,0.06)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(139,92,246,0.15)" }}
          >
            <SplitSquareHorizontal size={16} style={{ color: "#8b5cf6" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#8b5cf6" }}>
              {t("mess.sharedCosts")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
              {t("mess.sharedCostsDesc")}
            </p>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}
          >
            {t("mess.adminBadge")}
          </span>
        </button>

        {/* Month picker */}
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-3"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {monthName(month, "long")} {num(year, { useGrouping: false })}
          </p>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2
              size={22}
              className="animate-spin"
              style={{ color: "#8b5cf6" }}
            />
          </div>
        )}

        {!loading && data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  key: "expense",
                  label: t("mess.totalExpense"),
                  value: money(data.totalExpense, { decimals: 0 }),
                  color: "#ef4444",
                  sub: t("mess.memberCountSub", { count: num(data.memberCount) }),
                },
                {
                  key: "perPerson",
                  label: t("mess.perPerson"),
                  value: money(data.perPersonShare, { decimals: 0 }),
                  color: "#8b5cf6",
                  sub: t("mess.equalShare"),
                },
                {
                  key: "members",
                  label: t("mess.membersLabel"),
                  value: num(data.memberCount),
                  color: "#3b82f6",
                  sub: t("mess.activeSub"),
                },
              ].map(({ key, label, value, color, sub }) => (
                <div
                  key={key}
                  className="rounded-2xl p-4"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <p className="text-[11px] mb-2" style={{ color: "var(--text-faint)" }}>
                    {label}
                  </p>
                  <p
                    className="text-lg font-bold leading-none"
                    style={{ fontFamily: "'DM Serif Display', serif", color }}
                  >
                    {value}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(139,92,246,0.05)",
                border: "1px solid rgba(139,92,246,0.15)",
              }}
            >
              <p
                className="text-xs font-semibold mb-3"
                style={{ color: "#8b5cf6" }}
              >
                {t("mess.howCalculated")}
              </p>
              <div className="space-y-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <div className="flex justify-between">
                  <span>{t("mess.totalExpensesThisMonth")}</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {money(data.totalExpense, { decimals: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("mess.dividedBy", { count: num(data.memberCount) })}</span>
                  <span className="font-semibold" style={{ color: "#8b5cf6" }}>
                    {t("mess.perPersonResult", { amount: money(data.perPersonShare, { decimals: 2 }) })}
                  </span>
                </div>
                <div
                  className="mt-2 pt-2"
                  style={{ borderTop: "1px solid var(--border-light)" }}
                >
                  <span style={{ color: "var(--text-faint)" }}>
                    {t("mess.balanceExplainer")}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p
                className="text-xs uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: "var(--text-faint)" }}
              >
                <Users size={12} /> {t("mess.memberBreakdown")}
              </p>
              <div className="space-y-3">
                {data.members.map((m) => (
                  <MemberCard key={m.memberId} m={m} />
                ))}
              </div>
            </div>

            {data.settlements.length > 0 && (
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-3 flex items-center gap-2"
                  style={{ color: "var(--text-faint)" }}
                >
                  <AlertCircle size={12} /> {t("mess.toSettleUp")}
                </p>
                <div className="space-y-2">
                  {data.settlements.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                      style={{
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.15)",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, #ef4444, #dc2626)",
                        }}
                      >
                        {s.from.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <span style={{ color: "#fca5a5" }}>{s.from}</span>
                          <span className="mx-2" style={{ color: "var(--text-faint)" }}>
                            {t("mess.pays")}
                          </span>
                          <span style={{ color: "#86efac" }}>{s.to}</span>
                        </p>
                      </div>
                      <p
                        className="text-sm font-bold flex-shrink-0"
                        style={{ color: "#10b981" }}
                      >
                        {money(s.amount, { decimals: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.settlements.length === 0 && (
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-4"
                style={{
                  background: "rgba(16,185,129,0.05)",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <CheckCircle2
                  size={18}
                  style={{ color: "#10b981", flexShrink: 0 }}
                />
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#10b981" }}
                  >
                    {t("mess.allSettled")}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {t("mess.allSettledDesc")}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && !data && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: C.card, border: `1px dashed ${C.border}` }}
          >
            <Users
              size={22}
              className="mx-auto mb-3"
              style={{ color: "var(--text-faint)" }}
            />
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {t("mess.noData")}
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>
              {t("mess.noDataHint")}
            </p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-semibold"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "#8b5cf6",
              }}
            >
              {t("mess.loadSummary")} <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ── Shared Costs Modal ── NEW */}
      {showSharedCosts && (
        <SharedCostsModal
          businessId={activeBusiness._id}
          onClose={() => setShowSharedCosts(false)}
          onDone={(count) => {
            toast.success(t("mess.entriesCreated", { count: num(count) }));
            load();
          }}
        />
      )}
    </div>
  );
};

export default MessSummaryPage;
