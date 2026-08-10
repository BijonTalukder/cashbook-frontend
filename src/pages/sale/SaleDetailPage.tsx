import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { saleService, type ISale } from "../../services/sale.service";
import { useBusinessStore } from "../../store/businessStore";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_META: Record<string, { label: string; color: string }> = {
  paid: { label: "Paid", color: "#10b981" },
  partial: { label: "Partial", color: "#f59e0b" },
  due: { label: "Due", color: "#ef4444" },
};

const SaleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;

  const [sale, setSale] = useState<ISale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    saleService.getOne(id).then(setSale).catch(() => toast.error("Failed to load sale")).finally(() => setLoading(false));
  }, [id]);

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
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>Sale not found</p>
      </div>
    );
  }

  const meta = STATUS_META[sale.status];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/sales")} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
            <ArrowLeft size={13} /> Back to Sales
          </button>
          <button
            onClick={() => navigate(`/sales/${sale._id}/invoice`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-muted)" }}
          >
            <FileText size={13} /> View Invoice
          </button>
        </div>

        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
                {sale.invoiceNumber}
              </h1>
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                {fmtDate(sale.date)} · {sale.customer ? sale.customer.name : "Walk-in customer"}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${meta.color}15`, color: meta.color }}
            >
              {meta.label}
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
                    {item.quantity} × {currencySymbol}{fmt(item.unitPrice)}
                  </p>
                </div>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{currencySymbol}{fmt(item.lineTotal)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
              <span style={{ color: "var(--text-primary)" }}>{currencySymbol}{fmt(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Discount</span>
                <span style={{ color: "var(--text-primary)" }}>-{currencySymbol}{fmt(sale.discount)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Tax</span>
                <span style={{ color: "var(--text-primary)" }}>+{currencySymbol}{fmt(sale.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1.5" style={{ borderTop: `1px solid ${C.border}` }}>
              <span style={{ color: "var(--text-primary)" }}>Total</span>
              <span style={{ color: "var(--text-primary)" }}>{currencySymbol}{fmt(sale.total)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Paid ({sale.paymentMethod})</span>
              <span style={{ color: "#10b981" }}>{currencySymbol}{fmt(sale.paidAmount)}</span>
            </div>
            {sale.dueAmount > 0 && (
              <div className="flex justify-between font-semibold">
                <span style={{ color: "#ef4444" }}>Due</span>
                <span style={{ color: "#ef4444" }}>{currencySymbol}{fmt(sale.dueAmount)}</span>
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
