import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { saleService, type ISale } from "../../services/sale.service";
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

const SaleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const [sale, setSale] = useState<ISale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    saleService.getOne(id).then(setSale).catch(() => toast.error(t("sale.loadOneFailed"))).finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("sale.notFound")}</p>
      </div>
    );
  }

  const meta = STATUS_META[sale.status];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/sales")} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
            <ArrowLeft size={13} /> {t("sale.backToSales")}
          </button>
          <button
            onClick={() => navigate(`/sales/${sale._id}/invoice`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-muted)" }}
          >
            <FileText size={13} /> {t("sale.viewInvoice")}
          </button>
        </div>

        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
                {sale.invoiceNumber}
              </h1>
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                {t("sale.dateAndCustomer", {
                  date: fmtDate(sale.date),
                  customer: sale.customer ? sale.customer.name : t("sale.walkInCustomer"),
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
            {sale.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
                style={{ borderBottom: i < sale.items.length - 1 ? "1px solid var(--border-light)" : "none" }}
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
              <span style={{ color: "var(--text-primary)" }}>{money(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>{t("common.discount")}</span>
                <span style={{ color: "var(--text-primary)" }}>{money(-sale.discount)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>{t("sale.tax")}</span>
                <span style={{ color: "var(--text-primary)" }}>{money(sale.tax, { signed: true })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1.5" style={{ borderTop: `1px solid ${C.border}` }}>
              <span style={{ color: "var(--text-primary)" }}>{t("common.total")}</span>
              <span style={{ color: "var(--text-primary)" }}>{money(sale.total)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>
                {t("sale.paidWithMethod", { method: paymentMethodLabel(t, sale.paymentMethod) })}
              </span>
              <span style={{ color: "#10b981" }}>{money(sale.paidAmount)}</span>
            </div>
            {sale.dueAmount > 0 && (
              <div className="flex justify-between font-semibold">
                <span style={{ color: "#ef4444" }}>{t("common.due")}</span>
                <span style={{ color: "#ef4444" }}>{money(sale.dueAmount)}</span>
              </div>
            )}
          </div>

          {sale.note && (
            <p className="text-xs mt-4 p-3 rounded-xl" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
              {sale.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaleDetailPage;
