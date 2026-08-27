import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import Sheet from "../ui/Sheet";

const buildSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")).max(80),
    phone: z.string().optional(),
    email: z.string().email(t("validation.invalidEmail")).optional().or(z.literal("")),
    address: z.string().optional(),
    openingBalance: z.number().min(0, t("validation.notNegative")).optional(),
    notes: z.string().optional(),
  });
type FormData = z.infer<ReturnType<typeof buildSchema>>;

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
  const { t } = useTranslation();
  const schema = React.useMemo(() => buildSchema(t), [t]);

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
        toast.success(t("supplier.updated"));
      } else {
        result = await supplierService.create({ ...data, businessId: activeBusiness._id });
        toast.success(t("supplier.created"));
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("common.unknownError");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onClose={onClose} size="md" title={editing ? t("supplier.edit") : t("supplier.add")}>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("common.name")} error={errors.name?.message}>
            <input {...register("name")} placeholder={t("supplier.namePlaceholder")} style={inputCss(!!errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.phone")} error={errors.phone?.message}>
              <input
                {...register("phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("customer.phonePlaceholder")}
                style={inputCss()}
              />
            </Field>
            <Field label={t("common.email")} error={errors.email?.message}>
              <input {...register("email")} placeholder={t("customer.emailPlaceholder")} style={inputCss(!!errors.email)} />
            </Field>
          </div>

          <Field label={t("common.address")} error={errors.address?.message}>
            <input {...register("address")} placeholder={t("customer.addressPlaceholder")} style={inputCss()} />
          </Field>

          {!editing && (
            <Field label={t("supplier.openingBalance")} error={errors.openingBalance?.message}>
              <input
                type="number" inputMode="decimal" min="0" step="0.01"
                {...register("openingBalance", { valueAsNumber: true })}
                placeholder={t("common.zero")}
                style={inputCss(!!errors.openingBalance)}
              />
            </Field>
          )}

          <Field label={t("common.notes")} error={errors.notes?.message}>
            <textarea {...register("notes")} placeholder={t("customer.notesPlaceholder")} rows={2} style={inputCss()} />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold press disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {editing ? t("common.saveChanges") : t("supplier.add")}
          </button>
        </form>
    </Sheet>
  );
};

export default SupplierModal;
