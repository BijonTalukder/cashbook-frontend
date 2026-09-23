import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Check, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { productService, type IProduct } from "../../services/product.service";
import { categoryService, type ICategory } from "../../services/category.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { TFunction } from "../../i18n/useTranslation";
import Sheet from "../ui/Sheet";
import ImageUploader from "./ImageUploader";
import { haptic } from "../../native/bridge";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const { t } = useTranslation();
  const schema = React.useMemo(() => buildSchema(t), [t]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", sku: "", category: "", purchasePrice: 0, sellingPrice: 0,
      stock: 0, minStock: 0, unit: "pcs", imageUrl: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setUploadingImage(false);
    setIsAddingCategory(false);
    setNewCategoryName("");
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

    if (activeBusiness?._id) {
      setLoadingCategories(true);
      categoryService
        .getByBusiness(activeBusiness._id)
        .then((data) => setCategories(data || []))
        .catch(() => {})
        .finally(() => setLoadingCategories(false));
    }
  }, [open, editing, reset, activeBusiness]);

  const currentCategory = watch("category");

  const categoryOptions = React.useMemo(() => {
    const list = [...categories];
    if (
      currentCategory &&
      !list.some((c) => c.name.toLowerCase() === currentCategory.toLowerCase())
    ) {
      list.unshift({ _id: `custom-${currentCategory}`, name: currentCategory });
    }
    return list;
  }, [categories, currentCategory]);

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || !activeBusiness) return;

    setCreatingCategory(true);
    haptic("light");
    try {
      const created = await categoryService.create({
        name,
        businessId: activeBusiness._id,
      });

      setCategories((prev) => {
        if (prev.some((c) => c.name.toLowerCase() === created.name.toLowerCase())) {
          return prev;
        }
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });

      setValue("category", created.name, { shouldValidate: true, shouldDirty: true });
      haptic("success");
      toast.success(t("product.categoryCreated"));
      setNewCategoryName("");
      setIsAddingCategory(false);
    } catch (err: unknown) {
      haptic("error");
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("common.unknownError");
      toast.error(msg);
    } finally {
      setCreatingCategory(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!activeBusiness) return;
    setSubmitting(true);
    haptic("medium");
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
        haptic("success");
        toast.success(t("product.updated"));
      } else {
        result = await productService.create({ ...data, businessId: activeBusiness._id });
        haptic("success");
        toast.success(t("product.created"));
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      haptic("error");
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("common.unknownError");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="md"
      title={editing ? t("product.edit") : t("product.add")}
      footer={
        <button
          form="product-modal-form"
          type="submit"
          disabled={submitting || uploadingImage}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold press disabled:opacity-60"
          style={{ background: "#10b981", color: "#022c22" }}
        >
          {(submitting || uploadingImage) && <Loader2 size={14} className="animate-spin" />}
          {uploadingImage
            ? t("product.uploading")
            : editing
            ? t("common.saveChanges")
            : t("product.add")}
        </button>
      }
    >
      <form id="product-modal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t("product.name")} error={errors.name?.message}>
          <input {...register("name")} placeholder={t("product.namePlaceholder")} style={inputCss(!!errors.name)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("product.sku")} error={errors.sku?.message}>
            <input {...register("sku")} placeholder={t("product.skuPlaceholder")} style={inputCss()} />
          </Field>
          <Field label={t("product.category")} error={errors.category?.message}>
            {!isAddingCategory ? (
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <select
                    {...register("category")}
                    disabled={submitting}
                    style={{
                      ...inputCss(!!errors.category),
                      paddingRight: "30px",
                    }}
                    className="appearance-none cursor-pointer truncate"
                  >
                    <option value="">
                      {loadingCategories ? t("common.loading") : t("product.selectCategory")}
                    </option>
                    {categoryOptions.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ChevronDown size={14} />
                  </div>
                </div>
                <button
                  type="button"
                  title={t("product.addCategory")}
                  onClick={() => {
                    haptic("selection");
                    setIsAddingCategory(true);
                    setNewCategoryName("");
                  }}
                  disabled={submitting}
                  className="flex-shrink-0 w-10 h-[42px] rounded-xl flex items-center justify-center press transition-all"
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleCreateCategory();
                    } else if (e.key === "Escape") {
                      setIsAddingCategory(false);
                    }
                  }}
                  placeholder={t("product.newCategoryPlaceholder")}
                  disabled={creatingCategory}
                  style={{
                    ...inputCss(),
                    padding: "8px 10px",
                    fontSize: "13px",
                  }}
                  className="min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateCategory()}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="flex-shrink-0 w-8 h-[38px] rounded-lg flex items-center justify-center press disabled:opacity-50"
                  style={{ background: "#10b981", color: "#022c22" }}
                  title="Add"
                >
                  {creatingCategory ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic("light");
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                  }}
                  disabled={creatingCategory}
                  className="flex-shrink-0 w-8 h-[38px] rounded-lg flex items-center justify-center press"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                  }}
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            )}
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

        <Field label={t("product.uploadImage")} error={errors.imageUrl?.message}>
          <ImageUploader
            value={watch("imageUrl")}
            onChange={(url) => setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true })}
            onUploadingChange={setUploadingImage}
            disabled={submitting}
          />
        </Field>
      </form>
    </Sheet>
  );
};

export default ProductModal;
