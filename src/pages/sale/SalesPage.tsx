import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ShoppingCart, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { saleService, type ISale } from "../../services/sale.service";
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

const SalesPage = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;

  const [sales, setSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await saleService.getAll(activeBusiness._id, { limit: "50" });
      setSales(data.sales);
    } catch {
      toast.error("Failed to load sales");
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
            Sales
          </h1>
          <button
            onClick={() => navigate("/sales/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            <Plus size={15} /> Add Sale
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
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No sales yet</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Record your first sale to start tracking revenue</p>
            </div>
          ) : (
            sales.map((s) => {
              const meta = STATUS_META[s.status];
              return (
                <button
                  key={s._id}
                  onClick={() => navigate(`/sales/${s._id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all"
                  style={{ borderBottom: "1px solid var(--border-light)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {s.invoiceNumber} {s.customer ? `· ${s.customer.name}` : "· Walk-in"}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                      {fmtDate(s.date)} · {s.items.length} item{s.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {currencySymbol}{fmt(s.total)}
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

export default SalesPage;
