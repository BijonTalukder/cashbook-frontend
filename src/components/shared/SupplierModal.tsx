import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supplierService, type ISupplier, type ISupplierPayload } from "../../services/supplier.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import Sheet from "../ui/Sheet";
import NativeInput from "../ui/Input";
import Button from "../ui/Button";

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

  const canEditOpeningBalance = editing
    ? editing.totalPurchases === 0 && editing.totalPaid === 0
    : true;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
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
        const updatePayload: Partial<ISupplierPayload> = { ...data };
        if (!canEditOpeningBalance) delete updatePayload.openingBalance;
        result = await supplierService.update(editing._id, updatePayload);
        toast.success(t("supplier.updated"));
      } else {
        result = await supplierService.create({ ...data, businessId: activeBusiness._id });
        toast.success(t("supplier.created"));
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("common.unknownError");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onClose={onClose} size="md" title={editing ? t("supplier.edit") : t("supplier.add")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <NativeInput
          label={t("common.name")}
          placeholder={t("supplier.namePlaceholder")}
          error={errors.name?.message}
          required
          autoFocus
          enterKeyHint="next"
          {...register("name")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NativeInput
            label={t("common.phone")}
            placeholder={t("supplier.phonePlaceholder")}
            error={errors.phone?.message}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            {...register("phone")}
          />
          <NativeInput
            label={t("common.email")}
            placeholder={t("supplier.emailPlaceholder")}
            error={errors.email?.message}
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            {...register("email")}
          />
        </div>

        <NativeInput
          label={t("common.address")}
          placeholder={t("supplier.addressPlaceholder")}
          error={errors.address?.message}
          enterKeyHint="next"
          {...register("address")}
        />

        <div>
          <NativeInput
            label={t("supplier.openingBalance")}
            placeholder={t("common.zero")}
            error={errors.openingBalance?.message}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            disabled={!canEditOpeningBalance}
            helperText={
              editing && !canEditOpeningBalance
                ? t("supplier.openingBalanceLocked")
                : editing && canEditOpeningBalance
                  ? t("supplier.openingBalanceEditHint")
                  : undefined
            }
            {...register("openingBalance", { valueAsNumber: true })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 select-none">
            {t("common.notes")}
          </label>
          <textarea
            {...register("notes")}
            placeholder={t("supplier.notesPlaceholder")}
            rows={2}
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-[16px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" block loading={submitting}>
            {editing ? t("common.saveChanges") : t("supplier.add")}
          </Button>
        </div>
      </form>
    </Sheet>
  );
};

export default SupplierModal;
