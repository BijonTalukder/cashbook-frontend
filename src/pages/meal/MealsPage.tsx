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

/* ── Design tokens ─────────────────────────────── */
const C = {
  bg: "#0a0f1e",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  purple: "#8b5cf6",
};

/* ── Helpers ────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString("bn-BD");

const MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const DAYS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];

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
      toast.error("Count must be 0 or more");
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
      toast.success("Meal saved");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memberEntry?.mealId) return;
    setSaving(true);
    try {
      await mealService.deleteMeal(memberEntry.mealId);
      toast.success("Meal deleted");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const dateStr = date.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isToday = isTodayDate(date);
  const isPast = !isToday && date < new Date();
  const canEdit = isAdmin || isToday;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#0f1629", border: `1px solid ${C.border}` }}
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
              <p className="text-sm font-semibold text-white">{dateStr}</p>
              <p className="text-[11px]" style={{ color: "#475569" }}>
                {isToday ? "আজকের খাবার" : isPast ? "আগের দিন" : "ভবিষ্যৎ"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "#475569" }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Admin: member selector */}
          {isAdmin && members.length > 0 && (
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Member select করুন
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
                        color: sel ? C.purple : "#94a3b8",
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
                এই দিনের মোট: {fmt(day.total)} টি
              </p>
              <div className="space-y-1">
                {day.members.map((dm) => (
                  <div
                    key={dm.mealId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span style={{ color: "#94a3b8" }}>
                      {dm.member.firstName} {dm.member.lastName}
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "#e2e8f0" }}
                    >
                      {fmt(dm.count)} টি
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
                <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                  কতটি খাবার?
                </p>
                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={() => setCount((p) => Math.max(0, p - 1))}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      color: "#94a3b8",
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <div className="text-center">
                    <p
                      className="text-4xl font-bold text-white"
                      style={{
                        fontFamily: "'DM Serif Display', serif",
                        lineHeight: 1,
                      }}
                    >
                      {count}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#475569" }}>
                      টি খাবার
                    </p>
                  </div>
                  <button
                    onClick={() => setCount((p) => Math.min(30, p + 1))}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
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
                  placeholder="নোট (ঐচ্ছিক)"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    color: "#e2e8f0",
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
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: C.purple, color: "#fff" }}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {memberEntry?.mealId ? "আপডেট করুন" : "যোগ করুন"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: "#475569" }}>
                {isPast
                  ? "এই দিনের খাবার শুধু Admin এডিট করতে পারবেন।"
                  : "এই দিনের খাবার এখনো যোগ করা যাবে না।"}
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
  const today = isTodayDate(date);
  const hasMeal = !!day && day.total > 0;
  const isPast = !today && date < new Date() && isCurrentMonth;

  return (
    <button
      onClick={onClick}
      disabled={!isCurrentMonth}
      className="relative aspect-square w-full rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
      style={{
        background: isSelected
          ? "rgba(139,92,246,0.15)"
          : today
            ? "rgba(139,92,246,0.08)"
            : hasMeal
              ? "rgba(16,185,129,0.05)"
              : C.card,
        border: `1px solid ${
          isSelected
            ? "rgba(139,92,246,0.5)"
            : today
              ? "rgba(139,92,246,0.3)"
              : hasMeal
                ? "rgba(16,185,129,0.2)"
                : isCurrentMonth
                  ? C.border
                  : "transparent"
        }`,
        opacity: isCurrentMonth ? 1 : 0.2,
        cursor: isCurrentMonth ? "pointer" : "default",
      }}
    >
      {/* Date number */}
      <span
        className="text-xs font-semibold leading-none mb-0.5"
        style={{
          color: today ? C.purple : isCurrentMonth ? "#cbd5e1" : "#334155",
          fontWeight: today ? 700 : 500,
        }}
      >
        {date.getDate()}
      </span>

      {/* Meal count badge */}
      {hasMeal ? (
        <span
          className="text-[10px] font-bold leading-none"
          style={{ color: today ? C.purple : "#10b981" }}
        >
          {fmt(day!.total)}
        </span>
      ) : today ? (
        <span className="text-[9px]" style={{ color: "rgba(139,92,246,0.6)" }}>
          আজ
        </span>
      ) : null}

      {/* Today dot */}
      {today && (
        <div
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
          style={{ background: C.purple }}
        />
      )}
    </button>
  );
};

/* ── Main Page ──────────────────────────────────── */
const MealsPage = () => {
  const { user } = useAuthStore();
  const { activeBusiness } = useBusinessStore();

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
      toast.error("Meals লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, year, month]);

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
        <p className="text-sm" style={{ color: "#475569" }}>
          কোনো business সিলেক্ট করুন
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
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              খাবার ট্র্যাকার
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
              {activeBusiness.name} ·{" "}
              {isAdmin && (
                <span style={{ color: "#8b5cf6" }}>
                  <ShieldCheck size={10} className="inline mr-0.5" />
                  Admin
                </span>
              )}
            </p>
          </div>

          {/* Today's quick add */}
          {!isAdmin && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: C.purple,
              }}
            >
              <Plus size={13} /> আজকের খাবার
            </button>
          )}
        </div>

        {/* ── Stats Row ──────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: "এই মাসে মোট",
              value: fmt(summary?.totalMeals ?? 0),
              sub: "টি খাবার",
              icon: UtensilsCrossed,
              color: "#8b5cf6",
            },
            {
              label: "কত দিন",
              value: fmt(summary?.daysWithMeals ?? 0),
              sub: "দিন এন্ট্রি",
              icon: Calendar,
              color: "#10b981",
            },
            {
              label: "গড় / দিন",
              value: fmt(
                summary?.daysWithMeals
                  ? Math.round(
                      (summary.totalMeals / summary.daysWithMeals) * 10,
                    ) / 10
                  : 0,
              ),
              sub: "গড় খাবার",
              icon: TrendingUp,
              color: "#f59e0b",
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3.5"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px]" style={{ color: "#475569" }}>
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
                className="text-xl font-bold text-white leading-none"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {loading ? "—" : value}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#334155" }}>
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
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ color: "#64748b" }}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center">
              <p className="text-base font-semibold text-white">
                {MONTHS[month]} {year}
              </p>
              {!isCurrentMonth && (
                <button
                  onClick={goToday}
                  className="text-[10px] mt-0.5"
                  style={{ color: C.purple }}
                >
                  এই মাসে ফিরে যান
                </button>
              )}
            </div>

            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={{ color: "#64748b" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 px-3 pt-3">
            {DAYS_BN.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] pb-1 font-medium"
                style={{ color: "#334155" }}
              >
                {d}
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
              { color: "#10b981", label: "খাবার যোগ আছে" },
              { color: C.purple, label: "আজকের দিন" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-[10px]" style={{ color: "#475569" }}>
                  {label}
                </span>
              </div>
            ))}
            <div className="flex-1" />
            <span className="text-[10px]" style={{ color: "#334155" }}>
              ক্লিক করুন দেখতে বা এডিট করতে
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
                {selectedDate.toLocaleDateString("bn-BD", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                — মোট {fmt(selDay.total)} টি
              </p>
              {isAdmin && (
                <button
                  onClick={() => {
                    /* already handled by modal */
                  }}
                  className="text-[11px]"
                  style={{ color: "#475569" }}
                >
                  <Edit2 size={12} className="inline mr-1" />
                  এডিট
                </button>
              )}
            </div>
            <div className="space-y-2">
              {selDay.members.map((dm) => (
                <div
                  key={dm.mealId}
                  className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.03)" }}
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
                    <span className="text-sm text-white">
                      {dm.member.firstName} {dm.member.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dm.note && (
                      <span
                        className="text-[10px]"
                        style={{ color: "#475569" }}
                      >
                        {dm.note}
                      </span>
                    )}
                    <span
                      className="text-sm font-bold"
                      style={{ color: C.purple }}
                    >
                      {fmt(dm.count)} টি
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
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${C.border}`,
            }}
          >
            <Users
              size={15}
              style={{ color: "#475569", flexShrink: 0, marginTop: 1 }}
            />
            <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>
              আপনি শুধু <strong style={{ color: "#94a3b8" }}>আজকের</strong>{" "}
              খাবার যোগ বা এডিট করতে পারবেন। আগের বা পরের দিনের এন্ট্রি শুধু
              Admin করতে পারবেন।
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
