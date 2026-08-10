import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { purchaseService, type IPurchase } from "../../services/purchase.service";
import { useBusinessStore } from "../../store/businessStore";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", { day: "2-digit", month: "short" });

const STATUS_META: Record<string, { label: string; color: string }> = {
  paid: { label: "Paid", color: "#10b981" },
  partial: { label: "Partial", color: "#f59e0b" },
  due: { label: "Due", color: "#ef4444" },
};

const PurchasesPage = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;

  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await purchaseService.getAll(activeBusiness._id, { limit: "50" });
      setPurchases(data.purchases);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeBusiness?._id]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            Purchases
          </h1>
          <button
            onClick={() => navigate("/purchases/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            <Plus size={15} /> Add Purchase
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <Package size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No purchases yet</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Record your first purchase to start tracking stock &amp; costs</p>
            </div>
          ) : (
            purchases.map((p) => {
              const meta = STATUS_META[p.status];
              return (
                <button
                  key={p._id}
                  onClick={() => navigate(`/purchases/${p._id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all"
                  style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {p.referenceNumber} {p.supplier ? `· ${p.supplier.name}` : ""}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                      {fmtDate(p.date)} · {p.items.length} item{p.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {currencySymbol}{fmt(p.total)}
                    </p>
                    <p className="text-[10px] font-medium" style={{ color: meta.color }}>{meta.label}</p>
                  </div>
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
