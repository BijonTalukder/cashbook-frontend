import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productService, type IProduct } from "../../services/product.service";
import { useBusinessStore } from "../../store/businessStore";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  sku: z.string().optional(),
  category: z.string().optional(),
  purchasePrice: z.number().min(0, "Cannot be negative").optional(),
  sellingPrice: z.number().min(0, "Cannot be negative").optional(),
  stock: z.number().min(0, "Cannot be negative").optional(),
  minStock: z.number().min(0, "Cannot be negative").optional(),
  unit: z.string().optional(),
  imageUrl: z.string().optional(),
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
  onSuccess: (product: IProduct) => void;
  editing?: IProduct | null;
}

const ProductModal = ({ open, onClose, onSuccess, editing }: Props) => {
  const { activeBusiness } = useBusinessStore();
  const [submitting, setSubmitting] = useState(false);

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
        toast.success("Product updated");
      } else {
        result = await productService.create({ ...data, businessId: activeBusiness._id });
        toast.success("Product added");
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
            {editing ? "Edit Product" : "Add Product"}
          </h2>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <Field label="Product name" error={errors.name?.message}>
            <input {...register("name")} placeholder="e.g. Rice 5kg" style={inputCss(!!errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU (optional)" error={errors.sku?.message}>
              <input {...register("sku")} placeholder="SKU-001" style={inputCss()} />
            </Field>
            <Field label="Category (optional)" error={errors.category?.message}>
              <input {...register("category")} placeholder="e.g. Grocery" style={inputCss()} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase price" error={errors.purchasePrice?.message}>
              <input type="number" min="0" step="0.01" {...register("purchasePrice", { valueAsNumber: true })}
                placeholder="0" style={inputCss(!!errors.purchasePrice)} />
            </Field>
            <Field label="Selling price" error={errors.sellingPrice?.message}>
              <input type="number" min="0" step="0.01" {...register("sellingPrice", { valueAsNumber: true })}
                placeholder="0" style={inputCss(!!errors.sellingPrice)} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {!editing && (
              <Field label="Stock" error={errors.stock?.message}>
                <input type="number" min="0" {...register("stock", { valueAsNumber: true })}
                  placeholder="0" style={inputCss(!!errors.stock)} />
              </Field>
            )}
            <Field label="Min stock" error={errors.minStock?.message}>
              <input type="number" min="0" {...register("minStock", { valueAsNumber: true })}
                placeholder="0" style={inputCss(!!errors.minStock)} />
            </Field>
            <Field label="Unit" error={errors.unit?.message}>
              <input {...register("unit")} placeholder="pcs" style={inputCss()} />
            </Field>
          </div>

          <Field label="Image URL (optional)" error={errors.imageUrl?.message}>
            <input {...register("imageUrl")} placeholder="https://..." style={inputCss()} />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {editing ? "Save Changes" : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
