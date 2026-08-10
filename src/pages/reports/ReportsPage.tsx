import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Package, Receipt, TrendingUp,
  HandCoins, Boxes, Wallet, ChevronRight,
} from "lucide-react";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const REPORTS = [
  { label: "Sales Report", desc: "All sales, filterable by date & customer", icon: ShoppingCart, color: "#10b981", to: "/ledger?sourceType=sale" },
  { label: "Purchase Report", desc: "All purchases, filterable by date & supplier", icon: Package, color: "#3b82f6", to: "/ledger?sourceType=purchase" },
  { label: "Expense Report", desc: "Where business expenses are going", icon: Receipt, color: "#ef4444", to: "/ledger?sourceType=expense" },
  { label: "Profit & Loss", desc: "Sales, cost of goods, and net profit", icon: TrendingUp, color: "#8b5cf6", to: "/reports/profit-loss" },
  { label: "Customer Due Report", desc: "Who owes you money", icon: HandCoins, color: "#f59e0b", to: "/baki?tab=receive" },
  { label: "Supplier Payable Report", desc: "Who you owe money to", icon: HandCoins, color: "#ef4444", to: "/baki?tab=pay" },
  { label: "Inventory Report", desc: "Stock levels & low-stock alerts", icon: Boxes, color: "#3b82f6", to: "/products" },
  { label: "Payment Report", desc: "All payments received & made", icon: Wallet, color: "#10b981", to: "/ledger?sourceType=payment" },
];

const ReportsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
          Reports
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPORTS.map(({ label, desc, icon: Icon, color, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
                <Icon size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{desc}</p>
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
