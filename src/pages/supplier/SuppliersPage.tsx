import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Truck, Phone } from "lucide-react";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { useBusinessStore } from "../../store/businessStore";
import SupplierModal from "../../components/shared/SupplierModal";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { useRefreshHandler } from "../../native/refresh";
import LoadFailedState from "../../components/shared/LoadFailedState";
import { toastLoadFailure } from "../../offline/notify";
import { NativeInput } from "../../components/ui/Input";
import { NativeCard } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ListItem } from "../../components/ui/ListItem";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonList } from "../../components/ui/Skeleton";

const SuppliersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money } = useFormat();

  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
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
      setFailed(false);
    } catch {
      setFailed(true);
      toastLoadFailure(t("supplier.loadFailed"));
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
  }, [activeBusiness?._id, search]);

  return (
    <div className="min-h-screen pb-12 bg-[var(--bg)]">
      <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-4">
        {/* Header section with native hierarchy */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {t("supplier.title")}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {suppliers.length} {t("supplier.title").toLowerCase()}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setModalOpen(true)}
            className="gap-1.5"
          >
            <Plus size={16} /> {t("supplier.add")}
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
          ) : failed ? (
            <LoadFailedState onRetry={load} />
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={search ? t("supplier.notFound") : t("supplier.empty")}
              description={search ? t("common.tryDifferentSearch") : t("supplier.emptyHintFull")}
              action={
                !search
                  ? {
                      label: t("supplier.add"),
                      onClick: () => setModalOpen(true),
                      icon: Plus,
                    }
                  : undefined
              }
            />
          ) : (
            suppliers.map((s) => (
              <ListItem
                key={s._id}
                clickable
                chevron
                onClick={() => navigate(`/suppliers/${s._id}`)}
                leading={
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    {s.name[0]?.toUpperCase()}
                  </div>
                }
                title={s.name}
                subtitle={
                  s.phone ? (
                    <span className="flex items-center gap-1">
                      <Phone size={11} className="shrink-0" />
                      {s.phone}
                    </span>
                  ) : undefined
                }
                trailing={
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold tracking-tight ${
                        s.totalPayable > 0
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-neutral-400 dark:text-neutral-500 font-normal"
                      }`}
                    >
                      {s.totalPayable > 0
                        ? t("supplier.totalPayable", { amount: money(s.totalPayable) })
                        : t("supplier.noPayable")}
                    </p>
                  </div>
                }
              />
            ))
          )}
        </NativeCard>
      </div>

      <SupplierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(s) =>
          setSuppliers((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)))
        }
      />
    </div>
  );
};

export default SuppliersPage;
