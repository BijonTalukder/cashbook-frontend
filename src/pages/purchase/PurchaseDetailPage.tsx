import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Truck, Package, Calendar, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import { purchaseService, type IPurchase } from "../../services/purchase.service";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { paymentMethodLabel } from "../../i18n/labels";
import { NativeCard } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { haptic } from "../../native/bridge";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger"> = {
  paid: "success",
  partial: "warning",
  due: "danger",
};

const PurchaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const [purchase, setPurchase] = useState<IPurchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    purchaseService
      .getOne(id)
      .then(setPurchase)
      .catch(() => toast.error(t("purchase.loadOneFailed")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-10 h-10 rounded-2xl animate-pulse bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg)] text-neutral-900 dark:text-neutral-100">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          {t("purchase.notFound")}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/purchases")}>
          {t("purchase.backToPurchases")}
        </Button>
      </div>
    );
  }

  const variant = STATUS_VARIANTS[purchase.status] || "neutral";

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 text-neutral-900 dark:text-neutral-100">
      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-2xl mx-auto space-y-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                haptic("light");
                navigate("/purchases");
              }}
              aria-label={t("purchase.backToPurchases")}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                #{purchase.referenceNumber}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{fmtDate(purchase.date, "long")}</span>
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              haptic("light");
              navigate(`/purchases/${purchase._id}/invoice`);
            }}
            className="gap-1.5"
          >
            <Download size={14} />
            <span>Invoice</span>
          </Button>
        </div>

        {/* Status & Supplier Card */}
        <NativeCard variant="elevated" className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-neutral-400 block font-medium">Supplier</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {purchase.supplier?.name || t("purchase.noSupplier")}
                </span>
                {purchase.supplier?.phone && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                    {purchase.supplier.phone}
                  </span>
                )}
              </div>
            </div>

            <Badge variant={variant} size="md">
              {t(`docStatus.${purchase.status}`)}
            </Badge>
          </div>
        </NativeCard>

        {/* Purchased Items List */}
        <NativeCard variant="elevated" className="overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Purchased Items ({purchase.items.length})
            </span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {purchase.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 sm:p-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center text-xs font-bold font-mono">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.productName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t("sale.lineQty", {
                        quantity: num(item.quantity),
                        price: money(item.unitPrice),
                      })}
                    </p>
                  </div>
                </div>
                <p className="font-bold font-mono text-neutral-900 dark:text-neutral-100">
                  {money(item.lineTotal)}
                </p>
              </div>
            ))}
          </div>
        </NativeCard>

        {/* Bill Breakdown */}
        <NativeCard variant="elevated" className="p-4 space-y-2.5 bg-neutral-50/70 dark:bg-neutral-900/70">
          <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{t("common.subtotal")}</span>
            <span className="font-mono text-neutral-800 dark:text-neutral-200">
              {money(purchase.subtotal)}
            </span>
          </div>

          {purchase.discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <span>{t("common.discount")}</span>
              <span className="font-mono">- {money(purchase.discount)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200 dark:border-neutral-800 font-bold">
            <span className="text-sm text-neutral-900 dark:text-neutral-100">
              {t("common.total")}
            </span>
            <span className="text-lg font-mono text-neutral-900 dark:text-neutral-100">
              {money(purchase.total)}
            </span>
          </div>

          <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-1">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{paymentMethodLabel(t, purchase.paymentMethod)}</span>
            </span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {money(purchase.paidAmount)}
            </span>
          </div>

          {purchase.dueAmount > 0 && (
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold mt-2">
              <span>{t("purchase.payable")} (Due)</span>
              <span className="font-mono text-sm">{money(purchase.dueAmount)}</span>
            </div>
          )}
        </NativeCard>

        {purchase.note && (
          <NativeCard variant="outlined" className="p-3.5 text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-2">
            <FileText className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Note</span>
              <span>{purchase.note}</span>
            </div>
          </NativeCard>
        )}
      </div>
    </div>
  );
};

export default PurchaseDetailPage;
