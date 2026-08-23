import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X, Loader2, TrendingUp, TrendingDown,
  ArrowLeftRight, Users, Plus, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  transactionService,
  type ITransaction,
  type ITxnCategory,
  type TxnType,
} from "../../services/transaction.service";
import { businessService } from "../../services/business.service";
import { useBusinessStore } from "../../store/businessStore";
import { useThemeStore } from "../../store/themeStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { enumLabel } from "../../i18n/labels";

/* ─── Schema ──────────────────────────────────────────── */
const buildSchema = (t: TFunction) =>
  z
    .object({
      type: z.enum(["income", "expense", "transfer"]),
      amount: z
        .number({ error: t("txn.validation.amountRequired") })
        .min(0.01, t("txn.validation.amountMin")),
      category: z.string().min(1, t("txn.validation.categoryRequired")),
      note: z.string().optional(),
      date: z.string().min(1, t("txn.validation.dateRequired")),
      reference: z.string().optional(),
      toMember: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === "transfer" && !data.toMember) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("txn.validation.recipientRequired"),
          path: ["toMember"],
        });
      }
    });

type FormData = z.infer<ReturnType<typeof buildSchema>>;

/* ─── Interfaces ──────────────────────────────────────── */
interface IMemberOption {
  _id: string; firstName: string; lastName: string; email: string; role: string;
}

interface TypeTab {
  value: TxnType; labelKey: string; icon: React.ElementType; color: string;
}

/* ─── Tab configs ─────────────────────────────────────── */
const DEFAULT_TABS: TypeTab[] = [
  { value: "income", labelKey: "txn.income", icon: TrendingUp, color: "#10b981" },
  { value: "expense", labelKey: "txn.expense", icon: TrendingDown, color: "#ef4444" },
  { value: "transfer", labelKey: "txn.transfer", icon: ArrowLeftRight, color: "#3b82f6" },
];
const MASS_TABS: TypeTab[] = [
  { value: "income", labelKey: "txn.deposit", icon: TrendingUp, color: "#10b981" },
  { value: "expense", labelKey: "txn.cost", icon: TrendingDown, color: "#ef4444" },
  { value: "transfer", labelKey: "txn.transfer", icon: ArrowLeftRight, color: "#3b82f6" },
];

/* ─── Styles ──────────────────────────────────────────── */
const C = {
  overlay: "var(--overlay-scrim)", card: "var(--bg-elevated)",
  border: "var(--border)", input: "var(--surface-2)",
  inputBorder: "var(--border-strong)",
};
const inputCss = (err?: boolean): React.CSSProperties => ({
  width: "100%", background: C.input,
  border: `1px solid ${err ? "#f87171" : C.inputBorder}`,
  borderRadius: "12px", padding: "10px 14px",
  color: "var(--text-primary)", fontSize: "14px", outline: "none",
});

/* ─── Field ───────────────────────────────────────────── */
const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
    {children}
    {error && <p className="mt-1 text-xs" style={{ color: "#f87171" }}>{error}</p>}
  </div>
);

/* ─── Props ───────────────────────────────────────────── */
interface Props {
  open: boolean; onClose: () => void;
  onSuccess: (txn: ITransaction) => void;
  editing?: ITransaction | null;
  defaultType?: TxnType;
  isMass?: boolean;
}

/* ─── Component ───────────────────────────────────────── */
const TxnModal = ({
  open, onClose, onSuccess,
  editing, defaultType = "expense", isMass = false,
}: Props) => {
  const { activeBusiness } = useBusinessStore();
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const { symbol } = useFormat();
  const schema = React.useMemo(() => buildSchema(t), [t]);

  const [categories, setCategories] = useState<ITxnCategory[]>([]);
  const [members, setMembers] = useState<IMemberOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingMems, setLoadingMems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const catInputRef = useRef<HTMLInputElement>(null);

  const tabs = isMass ? MASS_TABS : DEFAULT_TABS;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        type: editing?.type ?? defaultType,
        date: editing?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        category: editing?.category?._id ?? "",
        note: editing?.note ?? "",
        reference: editing?.reference ?? "",
        toMember: editing?.toMember?._id ?? "",
      },
    });

  const selType = watch("type");
  const selCat = watch("category");
  const selMem = watch("toMember");
  const tabMatch = tabs.find((t) => t.value === selType);
  const typeColor = tabMatch?.color ?? "#10b981";
  const TypeIcon = tabMatch?.icon ?? TrendingDown;

  /* load cats */
  useEffect(() => {
    if (!open || !activeBusiness) return;
    setLoadingCats(true);
    transactionService.getCategories(activeBusiness._id)
      .then(setCategories)
      .catch(() => toast.error(t("txn.loadCategoriesFailed")))
      .finally(() => setLoadingCats(false));
  }, [open, activeBusiness, t]);

  /* load members */
  useEffect(() => {
    if (!open || !activeBusiness || selType !== "transfer" || members.length > 0) return;
    setLoadingMems(true);
    businessService.getMembers(activeBusiness._id)
      .then(setMembers)
      .catch(() => toast.error(t("txn.loadMembersFailed")))
      .finally(() => setLoadingMems(false));
  }, [open, activeBusiness, selType, members.length, t]);

  /* reset */
  useEffect(() => {
    if (!open) return;
    reset({
      type: editing?.type ?? defaultType,
      date: editing?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      amount: editing?.amount,
      category: editing?.category?._id ?? "",
      note: editing?.note ?? "",
      reference: editing?.reference ?? "",
      toMember: editing?.toMember?._id ?? "",
    });
    setAddingCat(false);
    setNewCatName("");
  }, [open, editing, defaultType, reset]);

  /* auto-focus cat input */
  useEffect(() => {
    if (addingCat) setTimeout(() => catInputRef.current?.focus(), 50);
  }, [addingCat]);

  const filteredCats = categories.filter((c) => c.type === selType || c.type === "both");

  /* create category */
  const handleCreateCat = async () => {
    const name = newCatName.trim();
    if (!name || !activeBusiness) return;
    setSavingCat(true);
    try {
      const newCat = await transactionService.createCategory({
        name,
        type: selType === "transfer" ? "both" : selType,
        businessId: activeBusiness._id,
      });
      setCategories((prev) => [...prev, newCat]);
      setValue("category", newCat._id);
      setNewCatName(""); setAddingCat(false);
      toast.success(t("txn.categoryAdded", { name }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("txn.createCategoryFailed");
      toast.error(msg);
    } finally { setSavingCat(false); }
  };

  /* submit */
  const onSubmit = async (data: FormData) => {
    if (!activeBusiness) return;
    setSubmitting(true);
    try {
      const payload = {
        ...data, businessId: activeBusiness._id,
        toMember: data.type === "transfer" ? data.toMember : undefined,
      };
      let result: ITransaction;
      if (editing) {
        result = await transactionService.update(editing._id, payload);
        toast.success(t("txn.updated"));
      } else {
        result = await transactionService.create(payload);
        toast.success(t("txn.created"));
      }
      onSuccess(result); onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("common.unknownError");
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  const modalTitle = editing
    ? (isMass ? t("txn.editEntry") : t("txn.editTransaction"))
    : (isMass ? t("txn.newEntry") : t("txn.newTransaction"));

  const submitLabel = (() => {
    if (editing) return t("common.saveChanges");
    if (isMass) {
      if (selType === "income") return t("txn.addDeposit");
      if (selType === "expense") return t("txn.addCost");
      return t("txn.addTransfer");
    }
    const tab = tabs.find((tab) => tab.value === selType);
    return t("txn.addType", { type: tab ? t(tab.labelKey) : "" });
  })();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: C.overlay, backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.border}`, maxHeight: "90dvh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-base font-semibold"
            style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>{modalTitle}</h2>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

          {/* Type tabs */}
          <div className="grid grid-cols-3 gap-2">
            {tabs.map(({ value, labelKey, icon: Icon, color }) => {
              const active = selType === value;
              return (
                <button key={value} type="button"
                  onClick={() => { setValue("type", value); setValue("category", ""); setValue("toMember", ""); setAddingCat(false); setNewCatName(""); }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: active ? `${color}15` : C.input, border: `1px solid ${active ? `${color}40` : C.inputBorder}`, color: active ? color : "var(--text-muted)" }}>
                  <Icon size={14} />{t(labelKey)}
                </button>
              );
            })}
          </div>

          {/* Mass hint */}
          {isMass && (
            <div className="rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <Users size={12} style={{ color: "#8b5cf6", flexShrink: 0 }} />
              <p className="text-xs" style={{ color: "#8b5cf6" }}>
                {t("txn.massHint")}
              </p>
            </div>
          )}

          {/* Amount */}
          <Field label={t("txn.amountWithCurrency", { symbol })} error={errors.amount?.message}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                style={{ color: typeColor, fontSize: "15px" }}>{symbol}</span>
              <input {...register("amount", { valueAsNumber: true })}
                type="number" step="0.01" min="0" placeholder={t("txn.amountPlaceholder")}
                style={{ ...inputCss(!!errors.amount), paddingLeft: "28px", fontSize: "20px", fontWeight: 700 }} />
            </div>
          </Field>

          {/* To Member */}
          {selType === "transfer" && (
            <Field label={t("txn.sendTo")} error={errors.toMember?.message}>
              {loadingMems ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin" style={{ color: "#3b82f6" }} />
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("txn.noOtherMembers")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => {
                    const sel = selMem === m._id;
                    return (
                      <button key={m._id} type="button" onClick={() => setValue("toMember", m._id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                        style={{ background: sel ? "rgba(59,130,246,0.12)" : C.input, border: `1px solid ${sel ? "rgba(59,130,246,0.4)" : C.inputBorder}` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
                          <span className="text-[11px] font-bold text-white">{m.firstName[0]}{m.lastName[0]}</span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: sel ? "var(--text-primary)" : "var(--text-secondary)" }}>
                            {m.firstName} {m.lastName}</p>
                          <p className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>
                            {t("txn.memberLine", { role: enumLabel(t, "role", m.role), email: m.email })}</p>
                        </div>
                        {sel && (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "#3b82f6" }}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>
          )}

          {/* Category */}
          <Field label={t("common.category")} error={errors.category?.message}>
            {loadingCats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin" style={{ color: "#10b981" }} />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                  {filteredCats.map((cat) => {
                    const sel = selCat === cat._id;
                    return (
                      <button key={cat._id} type="button"
                        onClick={() => setValue("category", cat._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                        style={{ background: sel ? `${typeColor}15` : C.input, border: `1px solid ${sel ? `${typeColor}45` : C.inputBorder}`, color: sel ? typeColor : "var(--text-secondary)", flexShrink: 0 }}>
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                      </button>
                    );
                  })}
                  {!addingCat && (
                    <button type="button" onClick={() => setAddingCat(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                      style={{ background: "transparent", border: `1px dashed ${C.inputBorder}`, color: "var(--text-faint)", flexShrink: 0 }}>
                      <Plus size={11} /> {t("txn.newCategory")}
                    </button>
                  )}
                </div>
                {addingCat && (
                  <div className="flex items-center gap-2 mt-2">
                    <input ref={catInputRef} value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); handleCreateCat(); }
                        if (e.key === "Escape") { setAddingCat(false); setNewCatName(""); }
                      }}
                      placeholder={t("txn.categoryNamePlaceholder")}
                      className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                      style={{ background: C.input, border: `1px solid ${typeColor}55`, color: "var(--text-primary)" }} />
                    <button type="button" onClick={handleCreateCat}
                      disabled={!newCatName.trim() || savingCat}
                      className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 disabled:opacity-40 transition-all"
                      style={{ background: `${typeColor}20`, color: typeColor, border: `1px solid ${typeColor}40` }}>
                      {savingCat ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </button>
                    <button type="button" onClick={() => { setAddingCat(false); setNewCatName(""); }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: C.input, color: "var(--text-faint)", border: `1px solid ${C.inputBorder}` }}>
                      <X size={13} />
                    </button>
                  </div>
                )}
              </>
            )}
          </Field>

          {/* Date */}
          <Field label={t("common.date")} error={errors.date?.message}>
            <input {...register("date")} type="date"
              style={{ ...inputCss(!!errors.date), colorScheme: theme }} />
          </Field>

          {/* Note */}
          <Field label={t("txn.note")}>
            <input {...register("note")}
              placeholder={isMass ? t("txn.notePlaceholderMass") : t("txn.notePlaceholder")}
              style={inputCss()} />
          </Field>

          {/* Reference */}
          <Field label={t("txn.reference")}>
            <input {...register("reference")} placeholder={t("txn.referencePlaceholder")} style={inputCss()} />
          </Field>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
            style={{ background: typeColor, color: selType === "income" ? "#022c22" : "#fff", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <><TypeIcon size={15} />{submitLabel}</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TxnModal;