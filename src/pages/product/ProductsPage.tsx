import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Package, AlertTriangle, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { productService, type IProduct } from "../../services/product.service";
import { useBusinessStore } from "../../store/businessStore";
import ProductModal from "../../components/shared/ProductModal";
import StockAdjustModal from "../../components/shared/StockAdjustModal";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0 }).format(n);

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;

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
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?._id, search, lowStockOnly]);

  const handleDelete = async (p: IProduct) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    try {
      await productService.remove(p._id);
      setProducts((prev) => prev.filter((x) => x._id !== p._id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            Products
          </h1>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            <Plus size={15} /> Add Product
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-primary)" }}
            />
          </div>
          <button
            onClick={() => setLowStockOnly((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: lowStockOnly ? "rgba(239,68,68,0.1)" : C.card,
              border: `1px solid ${lowStockOnly ? "rgba(239,68,68,0.4)" : C.border}`,
              color: lowStockOnly ? "#ef4444" : "var(--text-muted)",
            }}
          >
            <AlertTriangle size={13} /> Low Stock{lowStockCount > 0 ? ` (${lowStockCount})` : ""}
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <Package size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {search || lowStockOnly ? "No products found" : "No products yet"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                {search || lowStockOnly ? "Try a different filter" : "Add your first product to start tracking inventory"}
              </p>
            </div>
          ) : (
            products.map((p) => {
              const isLow = p.stock <= p.minStock;
              return (
                <div
                  key={p._id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold overflow-hidden"
                    style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      p.name[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                      {p.category || "Uncategorized"} · {currencySymbol}{fmt(p.sellingPrice)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: isLow ? "#ef4444" : "var(--text-primary)" }}>
                      {p.stock} {p.unit}
                    </p>
                    {isLow && (
                      <p className="text-[10px] flex items-center gap-1 justify-end" style={{ color: "#ef4444" }}>
                        <AlertTriangle size={9} /> Low Stock
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setAdjusting(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                      title="Adjust stock"
                    >
                      <SlidersHorizontal size={12} />
                    </button>
                    <button
                      onClick={() => { setEditing(p); setModalOpen(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
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
