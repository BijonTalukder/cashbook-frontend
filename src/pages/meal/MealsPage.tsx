import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Loader2,
  UtensilsCrossed,
  Edit2,
  Trash2,
  X,
  Users,
  Calendar,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import { useBusinessStore } from "../../store/businessStore";
import mealService, { type IMealDay } from "../../services/meal.service";
import { businessService } from "../../services/business.service";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";

/* ── Design tokens ─────────────────────────────── */
const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  border: "var(--border)",
  purple: "#8b5cf6",
};

/* ── Helpers ────────────────────────────────────── */
const isTodayDate = (d: Date) => {
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
};

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

/* ── Meal Add/Edit Modal ────────────────────────── */
interface MealModalProps {
  date: Date;
  day: IMealDay | undefined;
  businessId: string;
  isAdmin: boolean;
  members: { _id: string; firstName: string; lastName: string }[];
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}

const MealModal = ({
  date,
  day,
  businessId,
  isAdmin,
  members,
  currentUserId,
  onClose,
  onSaved,
}: MealModalProps) => {
  const { t } = useTranslation();
  const { num, date: fmtDate } = useFormat();
  const userEntry = day?.members.find((m) => m.member._id === currentUserId);
  const [count, setCount] = useState(userEntry?.count ?? 1);
  const [note, setNote] = useState(userEntry?.note ?? "");
  const [saving, setSaving] = useState(false);

  // Admin: per-member editing
  const [editMemberId, setEditMemberId] = useState(currentUserId);
  const memberEntry = day?.members.find((m) => m.member._id === editMemberId);

  useEffect(() => {
    const e = day?.members.find((m) => m.member._id === editMemberId);
    setCount(e?.count ?? 1);
    setNote(e?.note ?? "");
  }, [editMemberId, day]);

  const handleSave = async () => {
    if (count < 0) {
      toast.error(t("meals.modal.countInvalid"));
      return;
    }
    setSaving(true);
    try {
      if (memberEntry?.mealId) {
        await mealService.updateMeal(memberEntry.mealId, { count, note });
      } else {
        await mealService.addOrUpdateMeal({
          businessId,
          count,
          date: isAdmin ? dateKey(date) : undefined,
          memberId: isAdmin ? editMemberId : undefined,
          note,
        });
      }
      toast.success(t("meals.modal.saved"));
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t("meals.modal.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memberEntry?.mealId) return;
    setSaving(true);
    try {
      await mealService.deleteMeal(memberEntry.mealId);
      toast.success(t("meals.modal.deleted"));
      onSaved();
      onClose();
    } catch {
      toast.error(t("meals.modal.deleteFailed"));
    } finally {
      setSaving(false);
    }
  };

  const dateStr = fmtDate(date, "long");
  const isToday = isTodayDate(date);
  const isPast = !isToday && date < new Date();
  const canEdit = isAdmin || isToday;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)", color: C.purple }}
            >
              <UtensilsCrossed size={15} />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {dateStr}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                {isToday
                  ? t("meals.modal.todayLabel")
                  : isPast
                    ? t("meals.modal.pastLabel")
                    : t("meals.modal.futureLabel")}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-faint)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Admin: member selector */}
          {isAdmin && members.length > 0 && (
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                {t("meals.modal.selectMember")}
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const sel = editMemberId === m._id;
                  const hasEntry = day?.members.some(
                    (dm) => dm.member._id === m._id,
                  );
                  return (
                    <button
                      key={m._id}
                      onClick={() => setEditMemberId(m._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                      style={{
                        background: sel ? "rgba(139,92,246,0.15)" : C.card,
                        border: `1px solid ${sel ? "rgba(139,92,246,0.4)" : C.border}`,
                        color: sel ? C.purple : "var(--text-secondary)",
                      }}
                    >
                      {m.firstName} {m.lastName}
                      {hasEntry && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#10b981" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day's existing entries summary */}
          {day && day.members.length > 0 && (
            <div
              className="mb-4 rounded-xl p-3"
              style={{
                background: "rgba(139,92,246,0.06)",
                border: "1px solid rgba(139,92,246,0.15)",
              }}
            >
              <p className="text-xs mb-2" style={{ color: "#8b5cf6" }}>
                {t("meals.modal.dayTotal", { count: num(day.total) })}
              </p>
              <div className="space-y-1">
                {day.members.map((dm) => (
                  <div
                    key={dm.mealId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      {dm.member.firstName} {dm.member.lastName}
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {t("meals.modal.memberCount", { count: num(dm.count) })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Count selector */}
          {canEdit ? (
            <>
              <div className="mb-4">
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  {t("meals.modal.countQuestion")}
                </p>
                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={() => setCount((p) => Math.max(0, p - 1))}
                    className="w-11 h-11 rounded-xl flex items-center justify-center press"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <div className="text-center">
                    <p
                      className="text-4xl font-bold"
                      style={{
                        fontFamily: "'DM Serif Display', serif",
                        lineHeight: 1,
                        color: "var(--text-primary)",
                      }}
                    >
                      {num(count)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                      {t("meals.modal.countUnit")}
                    </p>
                  </div>
                  <button
                    onClick={() => setCount((p) => Math.min(30, p + 1))}
                    className="w-11 h-11 rounded-xl flex items-center justify-center press"
                    style={{
                      background: "rgba(139,92,246,0.1)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      color: C.purple,
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="mb-5">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("meals.modal.notePlaceholder")}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="flex gap-2">
                {memberEntry?.mealId && isAdmin && (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold press disabled:opacity-60"
                  style={{ background: C.purple, color: "#fff" }}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {memberEntry?.mealId ? t("meals.modal.update") : t("meals.modal.add")}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                {isPast ? t("meals.modal.pastLocked") : t("meals.modal.futureLocked")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Calendar Cell ──────────────────────────────── */
const DayCell = ({
  date,
  day,
  isCurrentMonth,
  isSelected,
  onClick,
}: {
  date: Date;
  day?: IMealDay;
  isCurrentMonth: boolean;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const { t } = useTranslation();
  const { num } = useFormat();
  const today = isTodayDate(date);
  const hasMeal = !!day && day.total > 0;
  const isPast = !today && date < new Date() && isCurrentMonth;

  return (
    <button
      onClick={onClick}
      disabled={!isCurrentMonth}
      className="relative aspect-square w-full rounded-xl flex flex-col items-center justify-center press"
      style={{
        background: isSelected
          ? "rgba(139,92,246,0.15)"
          : hasMeal
            ? "rgba(16,185,129,0.08)"
            : today
              ? "rgba(139,92,246,0.08)"
              : C.card,
        border: `1px solid ${
          isSelected
            ? "rgba(139,92,246,0.5)"
            : hasMeal
              ? "rgba(16,185,129,0.35)"
              : today
                ? "rgba(139,92,246,0.3)"
                : isCurrentMonth
                  ? C.border
                  : "transparent"
        }`,
        boxShadow: today ? "0 0 0 1.5px rgba(139,92,246,0.6)" : "none",
        opacity: isCurrentMonth ? 1 : 0.2,
        cursor: isCurrentMonth ? "pointer" : "default",
      }}
    >
      {/* Date number */}
      <span
        className="text-xs font-semibold leading-none mb-0.5"
        style={{
          color: today
            ? C.purple
            : isCurrentMonth
              ? "var(--text-secondary)"
              : "var(--text-faint)",
          fontWeight: today ? 700 : 500,
        }}
      >
        {num(date.getDate())}
      </span>

      {/* Meal count badge */}
      {hasMeal ? (
        <span className="text-[10px] font-bold leading-none" style={{ color: "#10b981" }}>
          {num(day!.total)}
        </span>
      ) : today ? (
        <span className="text-[9px]" style={{ color: "rgba(139,92,246,0.6)" }}>
          {t("meals.today")}
        </span>
      ) : null}

      {/* Today dot — always marks "today" regardless of meal status */}
      {today && (
        <div
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
          style={{ background: hasMeal ? "#10b981" : C.purple }}
        />
      )}
    </button>
  );
};

/* ── Main Page ──────────────────────────────────── */
const MealsPage = () => {
  const { user } = useAuthStore();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { num, date: fmtDate, monthName, weekdayName } = useFormat();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const [mealData, setMealData] = useState<Record<string, IMealDay>>({});
  const [summary, setSummary] = useState<{
    totalMeals: number;
    daysWithMeals: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [members, setMembers] = useState<
    { _id: string; firstName: string; lastName: string }[]
  >([]);
  const [userRole, setUserRole] = useState<string>("member");

  const isAdmin = ["owner", "admin"].includes(userRole);

  /* ── Fetch meals ──────────────────────────────── */
  const fetchMeals = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const res = await mealService.getMonthMeals(
        activeBusiness._id,
        year,
        month,
      );
      setMealData(res.days);
      setSummary(res.summary as any);
    } catch {
      toast.error(t("meals.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, year, month, t]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  /* ── Fetch members & role ─────────────────────── */
  useEffect(() => {
    if (!activeBusiness || !user) return;
    const load = async () => {
      try {
        const data = await businessService.getMyBusinesses();
        const bm = data.find((m: any) => m.business._id === activeBusiness._id);
        setUserRole(bm?.role ?? "member");
        if (["owner", "admin"].includes(bm?.role ?? "")) {
          const mems = await businessService.getMembers(activeBusiness._id);
          setMembers(
            mems.map((m: any) => ({
              _id: m.user._id,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
            })),
          );
        }
      } catch {
        /* ignore */
      }
    };
    load();
  }, [activeBusiness, user]);

  /* ── Build calendar grid ─────────────────────── */
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    cells.push({ date: d, isCurrentMonth: d.getMonth() === month });
  }

  /* ── Navigation ──────────────────────────────── */
  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  /* ── Total for selected date ─────────────────── */
  const selKey = selectedDate ? dateKey(selectedDate) : null;
  const selDay = selKey ? mealData[selKey] : undefined;

  if (!activeBusiness) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.bg }}
      >
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          {t("meals.selectBusiness")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
        {/* ── Header ────────────────────────────── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("meals.title")}
            </h1>
            {isAdmin && (
              <p className="text-xs mt-0.5 text-slate-500 dark:text-neutral-400">
                <span className="text-purple-600 dark:text-purple-400 font-semibold inline-flex items-center gap-1">
                  <ShieldCheck size={12} />
                  {t("meals.adminBadge")}
                </span>
              </p>
            )}
          </div>

          {/* Today's quick add */}
          {!isAdmin && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold press"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: C.purple,
              }}
            >
              <Plus size={13} /> {t("meals.todaysMeal")}
            </button>
          )}
        </div>

        {/* ── Stats Row ──────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              key: "total",
              label: t("meals.monthTotal"),
              value: num(summary?.totalMeals ?? 0),
              sub: t("meals.mealsUnit"),
              icon: UtensilsCrossed,
              color: "#8b5cf6",
            },
            {
              key: "days",
              label: t("meals.daysCount"),
              value: num(summary?.daysWithMeals ?? 0),
              sub: t("meals.daysWithEntry"),
              icon: Calendar,
              color: "#10b981",
            },
            {
              key: "avg",
              label: t("meals.avgPerDay"),
              value: num(
                summary?.daysWithMeals
                  ? Math.round(
                      (summary.totalMeals / summary.daysWithMeals) * 10,
                    ) / 10
                  : 0,
                { maximumFractionDigits: 1 },
              ),
              sub: t("meals.avgMeals"),
              icon: TrendingUp,
              color: "#f59e0b",
            },
          ].map(({ key, label, value, sub, icon: Icon, color }) => (
            <div
              key={key}
              className="rounded-2xl p-3.5"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {label}
                </span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}15`, color }}
                >
                  <Icon size={12} />
                </div>
              </div>
              <p
                className="text-xl font-bold leading-none"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  color: "var(--text-primary)",
                }}
              >
                {loading ? "—" : value}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Calendar ──────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          {/* Month navigation */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.border}` }}
          >
            <button
              onClick={prevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center">
              <p
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {monthName(month, "long")} {num(year, { useGrouping: false })}
              </p>
              {!isCurrentMonth && (
                <button
                  onClick={goToday}
                  className="text-[10px] mt-0.5"
                  style={{ color: C.purple }}
                >
                  {t("meals.backToThisMonth")}
                </button>
              )}
            </div>

            <button
              onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 px-3 pt-3">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] pb-1 font-medium"
                style={{ color: "var(--text-faint)" }}
              >
                {weekdayName(d)}
              </div>
            ))}
          </div>

          {/* Cells */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2
                size={20}
                className="animate-spin"
                style={{ color: C.purple }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 p-3">
              {cells.map(({ date, isCurrentMonth: isCM }, i) => (
                <DayCell
                  key={i}
                  date={date}
                  day={mealData[dateKey(date)]}
                  isCurrentMonth={isCM}
                  isSelected={
                    !!selectedDate && dateKey(date) === dateKey(selectedDate)
                  }
                  onClick={() => {
                    if (!isCM) return;
                    setSelectedDate(date);
                  }}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div
            className="flex items-center gap-4 px-5 py-3"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            {[
              { key: "hasMeal", color: "#10b981", label: t("meals.legendHasMeal") },
              { key: "today", color: C.purple, label: t("meals.legendToday") },
            ].map(({ key, color, label }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  {label}
                </span>
              </div>
            ))}
            <div className="flex-1" />
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              {t("meals.clickHint")}
            </span>
          </div>
        </div>

        {/* ── Selected Day Detail (below calendar) ── */}
        {selectedDate && selDay && selDay.members.length > 0 && (
          <div
            className="mt-4 rounded-2xl p-5"
            style={{
              background: "rgba(139,92,246,0.05)",
              border: "1px solid rgba(139,92,246,0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: C.purple }}>
                {t("meals.dayTotal", {
                  date: fmtDate(selectedDate, "short"),
                  count: num(selDay.total),
                })}
              </p>
              {isAdmin && (
                <button
                  onClick={() => {
                    /* already handled by modal */
                  }}
                  className="text-[11px]"
                  style={{ color: "var(--text-faint)" }}
                >
                  <Edit2 size={12} className="inline mr-1" />
                  {t("meals.edit")}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {selDay.members.map((dm) => (
                <div
                  key={dm.mealId}
                  className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ background: "var(--surface-1)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                      style={{
                        background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                      }}
                    >
                      {dm.member.firstName[0]}
                    </div>
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {dm.member.firstName} {dm.member.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dm.note && (
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {dm.note}
                      </span>
                    )}
                    <span
                      className="text-sm font-bold"
                      style={{ color: C.purple }}
                    >
                      {t("meals.modal.memberCount", { count: num(dm.count) })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Instruction for non-admin ─────────── */}
        {!isAdmin && (
          <div
            className="mt-4 rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: "var(--surface-1)",
              border: `1px solid ${C.border}`,
            }}
          >
            <Users
              size={15}
              style={{ color: "var(--text-faint)", flexShrink: 0, marginTop: 1 }}
            />
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-faint)" }}
            >
              {t("meals.nonAdminHintPrefix")}{" "}
              <strong style={{ color: "var(--text-secondary)" }}>
                {t("meals.nonAdminHintBold")}
              </strong>{" "}
              {t("meals.nonAdminHintSuffix")}
            </p>
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────── */}
      {selectedDate && (
        <MealModal
          date={selectedDate}
          day={selDay}
          businessId={activeBusiness._id}
          isAdmin={isAdmin}
          members={members}
          currentUserId={user?._id ?? ""}
          onClose={() => setSelectedDate(null)}
          onSaved={fetchMeals}
        />
      )}
    </div>
  );
};

export default MealsPage;
