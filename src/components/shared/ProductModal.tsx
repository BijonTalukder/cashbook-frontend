import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productService, type IProduct } from "../../services/product.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import Sheet from "../ui/Sheet";

const buildSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")).max(80),
    sku: z.string().optional(),
    category: z.string().optional(),
    purchasePrice: z.number().min(0, t("validation.notNegative")).optional(),
    sellingPrice: z.number().min(0, t("validation.notNegative")).optional(),
    stock: z.number().min(0, t("validation.notNegative")).optional(),
    minStock: z.number().min(0, t("validation.notNegative")).optional(),
    unit: z.string().optional(),
    imageUrl: z.string().optional(),
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
  onSuccess: (product: IProduct) => void;
  editing?: IProduct | null;
}

const ProductModal = ({ open, onClose, onSuccess, editing }: Props) => {
  const { activeBusiness } = useBusinessStore();
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();
  const schema = React.useMemo(() => buildSchema(t), [t]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", sku: "", category: "", purchasePrice: 0, sellingPrice: 0,
      stock: 0, minStock: 0, unit: "pcs", imageUrl: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: editing?.name ?? "",
      sku: editing?.sku ?? "",
      category: editing?.category ?? "",
      purchasePrice: editing?.purchasePrice ?? 0,
      sellingPrice: editing?.sellingPrice ?? 0,
      stock: editing?.stock ?? 0,
      minStock: editing?.minStock ?? 0,
      unit: editing?.unit ?? "pcs",
      imageUrl: editing?.imageUrl ?? "",
    });
  }, [open, editing, reset]);

  const onSubmit = async (data: FormData) => {
    if (!activeBusiness) return;
    setSubmitting(true);
    try {
      let result: IProduct;
      if (editing) {
        // stock isn't editable here — use "Adjust stock" for auditable changes
        result = await productService.update(editing._id, {
          name: data.name,
          sku: data.sku,
          category: data.category,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          minStock: data.minStock,
          unit: data.unit,
          imageUrl: data.imageUrl,
        });
        toast.success(t("product.updated"));
      } else {
        result = await productService.create({ ...data, businessId: activeBusiness._id });
        toast.success(t("product.created"));
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
    <Sheet open={open} onClose={onClose} size="md" title={editing ? t("product.edit") : t("product.add")}>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("product.name")} error={errors.name?.message}>
            <input {...register("name")} placeholder={t("product.namePlaceholder")} style={inputCss(!!errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("product.sku")} error={errors.sku?.message}>
              <input {...register("sku")} placeholder={t("product.skuPlaceholder")} style={inputCss()} />
            </Field>
            <Field label={t("product.category")} error={errors.category?.message}>
              <input {...register("category")} placeholder={t("product.categoryPlaceholder")} style={inputCss()} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("product.purchasePrice")} error={errors.purchasePrice?.message}>
              <input type="number" inputMode="decimal" min="0" step="0.01" {...register("purchasePrice", { valueAsNumber: true })}
                placeholder={t("common.zero")} style={inputCss(!!errors.purchasePrice)} />
            </Field>
            <Field label={t("product.sellingPrice")} error={errors.sellingPrice?.message}>
              <input type="number" inputMode="decimal" min="0" step="0.01" {...register("sellingPrice", { valueAsNumber: true })}
                placeholder={t("common.zero")} style={inputCss(!!errors.sellingPrice)} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {!editing && (
              <Field label={t("product.stock")} error={errors.stock?.message}>
                <input type="number" inputMode="decimal" min="0" {...register("stock", { valueAsNumber: true })}
                  placeholder={t("common.zero")} style={inputCss(!!errors.stock)} />
              </Field>
            )}
            <Field label={t("product.minStock")} error={errors.minStock?.message}>
              <input type="number" inputMode="decimal" min="0" {...register("minStock", { valueAsNumber: true })}
                placeholder={t("common.zero")} style={inputCss(!!errors.minStock)} />
            </Field>
            <Field label={t("product.unit")} error={errors.unit?.message}>
              <input {...register("unit")} placeholder={t("product.unitPlaceholder")} style={inputCss()} />
            </Field>
          </div>

          <Field label={t("product.imageUrl")} error={errors.imageUrl?.message}>
            <input {...register("imageUrl")} placeholder={t("product.urlPlaceholder")} style={inputCss()} />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold press disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {editing ? t("common.saveChanges") : t("product.add")}
          </button>
        </form>
    </Sheet>
  );
};

export default ProductModal;
