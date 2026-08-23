import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Home,
  User,
  Store,
  Crown,
  ShieldCheck,
  Users,
  Eye,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  UtensilsCrossed,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Clock,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { useBusinessStore } from "../../store/businessStore";
import {
  businessService,
  type IBusinessMembership,
  type IBusiness,
  type BusinessType,
  type MemberRole,
} from "../../services/business.service";
import {
  transactionService,
  type ITransaction,
} from "../../services/transaction.service";
import mealService from "../../services/meal.service";
import BusinessDashboardContent from "./BusinessDashboardContent";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";

/* ─── Design tokens ───────────────────────────────────── */
const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  cardHover: "var(--surface-3)",
  border: "var(--border)",
  borderLight: "var(--border-light)",
};

/* ─── Meta maps ───────────────────────────────────────── */
const TYPE_META: Record<
  BusinessType,
  { icon: any; accent: string; bg: string; border: string; labelKey: string }
> = {
  personal: {
    icon: User,
    accent: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    labelKey: "businessType.personal",
  },
  company: {
    icon: Building2,
    accent: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    labelKey: "businessType.company",
  },
  mass: {
    icon: Home,
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    labelKey: "businessType.mass",
  },
  business: {
    icon: Store,
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    labelKey: "businessType.business",
  },
};

const ROLE_META: Record<
  MemberRole,
  { icon: any; labelKey: string; color: string }
> = {
  owner: { icon: Crown, labelKey: "role.owner", color: "#f59e0b" },
  admin: { icon: ShieldCheck, labelKey: "role.admin", color: "#3b82f6" },
  member: { icon: Users, labelKey: "role.member", color: "#10b981" },
  viewer: { icon: Eye, labelKey: "role.viewer", color: "#64748b" },
};

/* ─── Meal Dashboard Widget ───────────────────────────── */
const MealDashboardWidget = ({ businessId }: { businessId: string }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { num, monthName } = useFormat();
  const [data, setData] = useState<{ total: number; days: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    mealService.getSummary(businessId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => {/* silent */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [businessId]);

  const currentMonth = monthName(new Date().getMonth(), "long");
  const avg = data?.days ? Math.round((data.total / data.days) * 10) / 10 : 0;

  return (
    <button
      onClick={() => navigate("/meals")}
      className="w-full text-left rounded-2xl p-5 transition-all active:scale-[0.98] group relative overflow-hidden"
      style={{
        background: "rgba(139,92,246,0.06)",
        border: "1px solid rgba(139,92,246,0.2)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.06)";
      }}
    >
      {/* top shimmer line */}
      <div
        className="absolute top-0 left-8 right-8 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}
          >
            <UtensilsCrossed size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("mealWidget.title")}</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              {t("mealWidget.monthLabel", { month: currentMonth })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}
          >
            {t("mealWidget.tag")}
          </span>
          <ChevronRight
            size={14}
            style={{ color: "#8b5cf6" }}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <Loader2 size={14} className="animate-spin" style={{ color: "#8b5cf6" }} />
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>{t("common.loading")}</span>
        </div>
      ) : (
        <div className="flex items-end gap-6">
          {/* Total meals */}
          <div>
            <p
              className="text-3xl font-bold leading-none"
              style={{ color: "#8b5cf6", fontFamily: "'DM Serif Display', serif" }}
            >
              {num(data?.total ?? 0)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              {t("mealWidget.totalMeals")}
            </p>
          </div>

          {/* Days */}
          <div className="mb-0.5">
            <p className="text-xl font-bold leading-none"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
              {num(data?.days ?? 0)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{t("mealWidget.days")}</p>
          </div>

          {/* Avg */}
          <div className="mb-0.5">
            <p className="text-xl font-bold leading-none"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
              {num(avg, { maximumFractionDigits: 1 })}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{t("mealWidget.avgPerDay")}</p>
          </div>

          {/* CTA */}
          <div className="flex-1 flex justify-end mb-0.5">
            <div
              className="text-xs px-2.5 py-1.5 rounded-xl font-medium transition-all group-hover:scale-105"
              style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
            >
              {t("mealWidget.details")}
            </div>
          </div>
        </div>
      )}
    </button>
  );
};

/* ─── Business Card ───────────────────────────────────── */
const BusinessCard = ({
  membership,
  isActive,
  onSelect,
}: {
  membership: IBusinessMembership;
  isActive: boolean;
  onSelect: (b: IBusiness) => void;
}) => {
  const { business, role } = membership;
  const { t } = useTranslation();
  const type = TYPE_META[business.type];
  const roleInfo = ROLE_META[role];
  const RoleIcon = roleInfo.icon;
  const TypeIcon = type.icon;

  return (
    <button
      onClick={() => onSelect(business)}
      className="w-full text-left rounded-2xl p-5 transition-all duration-200 group relative overflow-hidden active:scale-[0.98]"
      style={{
        background: isActive ? type.bg : C.card,
        border: `1px solid ${isActive ? type.border : C.border}`,
      }}
    >
      {isActive && (
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${type.accent}80, transparent)`,
          }}
        />
      )}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${type.accent}18`, color: type.accent }}
        >
          <TypeIcon size={17} />
        </div>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: `${type.accent}18`, color: type.accent }}
            >
              {t("dashboard.active")}
            </span>
          )}
          <div
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: `${roleInfo.color}12`,
              border: `1px solid ${roleInfo.color}28`,
              color: roleInfo.color,
            }}
          >
            <RoleIcon size={9} />
            {t(roleInfo.labelKey)}
          </div>
        </div>
      </div>
      <p className="font-semibold text-[15px] mb-0.5 truncate" style={{ color: "var(--text-primary)" }}>
        {business.name}
      </p>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        {t(type.labelKey)}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {business.mealEnabled && (
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: "#8b5cf6" }}
            >
              <UtensilsCrossed size={10} /> {t("dashboard.meals")}
            </div>
          )}
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            {business.currency}
          </span>
        </div>
        <ChevronRight
          size={13}
          style={{ color: "var(--text-faint)" }}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </button>
  );
};

/* ─── Custom Tooltip ──────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, t, money }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {t("dashboard.tooltipRow", { name: p.name, amount: money(p.value) })}
        </p>
      ))}
    </div>
  );
};

/* ─── Skeleton ────────────────────────────────────────── */
const Skeleton = ({ h = "h-40" }: { h?: string }) => (
  <div
    className={`${h} rounded-2xl animate-pulse`}
    style={{ background: C.card, border: `1px solid ${C.border}` }}
  />
);

/* ─── Dashboard ───────────────────────────────────────── */
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, compact, date: fmtDate, monthName } = useFormat();

  const [memberships, setMemberships] = useState<IBusinessMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [monthSummary, setMonthSummary] = useState<{
    income: number;
    expense: number;
    balance: number;
  } | null>(null);
  const [chartData, setChartData] = useState<
    { month: string; income: number; expense: number }[]
  >([]);
  const [recentTxns, setRecentTxns] = useState<ITransaction[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [chartMode, setChartMode] = useState<"area" | "bar">("area");

  const isMass = activeBusiness?.type === "mass" || activeBusiness?.mealEnabled;

  /* ── Fetch businesses ───────────────────────────────── */
  const fetchBusinesses = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const data = await businessService.getMyBusinesses();
      setMemberships(data);
      if (!activeBusiness && data.length > 0) {
        const def =
          data.find((m) => m.business._id === user?.defaultBusiness) ?? data[0];
        setActiveBusiness(def.business);
      }
    } catch {
      toast.error(t("dashboard.loadBusinessesFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ── Fetch active business data ─────────────────────── */
  const fetchBusinessData = useCallback(async () => {
    if (!activeBusiness || activeBusiness.type === "business") return;
    setDataLoading(true);
    try {
      const year = new Date().getFullYear();
      const [summaryRes, recentRes] = await Promise.all([
        transactionService.getMonthlySummary(activeBusiness._id, year),
        transactionService.getAll(activeBusiness._id, { page: "1", limit: "5" }),
      ]);

      const chart = summaryRes.months.map(
        (m: { month: number; income: number; expense: number }) => ({
          month: monthName(m.month - 1),
          income: m.income,
          expense: m.expense,
        }),
      );
      setChartData(chart);

      const thisMonth = new Date().getMonth() + 1;
      const thisMonthData = summaryRes.months.find(
        (m: { month: number }) => m.month === thisMonth,
      );
      setMonthSummary({
        income: thisMonthData?.income ?? 0,
        expense: thisMonthData?.expense ?? 0,
        balance: (thisMonthData?.income ?? 0) - (thisMonthData?.expense ?? 0),
      });

      setRecentTxns(recentRes.transactions.slice(0, 5));
    } catch {
      toast.error(t("dashboard.loadDataFailed"));
    } finally {
      setDataLoading(false);
    }
  }, [activeBusiness, monthName, t]);

  useEffect(() => { fetchBusinesses(); }, []);
  useEffect(() => { fetchBusinessData(); }, [fetchBusinessData]);

  const handleSelect = (b: IBusiness) => {
    setActiveBusiness(b);
    toast.success(t("business.switched", { name: b.name }));
  };

  const owned = memberships.filter((m) => m.role === "owner");
  const joined = memberships.filter((m) => m.role !== "owner");

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12
      ? t("dashboard.goodMorning")
      : h < 17
        ? t("dashboard.goodAfternoon")
        : t("dashboard.goodEvening");
  })();

  const TXN_TYPE_META = {
    income: { color: "#10b981", sign: "+", icon: TrendingUp },
    expense: { color: "#ef4444", sign: "-", icon: TrendingDown },
    transfer: { color: "#3b82f6", sign: "", icon: ArrowLeftRight },
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-5">

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm mb-0.5" style={{ color: "var(--text-faint)" }}>
              {greeting}
            </p>
            <h1
              className="text-2xl lg:text-3xl font-bold"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
            >
              {user?.firstName} {user?.lastName}
            </h1>
          </div>
          <button
            onClick={() => { fetchBusinesses(true); fetchBusinessData(); }}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-muted)" }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {activeBusiness?.type === "business" ? (
          <BusinessDashboardContent business={activeBusiness} />
        ) : (
          <>
        {/* ── Summary stat cards ───────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              key: "businesses",
              label: t("dashboard.businesses"),
              value: num(memberships.length),
              icon: Building2,
              color: "#10b981",
              sub: t("dashboard.ownedCount", { count: num(owned.length) }),
            },
            {
              key: "members",
              label: t("nav.members"),
              value: num(joined.length),
              icon: Users,
              color: "#3b82f6",
              sub: t("dashboard.membersJoined"),
            },
            {
              key: "income",
              label: t("txn.income"),
              value: money(monthSummary?.income ?? 0),
              icon: ArrowUpRight,
              color: "#10b981",
              sub: t("dashboard.thisMonth"),
            },
            {
              key: "expense",
              label: t("txn.expense"),
              value: money(monthSummary?.expense ?? 0),
              icon: ArrowDownRight,
              color: "#ef4444",
              sub: t("dashboard.thisMonth"),
            },
          ].map(({ key, label, value, icon: Icon, color, sub }) => (
            <div
              key={key}
              className="rounded-2xl p-4"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>{label}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}15`, color }}
                >
                  <Icon size={13} />
                </div>
              </div>
              {dataLoading && (key === "income" || key === "expense") ? (
                <div
                  className="h-6 w-16 rounded animate-pulse"
                  style={{ background: "var(--surface-4)" }}
                />
              ) : (
                <p
                  className="text-xl font-bold leading-none truncate"
                  style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
                >
                  {value}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Meal Widget (mass type only) ─────────────── */}
        {isMass && activeBusiness && (
          <MealDashboardWidget businessId={activeBusiness._id} />
        )}

        {/* ── Monthly chart ────────────────────────────── */}
        {activeBusiness && (
          <div
            className="rounded-2xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="text-base font-bold"
                  style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
                >
                  {t("dashboard.yearOverview", { year: num(new Date().getFullYear(), { useGrouping: false }) })}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                  {t("dashboard.chartSubtitle", { business: activeBusiness.name })}
                </p>
              </div>
              <div
                className="flex items-center gap-1 p-1 rounded-xl"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-light)",
                }}
              >
                {(["area", "bar"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: chartMode === mode ? "rgba(16,185,129,0.15)" : "transparent",
                      color: chartMode === mode ? "#10b981" : "var(--text-faint)",
                    }}
                  >
                    {mode === "area" ? t("dashboard.chartArea") : t("dashboard.chartBar")}
                  </button>
                ))}
              </div>
            </div>

            {dataLoading ? (
              <div className="h-52 flex items-center justify-center">
                <RefreshCw size={18} className="animate-spin" style={{ color: "var(--text-faint)" }} />
              </div>
            ) : chartData.every((d) => d.income === 0 && d.expense === 0) ? (
              <div className="h-52 flex flex-col items-center justify-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--surface-2)" }}
                >
                  <TrendingUp size={18} style={{ color: "var(--text-faint)" }} />
                </div>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("dashboard.noChartData")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                {chartMode === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => compact(v)} />
                    <Tooltip content={<CustomTooltip t={t} money={money} />} />
                    <Area type="monotone" dataKey="income" name={t("txn.income")} stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4, fill: "#10b981" }} />
                    <Area type="monotone" dataKey="expense" name={t("txn.expense")} stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => compact(v)} />
                    <Tooltip content={<CustomTooltip t={t} money={money} />} />
                    <Bar dataKey="income" name={t("txn.income")} fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.85} maxBarSize={20} />
                    <Bar dataKey="expense" name={t("txn.expense")} fill="#ef4444" radius={[4, 4, 0, 0]} fillOpacity={0.85} maxBarSize={20} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}

            <div className="flex items-center gap-5 mt-3 justify-center">
              {[
                { key: "income", color: "#10b981", label: t("txn.income") },
                { key: "expense", color: "#ef4444", label: t("txn.expense") },
              ].map(({ key, color, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Two column: Recent txns + Quick actions ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Recent Transactions — 3/5 */}
          {activeBusiness && (
            <div
              className="lg:col-span-3 rounded-2xl overflow-hidden"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <div className="flex items-center gap-2">
                  <Clock size={13} style={{ color: "var(--text-faint)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
                    {t("dashboard.recentTransactions")}
                  </span>
                </div>
                <button
                  onClick={() => navigate("/transactions")}
                  className="text-xs flex items-center gap-1 transition-all"
                  style={{ color: "#10b981" }}
                >
                  {t("common.viewAll")} <ArrowRight size={11} />
                </button>
              </div>

              {dataLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl animate-pulse"
                      style={{ background: "var(--surface-1)" }} />
                  ))}
                </div>
              ) : recentTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <ArrowLeftRight size={16} style={{ color: "var(--text-faint)" }} />
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("dashboard.noTransactions")}</p>
                </div>
              ) : (
                recentTxns.map((txn) => {
                  const meta = TXN_TYPE_META[txn.type];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={txn._id}
                      className="flex items-center gap-3 px-5 py-3 transition-all"
                      style={{ borderBottom: "1px solid var(--border-light)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${meta.color}15`, color: meta.color }}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {txn.category?.name ?? t("product.uncategorized")}
                          {txn.category?.icon && (
                            <span className="ml-1">{txn.category.icon}</span>
                          )}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {fmtDate(txn.date, "short")} · {txn.member?.firstName}
                        </p>
                      </div>
                      <p className="text-sm font-semibold flex-shrink-0" style={{ color: meta.color }}>
                        {money(txn.type === "expense" ? -txn.amount : txn.amount, { signed: txn.type === "income" })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Right column: balance card + quick actions — 2/5 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Balance card */}
            {activeBusiness && monthSummary && (
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.6), transparent)" }}
                />
                <p className="text-xs mb-1" style={{ color: "rgba(16,185,129,0.7)" }}>
                  {t("dashboard.monthBalance")}
                </p>
                <p
                  className="text-3xl font-bold mb-3"
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    color: monthSummary.balance >= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  {money(monthSummary.balance)}
                </p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("dashboard.in")}</p>
                    <p className="text-xs font-semibold" style={{ color: "#10b981" }}>
                      {money(monthSummary.income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("dashboard.out")}</p>
                    <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                      {money(monthSummary.expense)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            {activeBusiness && (
              <div
                className="rounded-2xl p-4"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>
                  {t("dashboard.quickActions")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: t("txn.income"), icon: TrendingUp, color: "#10b981", to: "/transactions?type=income" },
                    { label: t("txn.expense"), icon: TrendingDown, color: "#ef4444", to: "/transactions?type=expense" },
                    { label: t("nav.members"), icon: Users, color: "#3b82f6", to: "/members" },
                    ...(isMass
                      ? [{ label: t("nav.meals"), icon: UtensilsCrossed, color: "#8b5cf6", to: "/meals" }]
                      : [{ label: t("nav.transactions"), icon: Wallet, color: "#f59e0b", to: "/transactions" }]
                    ),
                  ].map(({ label, icon: Icon, color, to }) => (
                    <button
                      key={to}
                      onClick={() => navigate(to)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl active:scale-95 transition-all group"
                      style={{ border: `1px solid ${C.borderLight}` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ background: `${color}14`, color }}
                      >
                        <Icon size={15} />
                      </div>
                      <span className="text-xs text-center leading-snug" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {/* ── Business List ─────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-bold"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
            >
              {t("dashboard.myBusinesses")}
            </h2>
            <button
              onClick={() => navigate("/business/new")}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl active:scale-95 transition-all"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#10b981",
              }}
            >
              <Plus size={12} /> {t("dashboard.newShort")}
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : memberships.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: C.card, border: `1px dashed ${C.border}` }}
            >
              <Building2 size={20} className="mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{t("dashboard.noBusinesses")}</p>
              <p className="text-xs mb-5" style={{ color: "var(--text-faint)" }}>{t("dashboard.noBusinessesHint")}</p>
              <button
                onClick={() => navigate("/onboarding")}
                className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold active:scale-95 transition-all"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                {t("dashboard.setUpBusiness")} <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {owned.length > 0 && (
                <div>
                  <p
                    className="flex items-center gap-1.5 text-xs uppercase tracking-wider mb-3"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <Crown size={10} style={{ color: "#d97706" }} /> {t("dashboard.ownedByMe")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {owned.map((m) => (
                      <BusinessCard
                        key={m._id}
                        membership={m}
                        isActive={activeBusiness?._id === m.business._id}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
              {joined.length > 0 && (
                <div>
                  <p
                    className="flex items-center gap-1.5 text-xs uppercase tracking-wider mb-3"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <Users size={10} style={{ color: "#60a5fa" }} /> {t("dashboard.joinedViaInvite")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {joined.map((m) => (
                      <BusinessCard
                        key={m._id}
                        membership={m}
                        isActive={activeBusiness?._id === m.business._id}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;