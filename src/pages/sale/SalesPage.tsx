import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ShoppingCart, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { saleService, type ISale } from "../../services/sale.service";
import { useBusinessStore } from "../../store/businessStore";
import SyncBadge from "../../components/shared/SyncBadge";
import { useDataVersion } from "../../store/offlineStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { plural } from "../../i18n/labels";
import { useRefreshHandler } from "../../native/refresh";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const STATUS_META: Record<string, { labelKey: string; color: string }> = {
  paid: { labelKey: "docStatus.paid", color: "#10b981" },
  partial: { labelKey: "docStatus.partial", color: "#f59e0b" },
  due: { labelKey: "docStatus.due", color: "#ef4444" },
};

const SalesPage = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();
  const dataVersion = useDataVersion();

  const [sales, setSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await saleService.getAll(activeBusiness._id, { limit: "50" });
      setSales(data.sales);
    } catch {
      toast.error(t("sale.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);


  useEffect(() => { load(); }, [activeBusiness?._id, dataVersion]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {t("sale.title")}
          </h1>
          <button
            onClick={() => navigate("/sales/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold press"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            <Plus size={15} /> {t("sale.add")}
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <ShoppingCart size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("sale.empty")}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("sale.emptyHint")}</p>
            </div>
          ) : (
            sales.map((s) => {
              const meta = STATUS_META[s.status];
              const handleDownloadInvoice = (e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                navigate(`/sales/${s._id}/invoice`);
              };
              return (
                <button
                  key={s._id}
                  onClick={() => navigate(`/sales/${s._id}`)}
                  className="row-press w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left"
                  style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {t("sale.headline", {
                          invoice: s.invoiceNumber,
                          customer: s.customer?.name ?? t("sale.walkIn"),
                        })}
                      </p>
                      <SyncBadge status={s.syncStatus} compact />
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                      {t("common.dateAndItems", {
                        date: fmtDate(s.date, "short"),
                        items: plural(t, "common.itemCount", s.items.length, { count: num(s.items.length) }),
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {money(s.total)}
                    </p>
                    <p className="text-[10px] font-medium" style={{ color: meta.color }}>{t(meta.labelKey)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    aria-label={t("common.download")}
                    title={t("invoice.downloadInvoice")}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center press"
                    style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                  >
                    <Download size={15} />
                  </button>
                  <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
