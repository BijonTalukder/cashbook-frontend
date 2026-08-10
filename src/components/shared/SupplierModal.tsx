import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { useBusinessStore } from "../../store/businessStore";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  openingBalance: z.number().min(0, "Cannot be negative").optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

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

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
    {children}
    {error && <p className="mt-1 text-xs" style={{ color: "#f87171" }}>{error}</p>}
  </div>
);

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (supplier: ISupplier) => void;
  editing?: ISupplier | null;
}

const SupplierModal = ({ open, onClose, onSuccess, editing }: Props) => {
  const { activeBusiness } = useBusinessStore();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", address: "", openingBalance: 0, notes: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: editing?.name ?? "",
      phone: editing?.phone ?? "",
      email: editing?.email ?? "",
      address: editing?.address ?? "",
      openingBalance: editing?.openingBalance ?? 0,
      notes: editing?.notes ?? "",
    });
  }, [open, editing, reset]);

  const onSubmit = async (data: FormData) => {
    if (!activeBusiness) return;
    setSubmitting(true);
    try {
      let result: ISupplier;
      if (editing) {
        result = await supplierService.update(editing._id, data);
        toast.success("Supplier updated");
      } else {
        result = await supplierService.create({ ...data, businessId: activeBusiness._id });
        toast.success("Supplier added");
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

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
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-base font-semibold"
            style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {editing ? "Edit Supplier" : "Add Supplier"}
          </h2>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <input {...register("name")} placeholder="Supplier name" style={inputCss(!!errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register("phone")} placeholder="01XXXXXXXXX" style={inputCss()} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register("email")} placeholder="email@example.com" style={inputCss(!!errors.email)} />
            </Field>
          </div>

          <Field label="Address" error={errors.address?.message}>
            <input {...register("address")} placeholder="Address" style={inputCss()} />
          </Field>

          {!editing && (
            <Field label="Opening balance (amount already payable)" error={errors.openingBalance?.message}>
              <input
                type="number" min="0" step="0.01"
                {...register("openingBalance", { valueAsNumber: true })}
                placeholder="0"
                style={inputCss(!!errors.openingBalance)}
              />
            </Field>
          )}

          <Field label="Notes" error={errors.notes?.message}>
            <textarea {...register("notes")} placeholder="Optional notes" rows={2} style={inputCss()} />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {editing ? "Save Changes" : "Add Supplier"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;
