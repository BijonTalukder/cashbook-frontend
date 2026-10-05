import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Users, Phone } from "lucide-react";
import { toast } from "sonner";
import { customerService, type ICustomer } from "../../services/customer.service";
import { useBusinessStore } from "../../store/businessStore";
import CustomerModal from "../../components/shared/CustomerModal";
import SyncBadge from "../../components/shared/SyncBadge";
import { useDataVersion } from "../../store/offlineStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { useRefreshHandler } from "../../native/refresh";
import { NativeInput } from "../../components/ui/Input";
import { NativeCard } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ListItem } from "../../components/ui/ListItem";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonList } from "../../components/ui/Skeleton";

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
    <div className="min-h-screen pb-12 bg-[var(--bg)]">
      <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-4">
        {/* Header section with native hierarchy */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {t("customer.title")}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {customers.length} {t("customer.title").toLowerCase()}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setModalOpen(true)}
            className="gap-1.5"
          >
            <Plus size={16} /> {t("customer.add")}
          </Button>
        </div>

        {/* 48px Thumb Search Input */}
        <NativeInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          clearable
          placeholder={t("common.searchByNameOrPhone")}
          leadingIcon={<Search className="w-4 h-4" />}
          touchSize="md"
        />

        {/* List Surface */}
        <NativeCard noPadding variant="elevated">
          {loading ? (
            <div className="p-4">
              <SkeletonList count={4} />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? t("customer.notFound") : t("customer.empty")}
              description={search ? t("common.tryDifferentSearch") : t("customer.emptyHintFull")}
              action={
                !search
                  ? {
                      label: t("customer.add"),
                      onClick: () => setModalOpen(true),
                      icon: Plus,
                    }
                  : undefined
              }
            />
          ) : (
            customers.map((c) => (
              <ListItem
                key={c._id}
                clickable
                chevron
                onClick={() => navigate(`/customers/${c._id}`)}
                leading={
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                }
                title={
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{c.name}</span>
                    <SyncBadge status={c.syncStatus} compact />
                  </div>
                }
                subtitle={
                  c.phone ? (
                    <span className="flex items-center gap-1">
                      <Phone size={11} className="shrink-0" />
                      {c.phone}
                    </span>
                  ) : undefined
                }
                trailing={
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold tracking-tight ${
                        c.totalDue > 0
                          ? "text-red-500 dark:text-red-400"
                          : "text-neutral-400 dark:text-neutral-500 font-normal"
                      }`}
                    >
                      {c.totalDue > 0
                        ? t("customer.totalDue", { amount: money(c.totalDue) })
                        : t("customer.noDue")}
                    </p>
                  </div>
                }
              />
            ))
          )}
        </NativeCard>
      </div>

      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(c) =>
          setCustomers((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))
        }
      />
    </div>
  );
};

export default CustomersPage;
