import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { purchaseService, type IPurchase } from "../../services/purchase.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { paymentMethodLabel } from "../../i18n/labels";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const STATUS_META: Record<string, { labelKey: string; color: string }> = {
  paid: { labelKey: "docStatus.paid", color: "#10b981" },
  partial: { labelKey: "docStatus.partial", color: "#f59e0b" },
  due: { labelKey: "docStatus.due", color: "#ef4444" },
};

const PurchaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const [purchase, setPurchase] = useState<IPurchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    purchaseService.getOne(id).then(setPurchase).catch(() => toast.error(t("purchase.loadOneFailed"))).finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("purchase.notFound")}</p>
      </div>
    );
  }

  const meta = STATUS_META[purchase.status];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <button onClick={() => navigate("/purchases")} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
          <ArrowLeft size={13} /> {t("purchase.backToPurchases")}
        </button>

        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
                {purchase.referenceNumber}
              </h1>
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                {t("purchase.dateAndSupplier", {
                  date: fmtDate(purchase.date),
                  supplier: purchase.supplier ? purchase.supplier.name : t("purchase.noSupplier"),
                })}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${meta.color}15`, color: meta.color }}
            >
              {t(meta.labelKey)}
            </span>
          </div>

          <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${C.border}` }}>
            {purchase.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
                style={{ borderBottom: i < purchase.items.length - 1 ? "1px solid var(--border-light)" : "none" }}
              >
                <div>
                  <p style={{ color: "var(--text-primary)" }}>{item.productName}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                    {t("sale.lineQty", { quantity: num(item.quantity), price: money(item.unitPrice) })}
                  </p>
                </div>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{money(item.lineTotal)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>{t("common.subtotal")}</span>
              <span style={{ color: "var(--text-primary)" }}>{money(purchase.subtotal)}</span>
            </div>
            {purchase.discount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>{t("common.discount")}</span>
                <span style={{ color: "var(--text-primary)" }}>{money(-purchase.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1.5" style={{ borderTop: `1px solid ${C.border}` }}>
              <span style={{ color: "var(--text-primary)" }}>{t("common.total")}</span>
              <span style={{ color: "var(--text-primary)" }}>{money(purchase.total)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>
                {t("sale.paidWithMethod", { method: paymentMethodLabel(t, purchase.paymentMethod) })}
              </span>
              <span style={{ color: "#10b981" }}>{money(purchase.paidAmount)}</span>
            </div>
            {purchase.dueAmount > 0 && (
              <div className="flex justify-between font-semibold">
                <span style={{ color: "#ef4444" }}>{t("purchase.payable")}</span>
                <span style={{ color: "#ef4444" }}>{money(purchase.dueAmount)}</span>
              </div>
            )}
          </div>

          {purchase.note && (
            <p className="text-xs mt-4 p-3 rounded-xl" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
              {purchase.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetailPage;
