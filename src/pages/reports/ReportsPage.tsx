import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
  HandCoins,
  Boxes,
  Wallet,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";
import { haptic } from "../../native/bridge";

interface ReportItem {
  labelKey: string;
  descKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  bgClass: string;
  to: string;
}

const REPORTS: ReportItem[] = [
  {
    labelKey: "reports.salesReport",
    descKey: "reports.salesReportDesc",
    icon: ShoppingCart,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60",
    to: "/ledger?sourceType=sale",
  },
  {
    labelKey: "reports.purchaseReport",
    descKey: "reports.purchaseReportDesc",
    icon: Package,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60",
    to: "/ledger?sourceType=purchase",
  },
  {
    labelKey: "reports.expenseReport",
    descKey: "reports.expenseReportDesc",
    icon: Receipt,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60",
    to: "/ledger?sourceType=expense",
  },
  {
    labelKey: "reports.profitLoss",
    descKey: "reports.profitLossDesc",
    icon: TrendingUp,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60",
    to: "/reports/profit-loss",
  },
  {
    labelKey: "reports.customerDue",
    descKey: "reports.customerDueDesc",
    icon: HandCoins,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60",
    to: "/baki?tab=receive",
  },
  {
    labelKey: "reports.supplierPayable",
    descKey: "reports.supplierPayableDesc",
    icon: ArrowUpRight,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60",
    to: "/baki?tab=pay",
  },
  {
    labelKey: "reports.inventory",
    descKey: "reports.inventoryDesc",
    icon: Boxes,
    colorClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/60",
    to: "/products",
  },
  {
    labelKey: "reports.payments",
    descKey: "reports.paymentsDesc",
    icon: Wallet,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60",
    to: "/ledger?sourceType=payment",
  },
];

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100">
      <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            {t("reports.title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            দোকান ও ব্যবসার পূর্ণাঙ্গ হিসাব বিবরণী
          </p>
        </div>

        {/* Report Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPORTS.map(({ labelKey, descKey, icon: Icon, colorClass, bgClass, to }) => (
            <button
              key={labelKey}
              type="button"
              onClick={() => {
                haptic("selection");
                navigate(to);
              }}
              className="flex items-center gap-3.5 p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-left active:scale-[0.98] hover:border-slate-300 dark:hover:border-neutral-700 transition-all select-none shadow-xs group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform ${bgClass} ${colorClass}`}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">
                  {t(labelKey)}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                  {t(descKey)}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-slate-300 dark:text-neutral-600 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
