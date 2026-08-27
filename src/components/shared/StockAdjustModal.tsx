import { useState } from "react";
import { Loader2, Plus, Minus, Equal } from "lucide-react";
import { toast } from "sonner";
import { productService, type IProduct } from "../../services/product.service";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import Sheet from "../ui/Sheet";

const C = {
  overlay: "var(--overlay-scrim)", card: "var(--bg-elevated)",
  border: "var(--border)", input: "var(--surface-2)",
  inputBorder: "var(--border-strong)",
};

const TYPES = [
  { value: "increase" as const, labelKey: "stock.increase", icon: Plus, color: "#10b981" },
  { value: "decrease" as const, labelKey: "stock.decrease", icon: Minus, color: "#ef4444" },
  { value: "set" as const, labelKey: "stock.setTo", icon: Equal, color: "#3b82f6" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (product: IProduct) => void;
  product: IProduct | null;
}

const StockAdjustModal = ({ open, onClose, onSuccess, product }: Props) => {
  const [type, setType] = useState<"increase" | "decrease" | "set">("increase");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();
  const { num } = useFormat();

  if (!open || !product) return null;

  const handleSubmit = async () => {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error(t("stock.invalidQuantity"));
      return;
    }
    setSubmitting(true);
    try {
      const updated = await productService.adjustStock(product._id, type, qty);
      toast.success(t("stock.updated"));
      onSuccess(updated);
      setQuantity("");
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? t("stock.failed");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} size="sm" title={t("stock.adjust")}>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "var(--surface-2)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{product.name}</span>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("stock.current", { stock: num(product.stock), unit: product.unit ?? "" })}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ value, labelKey, icon: Icon, color }) => {
              const active = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all"
                  style={{
                    background: active ? `${color}15` : "var(--surface-2)",
                    borderColor: active ? `${color}55` : C.border,
                    color: active ? color : "var(--text-muted)",
                  }}
                >
                  <Icon size={15} />
                  <span className="text-[11px] font-medium">{t(labelKey)}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              {type === "set" ? t("stock.newQuantity") : t("stock.quantity")}
            </label>
            <input
              type="number" inputMode="decimal" min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t("common.zero")}
              style={{
                width: "100%", background: C.input, border: `1px solid ${C.inputBorder}`,
                borderRadius: "12px", padding: "10px 14px", color: "var(--text-primary)",
                fontSize: "14px", outline: "none",
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold press disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {t("stock.update")}
          </button>
        </div>
    </Sheet>
  );
};

export default StockAdjustModal;
