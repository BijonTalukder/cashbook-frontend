import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, ChevronRight, Download } from "lucide-react";
import { purchaseService, type IPurchase } from "../../services/purchase.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { plural } from "../../i18n/labels";
import { useRefreshHandler } from "../../native/refresh";
import LoadFailedState from "../../components/shared/LoadFailedState";
import { toastLoadFailure } from "../../offline/notify";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const STATUS_META: Record<string, { labelKey: string; color: string }> = {
  paid: { labelKey: "docStatus.paid", color: "#10b981" },
  partial: { labelKey: "docStatus.partial", color: "#f59e0b" },
  due: { labelKey: "docStatus.due", color: "#ef4444" },
};

const PurchasesPage = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await purchaseService.getAll(activeBusiness._id, { limit: "50" });
      setPurchases(data.purchases);
      setFailed(false);
    } catch {
      setFailed(true);
      toastLoadFailure(t("purchase.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);


  useEffect(() => { load(); }, [activeBusiness?._id]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {t("purchase.title")}
          </h1>
          <button
            onClick={() => navigate("/purchases/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold press"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            <Plus size={15} /> {t("purchase.add")}
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : failed ? (
            <LoadFailedState onRetry={load} />
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <Package size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("purchase.empty")}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t("purchase.emptyHint")}</p>
            </div>
          ) : (
            purchases.map((p) => {
              const meta = STATUS_META[p.status];
              const handleDownloadInvoice = (e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                navigate(`/purchases/${p._id}/invoice`);
              };
              return (
                <button
                  key={p._id}
                  onClick={() => navigate(`/purchases/${p._id}`)}
                  className="row-press w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left"
                  style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {p.supplier
                        ? t("purchase.headline", { reference: p.referenceNumber, supplier: p.supplier.name })
                        : t("purchase.headlineNoSupplier", { reference: p.referenceNumber })}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                      {t("common.dateAndItems", {
                        date: fmtDate(p.date, "short"),
                        items: plural(t, "common.itemCount", p.items.length, { count: num(p.items.length) }),
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {money(p.total)}
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

export default PurchasesPage;
