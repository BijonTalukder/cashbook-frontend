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
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { useBackHandler, useBodyScrollLock } from "../../native/hooks";

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
  { labelKey: "sharedCosts.presets.rent", icon: "🏠" },
  { labelKey: "sharedCosts.presets.electricity", icon: "⚡" },
  { labelKey: "sharedCosts.presets.water", icon: "💧" },
  { labelKey: "sharedCosts.presets.internet", icon: "🌐" },
  { labelKey: "sharedCosts.presets.gas", icon: "🔧" },
  { labelKey: "sharedCosts.presets.other", icon: "📦" },
];

/* ── Helpers ──────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

/* ════════════════════════════════════════════════════
   SharedCostsModal
════════════════════════════════════════════════════ */
interface Props {
  businessId: string;
  onClose: () => void;
  onDone: (count: number) => void;
}

const SharedCostsModal = ({ businessId, onClose, onDone }: Props) => {
  // This modal has no `open` prop — it is mounted only while shown.
  useBackHandler(true, onClose);
  useBodyScrollLock(true);

  const { t } = useTranslation();
  const { money, num, symbol } = useFormat();
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
      .catch(() => toast.error(t("sharedCosts.loadFailed")))
      .finally(() => setLoading(false));
  }, [businessId, t]);

  /* Add a cost row */
  const addCost = (preset?: { labelKey: string; icon: string }) => {
    const defaultCat = categories[0]?._id ?? "";
    setCosts((prev) => [
      ...prev,
      {
        id: uid(),
        label: preset ? t(preset.labelKey) : t("sharedCosts.newCost"),
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
          toast.error(t("sharedCosts.failedFor", { name: member.firstName, label: cost.label }));
        }
      }
    }

    setCreated(count);
    setStep("done");
    setApplying(false);
  };

  /* ── UI ─────────────────────────────────────────── */
  const C = {
    bg: "var(--bg-elevated)",
    border: "var(--border)",
    card: "var(--surface-1)",
    input: "var(--surface-2)",
  };

  const inputCls =
    "w-full rounded-xl px-3 py-2 text-sm outline-none " +
    "bg-[var(--surface-2)] border border-[var(--border)] " +
    "text-[var(--text-primary)] placeholder:text-slate-600 focus:border-emerald-500/40";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 anim-scrim-in"
      style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col anim-sheet-up sm:animate-none"
        style={{
          background: C.bg,
          border: "1px solid var(--border-strong)",
          maxHeight: "92dvh",
          boxShadow: "var(--shadow-sheet)",
          paddingBottom: "var(--safe-bottom)",
        }}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full" style={{ background: "var(--border-strong)" }} />
        </div>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("sharedCosts.title")}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
              {t("sharedCosts.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: C.card, color: "var(--text-muted)" }}
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
            <h4 className="font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              {t("sharedCosts.successTitle")}
            </h4>
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "#10b981", fontWeight: 600 }}>
                {t("sharedCosts.successCount", { count: num(created) })}
              </span>{" "}
              {t("sharedCosts.successLine")}
            </p>
            <p className="text-xs mb-6" style={{ color: "var(--text-faint)" }}>
              {t("sharedCosts.successBreakdown", {
                members: num(members.length),
                costs: num(validCosts.length),
              })}
            </p>
            <button
              onClick={() => {
                onDone(created);
                onClose();
              }}
              className="px-8 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "#10b981", color: "#022c22" }}
            >
              {t("common.done")}
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
                  {t("sharedCosts.confirmTitle")}
                </p>
                <div className="space-y-2">
                  {validCosts.map((c) => {
                    const perMember = Math.round(c.amount / members.length);
                    const cat = categories.find((x) => x._id === c.categoryId);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span>
                          {c.icon} {c.label}{" "}
                          <span style={{ color: "var(--text-faint)" }}>
                            ({cat?.name})
                          </span>
                        </span>
                        <span>
                          {t("sharedCosts.confirmSplit", {
                            amount: money(c.amount, { decimals: 0 }),
                            count: num(members.length),
                          })}{" "}
                          <span style={{ color: "#f59e0b" }}>
                            {t("sharedCosts.perHead", { amount: money(perMember, { decimals: 0 }) })}
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
                    <span style={{ color: "#f59e0b" }}>{t("sharedCosts.perPersonTotal")}</span>
                    <span style={{ color: "#f59e0b" }}>{money(perHead, { decimals: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span style={{ color: "var(--text-muted)" }}>
                      {t("sharedCosts.entriesFormula", {
                        members: num(members.length),
                        costs: num(validCosts.length),
                      })}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {t("sharedCosts.entriesCount", { count: num(members.length * validCosts.length) })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Member list preview */}
              <p className="text-xs font-semibold" style={{ color: "var(--text-faint)" }}>
                {t("sharedCosts.whoGetsEntries", { count: num(members.length) })}
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
                    <span className="text-xs truncate" style={{ color: "var(--text-primary)" }}>
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
                  color: "var(--text-muted)",
                }}
              >
                {t("common.back")}
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                {applying ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> {t("sharedCosts.applying")}
                  </>
                ) : (
                  <>
                    {t("sharedCosts.apply", { count: num(members.length * validCosts.length) })}
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
                  style={{ color: "var(--text-faint)" }}
                >
                  {t("sharedCosts.quickAdd")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COSTS.map((p) => (
                    <button
                      key={p.labelKey}
                      onClick={() => addCost(p)}
                      className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs flex-shrink-0 whitespace-nowrap press"
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {p.icon} {t(p.labelKey)}
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
                  <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                    {t("sharedCosts.emptyHint")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {t("sharedCosts.costList")}
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
                            color: "var(--text-primary)",
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
                          placeholder={t("sharedCosts.costNamePlaceholder")}
                        />
                        <button
                          onClick={() => removeCost(cost.id)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
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
                            style={{ color: "var(--text-faint)" }}
                          >
                            {t("sharedCosts.categoryLabel")}
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
                              color: "var(--text-primary)",
                            }}
                          >
                            <option value="">{t("sharedCosts.selectPlaceholder")}</option>
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
                            style={{ color: "var(--text-faint)" }}
                          >
                            {t("sharedCosts.totalAmount", { symbol })}
                          </label>
                          <input
                            type="number" inputMode="decimal"
                            value={cost.amount || ""}
                            onChange={(e) =>
                              updateCost(
                                cost.id,
                                "amount",
                                Number(e.target.value),
                              )
                            }
                            placeholder={t("sharedCosts.amountPlaceholder")}
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
                            style={{ color: "var(--text-faint)" }}
                          >
                            {t("sharedCosts.perHeadPreview", {
                              amount: money(cost.amount, { decimals: 0 }),
                              count: num(members.length),
                            })}
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: "#10b981" }}
                          >
                            {t("sharedCosts.perHead", {
                              amount: money(Math.round(cost.amount / members.length), { decimals: 0 }),
                            })}
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
                  color: "var(--text-faint)",
                }}
              >
                <Plus size={14} /> {t("sharedCosts.addCustom")}
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
                        style={{ background: "var(--surface-6)", borderColor: C.bg }}
                      >
                        <span className="text-[9px]" style={{ color: "var(--text-primary)" }}>
                          +{num(members.length - 4)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("sharedCosts.membersLine", { count: num(members.length) })}
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
                    <span style={{ color: "var(--text-faint)" }}>{t("sharedCosts.perPersonTotal")}</span>
                    <span className="font-bold" style={{ color: "#10b981" }}>
                      {money(perHead, { decimals: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span style={{ color: "var(--text-faint)" }}>{t("sharedCosts.totalEntries")}</span>
                    <span style={{ color: "var(--text-faint)" }}>
                      {t("sharedCosts.entriesCount", { count: num(members.length * validCosts.length) })}
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
                {t("sharedCosts.next")}
              </button>
              {!canApply && costs.length > 0 && (
                <p
                  className="text-center text-xs mt-2"
                  style={{ color: "var(--text-faint)" }}
                >
                  {t("sharedCosts.needAmountCategory")}
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
