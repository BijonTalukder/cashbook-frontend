import { useBusinessStore } from "../../store/businessStore";

interface Props {
  /** Override the active business (used by tests / previews). */
  business?: {
    name?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
  } | null;
  /** Right-aligned label, e.g. "Profit & Loss" or "Sales Report". */
  reportTitle: string;
  /** Sub-line under the title on the right, e.g. an invoice/period id. */
  reportMeta?: string;
  /** Compact rendering for embedding inside other layouts. */
  compact?: boolean;
}

/**
 * Reusable header used at the top of every downloadable report / invoice.
 *
 * Renders the active business's logo (if uploaded) + business name + phone
 * + address on the left, and the report title + meta on the right. It is
 * screen-readable but every value is laid out so it survives both
 * `window.print()` (browser → "Save as PDF") and being screenshotted into a
 * PDF.
 *
 * All business types render the same — `name` is required, `logoUrl`,
 * `phone`, and `address` are optional and simply disappear when missing.
 */
const ReportHeader = ({ business, reportTitle, reportMeta, compact = false }: Props) => {
  const { activeBusiness } = useBusinessStore();
  const biz = business ?? activeBusiness;

  return (
    <div
      className={`flex items-start justify-between ${compact ? "pb-3 mb-4" : "pb-4 mb-6"}`}
      style={{ borderBottom: "1px solid #e5e7eb" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {biz?.logoUrl ? (
          <img
            src={biz.logoUrl}
            alt=""
            crossOrigin="anonymous"
            loading="eager"
            className={`${compact ? "w-8 h-8" : "w-12 h-12"} rounded-xl object-cover flex-shrink-0`}
          />
        ) : (
          <div
            className={`${compact ? "w-8 h-8" : "w-12 h-12"} rounded-xl flex items-center justify-center flex-shrink-0`}
            style={{ background: "#10b981", color: "#022c22", fontWeight: 700 }}
          >
            {biz?.name?.[0]?.toUpperCase() ?? "•"}
          </div>
        )}
        <div className="min-w-0">
          <h1
            className={`${compact ? "text-base" : "text-xl"} font-bold truncate`}
            style={{ fontFamily: "'DM Serif Display', serif", color: "#111827" }}
          >
            {biz?.name ?? "—"}
          </h1>
          {biz?.phone && (
            <p className="text-[11px] text-gray-500 truncate">{biz.phone}</p>
          )}
          {biz?.address && (
            <p className="text-[11px] text-gray-500 truncate">{biz.address}</p>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <h2 className={`${compact ? "text-sm" : "text-lg"} font-bold text-gray-700`}>
          {reportTitle}
        </h2>
        {reportMeta && (
          <p className="text-[11px] text-gray-500">{reportMeta}</p>
        )}
      </div>
    </div>
  );
};

export default ReportHeader;
