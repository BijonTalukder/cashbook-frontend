import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Truck, Phone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { useBusinessStore } from "../../store/businessStore";
import SupplierModal from "../../components/shared/SupplierModal";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0 }).format(n);

const SuppliersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const currencySymbol = (activeBusiness?.currency || "BDT") === "BDT" ? "৳" : `${activeBusiness?.currency} `;

  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(searchParams.get("new") === "1");

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
      const data = await supplierService.getAll(activeBusiness._id, search || undefined);
      setSuppliers(data);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?._id, search]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            Suppliers
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            <Plus size={15} /> Add Supplier
          </button>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-primary)" }}
          />
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <Truck size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {search ? "No suppliers found" : "No suppliers yet"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                {search ? "Try a different search" : "Add your first supplier to start tracking purchases & payables"}
              </p>
            </div>
          ) : (
            suppliers.map((s) => (
              <button
                key={s._id}
                onClick={() => navigate(`/suppliers/${s._id}`)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
                >
                  {s.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                  {s.phone && (
                    <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
                      <Phone size={9} /> {s.phone}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold" style={{ color: s.totalPayable > 0 ? "#ef4444" : "var(--text-faint)" }}>
                    {s.totalPayable > 0 ? `${currencySymbol}${fmt(s.totalPayable)} payable` : "No payable"}
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
              </button>
            ))
          )}
        </div>
      </div>

      <SupplierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(s) => setSuppliers((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)))}
      />
    </div>
  );
};

export default SuppliersPage;
