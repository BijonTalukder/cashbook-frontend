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
import { haptic } from "../../native/bridge";

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
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100">
      <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-4">
        {/* Header section with native hierarchy */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              {t("sale.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {num(sales.length)}টি বিক্রয় চালান
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic("medium");
              navigate("/sales/new");
            }}
            className="flex items-center gap-2 px-4 h-11 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white shadow-md shadow-emerald-600/20 shrink-0 select-none"
          >
            <Plus size={16} />
            <span>{t("sale.add")}</span>
          </button>
        </div>

        {/* List Surface */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-slate-100 dark:bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                <ShoppingCart size={22} />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {t("sale.empty")}
              </p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-sm">
                {t("sale.emptyHint")}
              </p>
            </div>
          ) : (
            sales.map((s) => {
              const meta = STATUS_META[s.status] || STATUS_META.paid;
              const handleDownloadInvoice = (e: React.MouseEvent) => {
                e.stopPropagation();
                haptic("light");
                navigate(`/sales/${s._id}/invoice`);
              };

              const badgeColor =
                s.status === "paid"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60"
                  : s.status === "partial"
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60";

              return (
                <div
                  key={s._id}
                  onClick={() => {
                    haptic("light");
                    navigate(`/sales/${s._id}`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/sales/${s._id}`);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors select-none cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">
                        {t("sale.headline", {
                          invoice: s.invoiceNumber,
                          customer: s.customer?.name ?? t("sale.walkIn"),
                        })}
                      </p>
                      <SyncBadge status={s.syncStatus} compact />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                      {t("common.dateAndItems", {
                        date: fmtDate(s.date, "short"),
                        items: plural(t, "common.itemCount", s.items.length, {
                          count: num(s.items.length),
                        }),
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-slate-900 dark:text-neutral-100">
                      {money(s.total)}
                    </p>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}
                    >
                      {t(meta.labelKey)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    aria-label={t("common.download")}
                    title={t("invoice.downloadInvoice")}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 active:scale-95 transition-all shrink-0"
                  >
                    <Download size={15} />
                  </button>

                  <ChevronRight
                    size={16}
                    className="text-slate-300 dark:text-neutral-600 shrink-0"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
