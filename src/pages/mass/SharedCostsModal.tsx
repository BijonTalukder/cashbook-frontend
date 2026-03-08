// components/mess/SharedCostsModal.tsx
import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Home,
  Zap,
  Droplets,
  Wifi,
  Package,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { transactionService } from "../../services/transaction.service";
import { businessService } from "../../services/business.service";

/* ── Types ────────────────────────────────────────── */
interface Member {
  _id: string;
  firstName: string;
  lastName: string;
}

interface CostItem {
  id: string;
  label: string;
  categoryId: string;
  amount: number;
  icon: string;
}

interface Category {
  _id: string;
  name: string;
  type: string;
}

/* ── Preset icons ─────────────────────────────────── */
const ICONS = ["🏠", "⚡", "💧", "🌐", "🍽️", "📦", "🔧", "🧹", "🚿", "🔒"];

const PRESET_COSTS = [
  { label: "বাসা ভাড়া", icon: "🏠" },
  { label: "বিদ্যুৎ বিল", icon: "⚡" },
  { label: "পানির বিল", icon: "💧" },
  { label: "ইন্টারনেট", icon: "🌐" },
  { label: "গ্যাস বিল", icon: "🔧" },
  { label: "অন্যান্য", icon: "📦" },
];

/* ── Helpers ──────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number) =>
  "৳" + n.toLocaleString("en-BD", { maximumFractionDigits: 0 });

/* ════════════════════════════════════════════════════
   SharedCostsModal
════════════════════════════════════════════════════ */
interface Props {
  businessId: string;
  onClose: () => void;
  onDone: (count: number) => void;
}

const SharedCostsModal = ({ businessId, onClose, onDone }: Props) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState<"setup" | "confirm" | "done">("setup");
  const [created, setCreated] = useState(0);

  /* Load members + categories */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      businessService.getMembers(businessId),
      transactionService.getCategories(businessId),
    ])
      .then(([m, c]) => {
        setMembers(m);
        setCategories(
          c.filter(
            (cat: Category) => cat.type === "expense" || cat.type === "both",
          ),
        );
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [businessId]);

  /* Add a cost row */
  const addCost = (preset?: { label: string; icon: string }) => {
    const defaultCat = categories[0]?._id ?? "";
    setCosts((prev) => [
      ...prev,
      {
        id: uid(),
        label: preset?.label ?? "নতুন খরচ",
        categoryId: defaultCat,
        amount: 0,
        icon: preset?.icon ?? "📦",
      },
    ]);
  };

  const updateCost = (
    id: string,
    field: keyof CostItem,
    value: string | number,
  ) =>
    setCosts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

  const removeCost = (id: string) =>
    setCosts((prev) => prev.filter((c) => c.id !== id));

  /* Validation */
  const validCosts = costs.filter((c) => c.amount > 0 && c.categoryId);
  const perHead = validCosts.reduce((s, c) => s + c.amount, 0);
  const totalAll = perHead * members.length;
  const canApply = validCosts.length > 0 && members.length > 0;

  /* Apply — create one expense entry per member per cost */
  const handleApply = async () => {
    setApplying(true);
    const today = new Date().toISOString().split("T")[0];
    let count = 0;

    for (const cost of validCosts) {
      const perMember = Math.round(cost.amount / members.length);
      for (const member of members) {
        try {
          await transactionService.create({
            businessId,
            type: "expense",
            amount: perMember,
            category: cost.categoryId,
            memberId: member._id,
            note: cost.label,
            date: today,
          });
          count++;
        } catch {
          toast.error(`Failed for ${member.firstName} — ${cost.label}`);
        }
      }
    }

    setCreated(count);
    setStep("done");
    setApplying(false);
  };

  /* ── UI ─────────────────────────────────────────── */
  const C = {
    bg: "#0d1424",
    border: "rgba(255,255,255,0.08)",
    card: "rgba(255,255,255,0.03)",
    input: "rgba(255,255,255,0.04)",
  };

  const inputCls =
    "w-full rounded-xl px-3 py-2 text-sm outline-none " +
    "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] " +
    "text-white placeholder:text-slate-600 focus:border-emerald-500/40";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: C.bg,
          border: "1px solid rgba(255,255,255,0.1)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div>
            <h3 className="text-white font-semibold">Shared Monthly Costs</h3>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
              সবার নামে automatically ভাগ করে entry দেবে
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: C.card, color: "#64748b" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              size={22}
              className="animate-spin"
              style={{ color: "#10b981" }}
            />
          </div>
        ) : /* ── DONE ── */
        step === "done" ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(16,185,129,0.1)" }}
            >
              <CheckCircle2 size={32} style={{ color: "#10b981" }} />
            </div>
            <h4 className="text-white font-semibold text-lg mb-2">
              সফলভাবে হয়েছে!
            </h4>
            <p className="text-sm mb-1" style={{ color: "#94a3b8" }}>
              <span style={{ color: "#10b981", fontWeight: 600 }}>
                {created}টি
              </span>{" "}
              entry তৈরি হয়েছে
            </p>
            <p className="text-xs mb-6" style={{ color: "#475569" }}>
              {members.length} জন × {validCosts.length}টি খরচ
            </p>
            <button
              onClick={() => {
                onDone(created);
                onClose();
              }}
              className="px-8 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "#10b981", color: "#022c22" }}
            >
              Done
            </button>
          </div>
        ) : /* ── CONFIRM ── */
        step === "confirm" ? (
          <div className="flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                <p
                  className="text-sm font-semibold mb-3"
                  style={{ color: "#f59e0b" }}
                >
                  ✅ নিশ্চিত করুন
                </p>
                <div className="space-y-2">
                  {validCosts.map((c) => {
                    const perMember = Math.round(c.amount / members.length);
                    const cat = categories.find((x) => x._id === c.categoryId);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-xs"
                        style={{ color: "#94a3b8" }}
                      >
                        <span>
                          {c.icon} {c.label}{" "}
                          <span style={{ color: "#475569" }}>
                            ({cat?.name})
                          </span>
                        </span>
                        <span>
                          {fmt(c.amount)} ÷ {members.length} ={" "}
                          <span style={{ color: "#f59e0b" }}>
                            {fmt(perMember)}/জন
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(245,158,11,0.2)" }}
                >
                  <div className="flex justify-between text-xs font-semibold">
                    <span style={{ color: "#f59e0b" }}>প্রতিজনের মোট খরচ</span>
                    <span style={{ color: "#f59e0b" }}>{fmt(perHead)}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span style={{ color: "#64748b" }}>
                      মোট entries ({members.length} জন × {validCosts.length}টি)
                    </span>
                    <span style={{ color: "#64748b" }}>
                      {members.length * validCosts.length}টি entry
                    </span>
                  </div>
                </div>
              </div>

              {/* Member list preview */}
              <p className="text-xs font-semibold" style={{ color: "#475569" }}>
                যাদের নামে entry হবে ({members.length} জন)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg,#10b981,#0d9488)",
                      }}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {m.firstName[0]}
                      </span>
                    </div>
                    <span className="text-xs text-white truncate">
                      {m.firstName} {m.lastName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="px-5 py-4 flex gap-3 flex-shrink-0"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              <button
                onClick={() => setStep("setup")}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  color: "#64748b",
                }}
              >
                Back
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                {applying ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    ✅ Apply করো ({members.length * validCosts.length}টি entry)
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ── SETUP ── */
          <div className="flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Preset quick add */}
              <div>
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: "#475569" }}
                >
                  Quick Add
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COSTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => addCost(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        color: "#94a3b8",
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost rows */}
              {costs.length === 0 ? (
                <div
                  className="py-8 text-center rounded-xl"
                  style={{
                    background: C.card,
                    border: `1px dashed ${C.border}`,
                  }}
                >
                  <p className="text-sm" style={{ color: "#334155" }}>
                    উপরে Quick Add থেকে খরচ যোগ করুন
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#475569" }}
                  >
                    খরচের তালিকা
                  </p>
                  {costs.map((cost) => (
                    <div
                      key={cost.id}
                      className="rounded-xl p-4 space-y-3"
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Icon picker */}
                        <select
                          value={cost.icon}
                          onChange={(e) =>
                            updateCost(cost.id, "icon", e.target.value)
                          }
                          className="rounded-lg px-2 py-1.5 text-base outline-none"
                          style={{
                            background: C.input,
                            border: `1px solid ${C.border}`,
                            color: "white",
                            width: "52px",
                          }}
                        >
                          {ICONS.map((ic) => (
                            <option key={ic} value={ic}>
                              {ic}
                            </option>
                          ))}
                        </select>
                        {/* Label */}
                        <input
                          value={cost.label}
                          onChange={(e) =>
                            updateCost(cost.id, "label", e.target.value)
                          }
                          className={inputCls + " flex-1"}
                          placeholder="খরচের নাম"
                        />
                        <button
                          onClick={() => removeCost(cost.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "rgba(239,68,68,0.08)",
                            color: "#ef4444",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Category */}
                        <div>
                          <label
                            className="block text-[10px] mb-1"
                            style={{ color: "#475569" }}
                          >
                            Category
                          </label>
                          <select
                            value={cost.categoryId}
                            onChange={(e) =>
                              updateCost(cost.id, "categoryId", e.target.value)
                            }
                            className="w-full rounded-xl px-3 py-2 text-xs outline-none appearance-none"
                            style={{
                              background: C.input,
                              border: `1px solid ${C.border}`,
                              color: "white",
                            }}
                          >
                            <option value="">Select...</option>
                            {categories.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Total amount */}
                        <div>
                          <label
                            className="block text-[10px] mb-1"
                            style={{ color: "#475569" }}
                          >
                            মোট পরিমাণ (৳)
                          </label>
                          <input
                            type="number"
                            value={cost.amount || ""}
                            onChange={(e) =>
                              updateCost(
                                cost.id,
                                "amount",
                                Number(e.target.value),
                              )
                            }
                            placeholder="যেমন: ৫০০০"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      {/* Per-head preview */}
                      {cost.amount > 0 && members.length > 0 && (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{
                            background: "rgba(16,185,129,0.06)",
                            border: "1px solid rgba(16,185,129,0.12)",
                          }}
                        >
                          <span
                            className="text-xs"
                            style={{ color: "#475569" }}
                          >
                            {fmt(cost.amount)} ÷ {members.length} জন =
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: "#10b981" }}
                          >
                            {fmt(Math.round(cost.amount / members.length))}/জন
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Custom add button */}
              <button
                onClick={() => addCost()}
                className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "transparent",
                  border: `1px dashed ${C.border}`,
                  color: "#475569",
                }}
              >
                <Plus size={14} /> Custom খরচ যোগ করুন
              </button>

              {/* Members count */}
              {members.length > 0 && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div className="flex -space-x-1">
                    {members.slice(0, 4).map((m) => (
                      <div
                        key={m._id}
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg,#10b981,#0d9488)",
                          borderColor: C.bg,
                        }}
                      >
                        <span className="text-[9px] font-bold text-white">
                          {m.firstName[0]}
                        </span>
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        style={{ background: "#1e293b", borderColor: C.bg }}
                      >
                        <span className="text-[9px] text-white">
                          +{members.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "#64748b" }}>
                    {members.length} জন সদস্যের নামে entry হবে
                  </span>
                </div>
              )}

              {/* Summary */}
              {validCosts.length > 0 && (
                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.15)",
                  }}
                >
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "#475569" }}>প্রতিজনের মোট খরচ</span>
                    <span className="font-bold" style={{ color: "#10b981" }}>
                      {fmt(perHead)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span style={{ color: "#334155" }}>মোট entries</span>
                    <span style={{ color: "#334155" }}>
                      {members.length * validCosts.length}টি
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-5 py-4 flex-shrink-0"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              <button
                onClick={() => setStep("confirm")}
                disabled={!canApply}
                className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition-all"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                পরবর্তী — নিশ্চিত করুন →
              </button>
              {!canApply && costs.length > 0 && (
                <p
                  className="text-center text-xs mt-2"
                  style={{ color: "#475569" }}
                >
                  amount এবং category দিন
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedCostsModal;
