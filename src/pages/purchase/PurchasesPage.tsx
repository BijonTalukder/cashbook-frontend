import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, ChevronRight, Download, Search, Truck } from "lucide-react";
import { purchaseService, type IPurchase } from "../../services/purchase.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { plural } from "../../i18n/labels";
import { useRefreshHandler } from "../../native/refresh";
import LoadFailedState from "../../components/shared/LoadFailedState";
import { toastLoadFailure } from "../../offline/notify";
import { NativeCard } from "../../components/ui/Card";
import { NativeInput } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { haptic } from "../../native/bridge";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger"> = {
  paid: "success",
  partial: "warning",
  due: "danger",
};

const PurchasesPage = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Pull down on this screen to re-fetch
  useRefreshHandler(load);

  useEffect(() => {
    load();
  }, [activeBusiness?._id]);

  // Filter purchases by search query
  const filteredPurchases = useMemo(() => {
    if (!searchQuery.trim()) return purchases;
    const q = searchQuery.toLowerCase();
    return purchases.filter((p) => {
      const refMatch = p.referenceNumber.toLowerCase().includes(q);
      const supplierMatch = p.supplier?.name.toLowerCase().includes(q);
      return refMatch || supplierMatch;
    });
  }, [purchases, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 text-neutral-900 dark:text-neutral-100">
      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("purchase.title")}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {activeBusiness?.name}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              haptic("light");
              navigate("/purchases/new");
            }}
            className="gap-1.5 shadow-sm shadow-emerald-500/20 active:scale-95"
          >
            <Plus size={16} />
            <span>{t("purchase.add")}</span>
          </Button>
        </div>

        {/* Search Bar (if has purchases) */}
        {purchases.length > 0 && (
          <NativeInput
            placeholder="Search by invoice # or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            leadingIcon={<Search className="w-4 h-4 text-neutral-400" />}
          />
        )}

        {/* List Content */}
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse bg-neutral-200/60 dark:bg-neutral-800/60"
              />
            ))}
          </div>
        ) : failed ? (
          <LoadFailedState onRetry={load} />
        ) : purchases.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t("purchase.empty")}
            description={t("purchase.emptyHint")}
            actionLabel={t("purchase.add")}
            onAction={() => {
              haptic("light");
              navigate("/purchases/new");
            }}
          />
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              No purchases match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredPurchases.map((p) => {
              const variant = STATUS_VARIANTS[p.status] || "neutral";
              const handleDownloadInvoice = (e: React.MouseEvent) => {
                e.stopPropagation();
                haptic("light");
                navigate(`/purchases/${p._id}/invoice`);
              };

              return (
                <NativeCard
                  key={p._id}
                  variant="elevated"
                  interactive
                  onClick={() => {
                    haptic("light");
                    navigate(`/purchases/${p._id}`);
                  }}
                  className="p-3.5 sm:p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                        {p.supplier?.name || t("purchase.noSupplier")}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        #{p.referenceNumber}
                      </span>
                    </div>
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {fmtDate(p.date, "short")} •{" "}
                      {plural(t, "common.itemCount", p.items.length, {
                        count: num(p.items.length),
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100">
                      {money(p.total)}
                    </p>
                    <div className="mt-1 flex justify-end">
                      <Badge variant={variant} size="sm">
                        {t(`docStatus.${p.status}`)}
                      </Badge>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    aria-label={t("common.download")}
                    title={t("invoice.downloadInvoice")}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 active:scale-95 transition-all shrink-0"
                  >
                    <Download size={16} />
                  </button>

                  <ChevronRight size={16} className="text-neutral-400 shrink-0" />
                </NativeCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesPage;
