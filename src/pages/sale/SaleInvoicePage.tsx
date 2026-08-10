import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { saleService, type ISale } from "../../services/sale.service";
import { useBusinessStore } from "../../store/businessStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });

const SaleInvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;

  const [sale, setSale] = useState<ISale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    saleService.getOne(id).then(setSale).catch(() => toast.error("Failed to load invoice")).finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice ${sale?.invoiceNumber}`, url });
      } catch {
        // user cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Invoice link copied");
    }
  };

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
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .invoice-paper { box-shadow: none !important; border: none !important; margin: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <div className="no-print flex items-center justify-between">
          <button onClick={() => navigate(`/sales/${sale._id}`)} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
            <ArrowLeft size={13} /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <Share2 size={13} /> Share
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <Download size={13} /> Download
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "#10b981", color: "#022c22" }}
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* Invoice paper */}
        <div className="invoice-paper rounded-2xl p-8" style={{ background: "#ffffff", border: "1px solid var(--border)", color: "#111827" }}>
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              {activeBusiness?.logoUrl && (
                <img src={activeBusiness.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
              )}
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {activeBusiness?.name}
                </h1>
                {activeBusiness?.phone && <p className="text-xs text-gray-500">{activeBusiness.phone}</p>}
                {activeBusiness?.address && <p className="text-xs text-gray-500">{activeBusiness.address}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-700">INVOICE</h2>
              <p className="text-xs text-gray-500">{sale.invoiceNumber}</p>
              <p className="text-xs text-gray-500">{fmtDate(sale.date)}</p>
            </div>
          </div>

          {sale.customer && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Billed to</p>
              <p className="text-sm font-medium">{sale.customer.name}</p>
              {sale.customer.phone && <p className="text-xs text-gray-500">{sale.customer.phone}</p>}
            </div>
          )}

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 text-xs">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium text-center">Qty</th>
                <th className="py-2 font-medium text-right">Price</th>
                <th className="py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2.5">{item.productName}</td>
                  <td className="py-2.5 text-center">{item.quantity}</td>
                  <td className="py-2.5 text-right">{currencySymbol}{fmt(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-medium">{currencySymbol}{fmt(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-56 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{currencySymbol}{fmt(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span>-{currencySymbol}{fmt(sale.discount)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>+{currencySymbol}{fmt(sale.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span>{currencySymbol}{fmt(sale.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid</span>
                <span>{currencySymbol}{fmt(sale.paidAmount)}</span>
              </div>
              {sale.dueAmount > 0 && (
                <div className="flex justify-between font-semibold text-red-600">
                  <span>Due</span>
                  <span>{currencySymbol}{fmt(sale.dueAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {sale.note && (
            <p className="mt-6 text-xs text-gray-500 border-t border-gray-100 pt-4">{sale.note}</p>
          )}

          <p className="mt-8 text-center text-[11px] text-gray-400">Thank you for your business</p>
        </div>
      </div>
    </div>
  );
};

export default SaleInvoicePage;
