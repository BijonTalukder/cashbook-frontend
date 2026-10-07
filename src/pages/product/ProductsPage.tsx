import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Package, AlertTriangle, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { productService, type IProduct } from "../../services/product.service";
import { useBusinessStore } from "../../store/businessStore";
import ProductModal from "../../components/shared/ProductModal";
import StockAdjustModal from "../../components/shared/StockAdjustModal";
import SyncBadge from "../../components/shared/SyncBadge";
import { useDataVersion } from "../../store/offlineStore";
import { useTranslation } from "../../i18n/useTranslation";
import { SkeletonList } from "../../components/ui/Skeleton";
import { haptic } from "../../native/bridge";
import { useFormat } from "../../i18n/useFormat";
import { confirmAction } from "../../components/ui/confirm";
import { useRefreshHandler } from "../../native/refresh";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num } = useFormat();
  // Re-runs the loader whenever a background sync changes the local cache.
  const dataVersion = useDataVersion();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(searchParams.get("new") === "1");
  const [editing, setEditing] = useState<IProduct | null>(null);
  const [adjusting, setAdjusting] = useState<IProduct | null>(null);


  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await productService.getAll(activeBusiness._id, { search: search || undefined, lowStock: lowStockOnly });
      setProducts(data);
    } catch {
      toast.error(t("product.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?._id, search, lowStockOnly, dataVersion]);

  const handleDelete = async (p: IProduct) => {
    const ok = await confirmAction({
      title: t("common.confirmDelete", { name: p.name }),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await productService.remove(p._id);
      setProducts((prev) => prev.filter((x) => x._id !== p._id));
      toast.success(t("product.deleted"));
    } catch {
      toast.error(t("product.deleteFailed"));
    }
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100">
      <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-4xl mx-auto space-y-4">
        {/* Header section with native hierarchy */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              {t("product.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {t("products.productsListed", { count: num(products.length) })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic("medium");
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 h-11 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white shadow-md shadow-emerald-600/20 shrink-0 select-none"
          >
            <Plus size={16} />
            <span>{t("product.add")}</span>
          </button>
        </div>

        {/* Search Bar & Low Stock Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("product.searchByNameSkuCategory")}
              className="w-full pl-10 pr-4 h-11 rounded-2xl text-sm bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              haptic("selection");
              setLowStockOnly((v) => !v);
            }}
            className={`flex items-center gap-1.5 px-3.5 h-11 rounded-2xl text-xs font-semibold shrink-0 active:scale-95 transition-all select-none shadow-xs ${
              lowStockOnly
                ? "bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                : "bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800/60"
            }`}
          >
            <AlertTriangle size={14} className={lowStockOnly ? "text-rose-600 dark:text-rose-400" : "text-amber-500"} />
            <span>
              {lowStockCount > 0
                ? t("product.lowStockFilterCount", { count: num(lowStockCount) })
                : t("product.lowStockFilter")}
            </span>
          </button>
        </div>

        {/* Products List Surface */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
          {loading ? (
            <div className="p-4">
              <SkeletonList rows={5} />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                <Package size={22} />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {search || lowStockOnly ? t("product.notFound") : t("product.empty")}
              </p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-sm">
                {search || lowStockOnly ? t("common.tryDifferentFilter") : t("product.emptyHintInventory")}
              </p>
            </div>
          ) : (
            products.map((p) => {
              const isLow = p.stock <= p.minStock;
              return (
                <div
                  key={p._id}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors select-none"
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 overflow-hidden shadow-xs">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      p.name[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate flex-1 min-w-0">
                        {p.name}
                      </p>
                      <p
                        className={`text-sm font-bold font-mono shrink-0 tabular-nums ${
                          isLow
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-900 dark:text-neutral-100"
                        }`}
                      >
                        {t("product.stockLine", { stock: num(p.stock), unit: p.unit ?? "" })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                      <SyncBadge status={p.syncStatus} compact />
                      {isLow && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-200/60 dark:border-rose-800/60 shrink-0">
                          <AlertTriangle size={10} /> {t("product.lowStock")}
                        </span>
                      )}
                      <p className="text-xs text-slate-500 dark:text-neutral-400 truncate flex-1 min-w-0">
                        {t("product.categoryAndPrice", {
                          category: p.category || t("product.uncategorized"),
                          price: money(p.sellingPrice),
                        })}
                      </p>
                      <div className="flex items-center gap-1 shrink-0 -my-1">
                        <button
                          type="button"
                          onClick={() => {
                            haptic("light");
                            setAdjusting(p);
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
                          aria-label={t("stock.adjust")}
                          title={t("stock.adjust")}
                        >
                          <SlidersHorizontal size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            haptic("light");
                            setEditing(p);
                            setModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
                          aria-label={t("common.edit")}
                          title={t("common.edit")}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 active:scale-95 transition-all"
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editing={editing}
        onSuccess={(p) => {
          setProducts((prev) => {
            const exists = prev.some((x) => x._id === p._id);
            const next = exists ? prev.map((x) => (x._id === p._id ? p : x)) : [...prev, p];
            return next.sort((a, b) => a.name.localeCompare(b.name));
          });
        }}
      />
      <StockAdjustModal
        open={!!adjusting}
        product={adjusting}
        onClose={() => setAdjusting(null)}
        onSuccess={(p) => setProducts((prev) => prev.map((x) => (x._id === p._id ? p : x)))}
      />
    </div>
  );
};

export default ProductsPage;
