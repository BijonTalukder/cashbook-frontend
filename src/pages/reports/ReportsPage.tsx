import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Package, Receipt, TrendingUp,
  HandCoins, Boxes, Wallet, ChevronRight,
} from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const REPORTS = [
  { labelKey: "reports.salesReport", descKey: "reports.salesReportDesc", icon: ShoppingCart, color: "#10b981", to: "/ledger?sourceType=sale" },
  { labelKey: "reports.purchaseReport", descKey: "reports.purchaseReportDesc", icon: Package, color: "#3b82f6", to: "/ledger?sourceType=purchase" },
  { labelKey: "reports.expenseReport", descKey: "reports.expenseReportDesc", icon: Receipt, color: "#ef4444", to: "/ledger?sourceType=expense" },
  { labelKey: "reports.profitLoss", descKey: "reports.profitLossDesc", icon: TrendingUp, color: "#8b5cf6", to: "/reports/profit-loss" },
  { labelKey: "reports.customerDue", descKey: "reports.customerDueDesc", icon: HandCoins, color: "#f59e0b", to: "/baki?tab=receive" },
  { labelKey: "reports.supplierPayable", descKey: "reports.supplierPayableDesc", icon: HandCoins, color: "#ef4444", to: "/baki?tab=pay" },
  { labelKey: "reports.inventory", descKey: "reports.inventoryDesc", icon: Boxes, color: "#3b82f6", to: "/products" },
  { labelKey: "reports.payments", descKey: "reports.paymentsDesc", icon: Wallet, color: "#10b981", to: "/ledger?sourceType=payment" },
];

const ReportsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
          {t("reports.title")}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPORTS.map(({ labelKey, descKey, icon: Icon, color, to }) => (
            <button
              key={labelKey}
              onClick={() => navigate(to)}
              className="flex items-center gap-3 p-4 rounded-2xl text-left press"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
                <Icon size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t(labelKey)}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{t(descKey)}</p>
              </div>
              <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
