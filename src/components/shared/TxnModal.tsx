import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Users,
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

/* ─── Schema ──────────────────────────────────────────── */
const schema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z
      .number({
        error: "Amount required",
      })
      .min(0.01, "Amount must be greater than 0"),
    category: z.string().min(1, "Category required"),
    note: z.string().optional(),
    date: z.string().min(1, "Date required"),
    reference: z.string().optional(),
    toMember: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // ✅ transfer হলে toMember required
    if (data.type === "transfer" && !data.toMember) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a recipient for transfer",
        path: ["toMember"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

/* ─── Member interface ────────────────────────────────── */
interface IMemberOption {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

/* ─── Constants ───────────────────────────────────────── */
const TYPE_TABS: {
  value: TxnType;
  label: string;
  icon: any;
  color: string;
}[] = [
  { value: "income", label: "Income", icon: TrendingUp, color: "#10b981" },
  { value: "expense", label: "Expense", icon: TrendingDown, color: "#ef4444" },
  {
    value: "transfer",
    label: "Transfer",
    icon: ArrowLeftRight,
    color: "#3b82f6",
  },
];

const C = {
  overlay: "rgba(0,0,0,0.75)",
  card: "#0d1424",
  border: "rgba(255,255,255,0.08)",
  input: "rgba(255,255,255,0.04)",
  inputBorder: "rgba(255,255,255,0.1)",
};

/* ─── Field wrapper ───────────────────────────────────── */
const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs mb-1.5" style={{ color: "#64748b" }}>
      {label}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
        {error}
      </p>
    )}
  </div>
);

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: "100%",
  background: C.input,
  border: `1px solid ${hasError ? "#f87171" : C.inputBorder}`,
  borderRadius: "12px",
  padding: "10px 14px",
  color: "#f1f5f9",
  fontSize: "14px",
  outline: "none",
});

/* ─── Props ───────────────────────────────────────────── */
interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (txn: ITransaction) => void;
  editing?: ITransaction | null;
  defaultType?: TxnType;
}

/* ─── Component ───────────────────────────────────────── */
const TxnModal = ({
  open,
  onClose,
  onSuccess,
  editing,
  defaultType = "expense",
}: Props) => {
  const { activeBusiness } = useBusinessStore();

  const [categories, setCategories] = useState<ITxnCategory[]>([]);
  const [members, setMembers] = useState<IMemberOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingMems, setLoadingMems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: editing?.type ?? defaultType,
      date:
        editing?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      category: editing?.category?._id ?? "",
      note: editing?.note ?? "",
      reference: editing?.reference ?? "",
      toMember: editing?.toMember?._id ?? "",
    },
  });

  const selectedType = watch("type");
  const selectedCat = watch("category");
  const selectedMem = watch("toMember");
  const typeColor =
    TYPE_TABS.find((t) => t.value === selectedType)?.color ?? "#10b981";
  const TypeIcon =
    TYPE_TABS.find((t) => t.value === selectedType)?.icon ?? TrendingDown;

  /* ── Load categories ────────────────────────────────── */
  useEffect(() => {
    if (!open || !activeBusiness) return;
    setLoadingCats(true);
    transactionService
      .getCategories(activeBusiness._id)
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoadingCats(false));
  }, [open, activeBusiness]);

  /* ── Load members (for transfer) ────────────────────── */
  useEffect(() => {
    if (!open || !activeBusiness || selectedType !== "transfer") return;
    if (members.length > 0) return; // already loaded

    setLoadingMems(true);
    businessService
      .getMembers(activeBusiness._id)
      .then((data) => {
        // exclude current user — can't transfer to yourself
        setMembers(data);
      })
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoadingMems(false));
  }, [open, activeBusiness, selectedType]);

  /* ── Reset on open ──────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    reset({
      type: editing?.type ?? defaultType,
      date:
        editing?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      amount: editing?.amount,
      category: editing?.category?._id ?? "",
      note: editing?.note ?? "",
      reference: editing?.reference ?? "",
      toMember: editing?.toMember?._id ?? "",
    });
  }, [open, editing, defaultType]);

  /* ── Filtered categories ────────────────────────────── */
  const filteredCats = categories.filter(
    (c) => c.type === selectedType || c.type === "both",
  );

  /* ── Submit ─────────────────────────────────────────── */
  const onSubmit = async (data: FormData) => {
    if (!activeBusiness) return;
    setSubmitting(true);
    try {
      let result: ITransaction;

      const payload = {
        ...data,
        businessId: activeBusiness._id,
        // ✅ toMember শুধু transfer এ পাঠাও
        toMember: data.type === "transfer" ? data.toMember : undefined,
      };

      if (editing) {
        result = await transactionService.update(editing._id, payload);
        toast.success("Transaction updated");
      } else {
        result = await transactionService.create(payload);
        toast.success("Transaction added");
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Something went wrong";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: C.overlay, backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* ── Header ──────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}
        >
          <h2
            className="text-base font-semibold text-white"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {editing ? "Edit Transaction" : "New Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* ── Type tabs ───────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            {TYPE_TABS.map(({ value, label, icon: Icon, color }) => {
              const isSelected = selectedType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setValue("type", value);
                    setValue("category", "");
                    setValue("toMember", "");
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: isSelected ? `${color}15` : C.input,
                    border: `1px solid ${isSelected ? `${color}40` : C.inputBorder}`,
                    color: isSelected ? color : "#64748b",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Amount ──────────────────────────── */}
          <Field label="Amount (৳)" error={errors.amount?.message}>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                style={{ color: typeColor, fontSize: "15px" }}
              >
                ৳
              </span>
              <input
                {...register("amount", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                style={{
                  ...inputStyle(!!errors.amount),
                  paddingLeft: "28px",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              />
            </div>
          </Field>

          {/* ── To Member (transfer only) ────────── */}
          {selectedType === "transfer" && (
            <Field label="Send to" error={errors.toMember?.message}>
              {loadingMems ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2
                    size={16}
                    className="animate-spin"
                    style={{ color: "#3b82f6" }}
                  />
                </div>
              ) : members.length === 0 ? (
                <div
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.15)",
                  }}
                >
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    No other members in this business
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => {
                    const isSelected = selectedMem === m._id;
                    return (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => setValue("toMember", m._id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                        style={{
                          background: isSelected
                            ? "rgba(59,130,246,0.12)"
                            : C.input,
                          border: `1px solid ${isSelected ? "rgba(59,130,246,0.4)" : C.inputBorder}`,
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg, #3b82f6, #2563eb)",
                          }}
                        >
                          <span className="text-[11px] font-bold text-white">
                            {m.firstName[0]}
                            {m.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: isSelected ? "#fff" : "#cbd5e1" }}
                          >
                            {m.firstName} {m.lastName}
                          </p>
                          <p
                            className="text-[11px] truncate capitalize"
                            style={{ color: "#475569" }}
                          >
                            {m.role} · {m.email}
                          </p>
                        </div>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "#3b82f6" }}
                          >
                            <svg
                              width="8"
                              height="8"
                              viewBox="0 0 8 8"
                              fill="none"
                            >
                              <path
                                d="M1 4l2 2 4-4"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
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

          {/* ── Category ────────────────────────── */}
          <Field label="Category" error={errors.category?.message}>
            {loadingCats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{ color: "#10b981" }}
                />
              </div>
            ) : filteredCats.length === 0 ? (
              <p className="text-xs py-2" style={{ color: "#475569" }}>
                No categories found.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {filteredCats.map((cat) => {
                  const isSelected = selectedCat === cat._id;
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setValue("category", cat._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                      style={{
                        background: isSelected ? `${typeColor}15` : C.input,
                        border: `1px solid ${isSelected ? `${typeColor}45` : C.inputBorder}`,
                        color: isSelected ? typeColor : "#94a3b8",
                        flexShrink: 0,
                      }}
                    >
                      {cat.icon && <span className="text-sm">{cat.icon}</span>}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>

          {/* ── Date ────────────────────────────── */}
          <Field label="Date" error={errors.date?.message}>
            <input
              {...register("date")}
              type="date"
              style={{ ...inputStyle(!!errors.date), colorScheme: "dark" }}
            />
          </Field>

          {/* ── Note ────────────────────────────── */}
          <Field label="Note (optional)">
            <input
              {...register("note")}
              placeholder="What was this for?"
              style={inputStyle()}
            />
          </Field>

          {/* ── Reference ───────────────────────── */}
          <Field label="Reference / Invoice # (optional)">
            <input
              {...register("reference")}
              placeholder="INV-001"
              style={inputStyle()}
            />
          </Field>

          {/* ── Submit ──────────────────────────── */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
            style={{
              background: typeColor,
              color: selectedType === "income" ? "#022c22" : "#fff",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : editing ? (
              "Save Changes"
            ) : (
              <>
                <TypeIcon size={15} />
                Add {TYPE_TABS.find((t) => t.value === selectedType)?.label}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TxnModal;
