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

/* ─── Schema ──────────────────────────────────────────── */
const schema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z
      .number({ error: "Amount required", })
      .min(0.01, "Amount must be > 0"),
    category: z.string().min(1, "Category required"),
    note: z.string().optional(),
    date: z.string().min(1, "Date required"),
    reference: z.string().optional(),
    toMember: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer" && !data.toMember) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a recipient for transfer",
        path: ["toMember"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

/* ─── Interfaces ──────────────────────────────────────── */
interface IMemberOption {
  _id: string; firstName: string; lastName: string; email: string; role: string;
}

interface TypeTab {
  value: TxnType; label: string; icon: React.ElementType; color: string;
}

/* ─── Tab configs ─────────────────────────────────────── */
const DEFAULT_TABS: TypeTab[] = [
  { value: "income", label: "Income", icon: TrendingUp, color: "#10b981" },
  { value: "expense", label: "Expense", icon: TrendingDown, color: "#ef4444" },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight, color: "#3b82f6" },
];
const MASS_TABS: TypeTab[] = [
  { value: "income", label: "Deposit", icon: TrendingUp, color: "#10b981" },
  { value: "expense", label: "Cost", icon: TrendingDown, color: "#ef4444" },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight, color: "#3b82f6" },
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
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoadingCats(false));
  }, [open, activeBusiness]);

  /* load members */
  useEffect(() => {
    if (!open || !activeBusiness || selType !== "transfer" || members.length > 0) return;
    setLoadingMems(true);
    businessService.getMembers(activeBusiness._id)
      .then(setMembers)
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoadingMems(false));
  }, [open, activeBusiness, selType, members.length]);

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
      toast.success(`"${name}" added`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Failed to create category";
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
        toast.success("Transaction updated");
      } else {
        result = await transactionService.create(payload);
        toast.success("Transaction added");
      }
      onSuccess(result); onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Something went wrong";
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  const modalTitle = editing
    ? (isMass ? "Edit Entry" : "Edit Transaction")
    : (isMass ? "New Entry" : "New Transaction");

  const submitLabel = (() => {
    if (editing) return "Save Changes";
    if (isMass) {
      if (selType === "income") return "Add Deposit";
      if (selType === "expense") return "Add Cost";
      return "Add Transfer";
    }
    return `Add ${tabs.find((t) => t.value === selType)?.label ?? ""}`;
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
            {tabs.map(({ value, label, icon: Icon, color }) => {
              const active = selType === value;
              return (
                <button key={value} type="button"
                  onClick={() => { setValue("type", value); setValue("category", ""); setValue("toMember", ""); setAddingCat(false); setNewCatName(""); }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: active ? `${color}15` : C.input, border: `1px solid ${active ? `${color}40` : C.inputBorder}`, color: active ? color : "var(--text-muted)" }}>
                  <Icon size={14} />{label}
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
                This entry will be recorded under your name and shown in the invoice.
              </p>
            </div>
          )}

          {/* Amount */}
          <Field label="Amount (৳)" error={errors.amount?.message}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                style={{ color: typeColor, fontSize: "15px" }}>৳</span>
              <input {...register("amount", { valueAsNumber: true })}
                type="number" step="0.01" min="0" placeholder="0.00"
                style={{ ...inputCss(!!errors.amount), paddingLeft: "28px", fontSize: "20px", fontWeight: 700 }} />
            </div>
          </Field>

          {/* To Member */}
          {selType === "transfer" && (
            <Field label="Send to" error={errors.toMember?.message}>
              {loadingMems ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin" style={{ color: "#3b82f6" }} />
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>No other members</p>
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
                          <p className="text-[11px] truncate capitalize" style={{ color: "var(--text-faint)" }}>
                            {m.role} · {m.email}</p>
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
          <Field label="Category" error={errors.category?.message}>
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
                      <Plus size={11} /> New
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
                      placeholder="Category name..."
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
          <Field label="Date" error={errors.date?.message}>
            <input {...register("date")} type="date"
              style={{ ...inputCss(!!errors.date), colorScheme: theme }} />
          </Field>

          {/* Note */}
          <Field label="Note (optional)">
            <input {...register("note")}
              placeholder={isMass ? "e.g. House rent, grocery, gas bill..." : "What was this for?"}
              style={inputCss()} />
          </Field>

          {/* Reference */}
          <Field label="Reference / Invoice # (optional)">
            <input {...register("reference")} placeholder="INV-001" style={inputCss()} />
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