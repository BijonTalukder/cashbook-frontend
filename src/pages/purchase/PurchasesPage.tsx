import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, ChevronRight, Download, Search, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import { purchaseService, type IPurchase } from "../../services/purchase.service";
import { useBusinessStore } from "../../store/businessStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { plural } from "../../i18n/labels";
import { useRefreshHandler } from "../../native/refresh";
import LoadFailedState from "../../components/shared/LoadFailedState";
import { toastLoadFailure } from "../../offline/notify";
import { NativeInput } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { haptic } from "../../native/bridge";

type StatusFilter = "all" | "due" | "paid" | "partial";

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  paid: {
    label: "পরিশোধিত",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
  },
  partial: {
    label: "আংশিক বকেয়া",
    badgeClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60",
  },
  due: {
    label: "বকেয়া",
    badgeClass: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60",
  },
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  // Financial statistics
  const stats = useMemo(() => {
    let totalPurchases = 0;
    let totalPaid = 0;
    let totalDue = 0;
    for (const p of purchases) {
      totalPurchases += p.total || 0;
      totalPaid += p.paidAmount || 0;
      totalDue += p.dueAmount || 0;
    }
    return {
      totalPurchases,
      totalPaid,
      totalDue,
      count: purchases.length,
    };
  }, [purchases]);

  // Filter purchases by search query and status
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const refMatch = p.referenceNumber.toLowerCase().includes(q);
      const supplierMatch = p.supplier?.name.toLowerCase().includes(q);
      return refMatch || supplierMatch;
    });
  }, [purchases, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-28 text-slate-900 dark:text-neutral-100">
      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              {t("purchase.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {num(stats.count)}টি ক্রয় চালান
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              navigate("/purchases/new");
            }}
            className="flex items-center gap-2 px-4 h-11 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white shadow-md shadow-emerald-600/20 shrink-0 select-none"
          >
            <Plus size={16} />
            <span>{t("purchase.add")}</span>
          </button>
        </div>

        {/* Financial KPI Summary Cards */}
        {purchases.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 mb-1">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] sm:text-xs font-semibold truncate">মোট ক্রয়</span>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-neutral-100 truncate">
                {money(stats.totalPurchases)}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-rose-200/60 dark:border-rose-900/40 shadow-xs">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs font-semibold truncate">বকেয়া দেনা</span>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 truncate">
                {money(stats.totalDue)}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs font-semibold truncate">পরিশোধ</span>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
                {money(stats.totalPaid)}
              </p>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        {purchases.length > 0 && (
          <div className="space-y-2.5">
            <NativeInput
              placeholder="চালান নম্বর বা সরবরাহকারী খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              leadingIcon={<Search className="w-4 h-4 text-slate-400" />}
            />

            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: "all", label: "সকল" },
                  { id: "due", label: "বকেয়া চালান" },
                  { id: "partial", label: "আংশিক" },
                  { id: "paid", label: "পরিশোধিত" },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      haptic("selection");
                      setStatusFilter(tab.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                      active
                        ? "bg-slate-900 dark:bg-neutral-100 text-white dark:text-slate-900 shadow-sm"
                        : "bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-3xl animate-pulse bg-slate-100 dark:bg-neutral-800"
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
          <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800">
            <p className="text-sm font-semibold text-slate-600 dark:text-neutral-400">
              কোনো ক্রয় পাওয়া যায়নি
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
            {filteredPurchases.map((p) => {
              const meta = STATUS_META[p.status] || STATUS_META.paid;
              const handleDownloadInvoice = (e: React.MouseEvent) => {
                e.stopPropagation();
                haptic("light");
                navigate(`/purchases/${p._id}/invoice`);
              };

              return (
                <div
                  key={p._id}
                  onClick={() => {
                    haptic("light");
                    navigate(`/purchases/${p._id}`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/purchases/${p._id}`);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors select-none cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate text-slate-900 dark:text-neutral-100">
                        {p.supplier?.name || t("purchase.noSupplier")}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                        #{p.referenceNumber}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-neutral-400 mt-0.5">
                      {fmtDate(p.date, "short")} •{" "}
                      {plural(t, "common.itemCount", p.items.length, {
                        count: num(p.items.length),
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-slate-900 dark:text-neutral-100">
                      {money(p.total)}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      {p.dueAmount > 0 && (
                        <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                          বকেয়া: {money(p.dueAmount)}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    aria-label={t("common.download")}
                    title={t("invoice.downloadInvoice")}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 active:scale-95 transition-all shrink-0 ml-1"
                  >
                    <Download size={15} />
                  </button>

                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesPage;
