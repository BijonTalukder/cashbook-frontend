import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Users, Phone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { customerService, type ICustomer } from "../../services/customer.service";
import { useBusinessStore } from "../../store/businessStore";
import CustomerModal from "../../components/shared/CustomerModal";
import SyncBadge from "../../components/shared/SyncBadge";
import { useDataVersion } from "../../store/offlineStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { useRefreshHandler } from "../../native/refresh";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const CustomersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money } = useFormat();
  const dataVersion = useDataVersion();

  const [customers, setCustomers] = useState<ICustomer[]>([]);
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
      const data = await customerService.getAll(activeBusiness._id, search || undefined);
      setCustomers(data);
    } catch {
      toast.error(t("customer.loadFailed"));
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
  }, [activeBusiness?._id, search, dataVersion]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
            {t("customer.title")}
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold press"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            <Plus size={15} /> {t("customer.add")}
          </button>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.searchByNameOrPhone")}
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
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <Users size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {search ? t("customer.notFound") : t("customer.empty")}
              </p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                {search ? t("common.tryDifferentSearch") : t("customer.emptyHintFull")}
              </p>
            </div>
          ) : (
            customers.map((c) => (
              <button
                key={c._id}
                onClick={() => navigate(`/customers/${c._id}`)}
                className="row-press w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                >
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                    <SyncBadge status={c.syncStatus} compact />
                  </div>
                  {c.phone && (
                    <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
                      <Phone size={9} /> {c.phone}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold" style={{ color: c.totalDue > 0 ? "#ef4444" : "var(--text-faint)" }}>
                    {c.totalDue > 0 ? t("customer.totalDue", { amount: money(c.totalDue) }) : t("customer.noDue")}
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
              </button>
            ))
          )}
        </div>
      </div>

      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(c) => setCustomers((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))}
      />
    </div>
  );
};

export default CustomersPage;
