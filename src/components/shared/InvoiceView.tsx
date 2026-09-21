import { ArrowLeft, Printer, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import ReportHeader from "./ReportHeader";
import type { ISale } from "../../services/sale.service";
import type { IPurchase } from "../../services/purchase.service";

/**
 * Unified shape used by both sales and purchase invoices. The two source
 * types have the same financial fields; only the party (customer vs
 * supplier) and the document number label differ.
 */
export type InvoiceDoc =
  | ({ kind: "sale" } & ISale)
  | ({ kind: "purchase" } & IPurchase);

interface Props {
  doc: InvoiceDoc | null;
  loading: boolean;
  /** Back URL the "← Back" button uses. */
  backTo: string;
}

const InvoiceView = ({ doc, loading, backTo }: Props) => {
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>{t("invoice.notFound")}</p>
      </div>
    );
  }

  const isSale = doc.kind === "sale";
  const number = isSale ? doc.invoiceNumber : doc.referenceNumber;
  const party = isSale ? doc.customer : doc.supplier;
  const partyLabel = isSale ? t("invoice.billedTo") : t("invoice.billedFrom");
  const headingText = isSale ? t("invoice.heading") : t("invoice.headingPurchase");

  const handleBack = () => {
    window.location.href = backTo;
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${headingText} ${number}`, url });
      } catch {
        // user cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t("invoice.linkCopied"));
    }
  };

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
          <button
            onClick={handleBack}
            className="hidden lg:flex items-center gap-1.5 text-xs press"
            style={{ color: "var(--text-faint)" }}
          >
            <ArrowLeft size={13} /> {t("common.back")}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <Share2 size={13} /> {t("common.share")}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <Download size={13} /> {t("common.download")}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "#10b981", color: "#022c22" }}
            >
              <Printer size={13} /> {t("common.print")}
            </button>
          </div>
        </div>

        {/* Invoice paper — shared ReportHeader pulls logo + business name + phone
            + address automatically from the active business, so any business
            type renders correctly. */}
        <div
          className="invoice-paper rounded-2xl p-8"
          style={{ background: "#ffffff", border: "1px solid var(--border)", color: "#111827" }}
        >
          <ReportHeader
            business={activeBusiness ?? undefined}
            reportTitle={headingText}
            reportMeta={number}
          />

          {party && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{partyLabel}</p>
              <p className="text-sm font-medium">{party.name}</p>
              {party.phone && <p className="text-xs text-gray-500">{party.phone}</p>}
            </div>
          )}

          <div className="mb-4 text-xs text-gray-500">
            <span>{fmtDate(doc.date)}</span>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 text-xs">
                <th className="py-2 font-medium">{t("invoice.item")}</th>
                <th className="py-2 font-medium text-center">{t("invoice.qty")}</th>
                <th className="py-2 font-medium text-right">{t("invoice.price")}</th>
                <th className="py-2 font-medium text-right">{t("invoice.lineTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2.5">{item.productName}</td>
                  <td className="py-2.5 text-center">{num(item.quantity)}</td>
                  <td className="py-2.5 text-right">{money(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-medium">{money(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-56 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("common.subtotal")}</span>
                <span>{money(doc.subtotal)}</span>
              </div>
              {doc.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("common.discount")}</span>
                  <span>{money(-doc.discount)}</span>
                </div>
              )}
              {isSale && doc.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("sale.tax")}</span>
                  <span>{money(doc.tax, { signed: true })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1.5 border-t border-gray-200">
                <span>{t("common.total")}</span>
                <span>{money(doc.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("common.paid")}</span>
                <span>{money(doc.paidAmount)}</span>
              </div>
              {doc.dueAmount > 0 && (
                <div className="flex justify-between font-semibold text-red-600">
                  <span>{t("common.due")}</span>
                  <span>{money(doc.dueAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {doc.note && (
            <p className="mt-6 text-xs text-gray-500 border-t border-gray-100 pt-4">{doc.note}</p>
          )}

          <p className="mt-8 text-center text-[11px] text-gray-400">{t("invoice.thankYou")}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
