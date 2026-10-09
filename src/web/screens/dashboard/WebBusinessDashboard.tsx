import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Users,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Eye,
  EyeOff,
  Package,
  CreditCard,
} from "lucide-react";
import {
  dashboardService,
  type IBusinessSummary,
} from "../../../services/dashboard.service";
import type { IBusiness } from "../../../services/business.service";
import { customerService, type ICustomer } from "../../../services/customer.service";
import { supplierService, type ISupplier } from "../../../services/supplier.service";
import { productService, type IProduct } from "../../../services/product.service";
import { saleService, type ISale } from "../../../services/sale.service";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";

interface Props {
  business: IBusiness;
  onRefresh?: () => void;
}

type DatePeriod = "today" | "7days" | "30days";

export const WebBusinessDashboard: React.FC<Props> = ({
  business,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { money } = useFormat(toCurrency(business.currency));

  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>("today");
  const [balanceHidden, setBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem("hisabboi_business_balance_hidden") === "true";
  });

  const [summary, setSummary] = useState<IBusinessSummary | null>(null);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<IProduct[]>([]);
  const [recentSales, setRecentSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleHideBalance = () => {
    setBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem("hisabboi_business_balance_hidden", String(next));
      return next;
    });
  };

  const loadAll = useCallback(async () => {
    if (!business?._id) return;
    setLoading(true);
    try {
      const [sumRes, custRes, suppRes, prodRes, salesRes] = await Promise.allSettled([
        dashboardService.getBusinessSummary(business._id),
        customerService.getAll(business._id),
        supplierService.getAll(business._id),
        productService.getAll(business._id, { lowStock: true }),
        saleService.getAll(business._id),
      ]);

      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (custRes.status === "fulfilled") setCustomers(custRes.value || []);
      if (suppRes.status === "fulfilled") setSuppliers(suppRes.value || []);
      if (prodRes.status === "fulfilled") setLowStockProducts(prodRes.value || []);
      if (salesRes.status === "fulfilled") setRecentSales(salesRes.value?.sales || []);
    } finally {
      setLoading(false);
    }
  }, [business._id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Total cash + bank balance
  const totalCashBank = useMemo(() => {
    const cash = Number(business?.cashBalance || 0);
    const bank = Number(business?.bankBalance || 0);
    return cash + bank;
  }, [business?.cashBalance, business?.bankBalance]);

  return (
    <div className="space-y-6">
      {/* ── Top Control Bar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--surface-1)] p-3 rounded-2xl border border-[var(--border-light)]">
        {/* Period Pills */}
        <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl">
          {(
            [
              { id: "today", label: "Today" },
              { id: "7days", label: "Last 7 Days" },
              { id: "30days", label: "Last 30 Days" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedPeriod(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPeriod === id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => {
              loadAll();
              onRefresh?.();
            }}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/sales/new")}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <ShoppingCart size={14} />
            <span>+ New Sale</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/purchases/new")}
            className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>+ New Purchase</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="h-9 px-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Package size={14} />
            <span>Products</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sales Revenue Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl p-5 shadow-lg shadow-emerald-900/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-100 flex items-center gap-1.5">
              <TrendingUp size={14} /> Today's Sales
            </span>
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight mb-1">
              {money(summary?.todaySales || 0)}
            </div>
            <span className="text-xs text-emerald-100/80">
              Profit: {money(summary?.currentProfit || 0)}
            </span>
          </div>
        </div>

        {/* Liquid Cash & Bank Balance Card */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <CreditCard size={15} className="text-emerald-500" /> Cash & Bank
            </span>
            <button
              type="button"
              onClick={toggleHideBalance}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
            >
              {balanceHidden ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {balanceHidden ? "••••••" : money(totalCashBank)}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">
              Cash: {money(business?.cashBalance || 0)} • Bank: {money(business?.bankBalance || 0)}
            </span>
          </div>
        </div>

        {/* Customer Receivables (Baki) */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <Users size={15} className="text-amber-500" /> Customer Baki
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
              Receivables
            </span>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {money(summary?.totalReceivable || 0)}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">
              Outstanding from customers
            </span>
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <Truck size={15} className="text-rose-500" /> Supplier Payables
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold">
              Payables
            </span>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {money(summary?.totalPayable || 0)}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">
              Today's Purchases: {money(summary?.todayPurchases || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Dual-Column Analysis Canvas ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): Recent Sales Activity Table */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Recent Sales Records
                </h3>
                <p className="text-xs text-[var(--text-faint)]">
                  Latest customer invoices and counter receipts
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/sales")}
                className="text-xs text-emerald-600 hover:underline font-semibold"
              >
                View All Sales
              </button>
            </div>

            {recentSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-faint)] uppercase text-[10px] tracking-wider font-semibold">
                      <th className="pb-2.5">Invoice #</th>
                      <th className="pb-2.5">Customer</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {recentSales.map((sale) => (
                      <tr
                        key={sale._id}
                        onClick={() => navigate(`/sales/${sale._id}`)}
                        className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                      >
                        <td className="py-3 font-semibold text-emerald-600 whitespace-nowrap">
                          {sale.invoiceNumber || "INV-—"}
                        </td>
                        <td className="py-3 text-[var(--text-primary)] font-medium">
                          {sale.customer?.name || "Cash Customer"}
                        </td>
                        <td className="py-3 text-[var(--text-faint)] whitespace-nowrap">
                          {new Date(sale.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 text-right font-bold text-[var(--text-primary)] whitespace-nowrap">
                          {money(sale.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[var(--text-faint)]">
                No recent sales recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5/12): Low Stock Alerts & Top Debtors */}
        <div className="lg:col-span-5 space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Low Stock Inventory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="text-xs text-emerald-600 hover:underline font-semibold"
              >
                Manage
              </button>
            </div>

            {lowStockProducts.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-light)]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {prod.name}
                      </p>
                      <span className="text-[10px] text-[var(--text-faint)]">
                        SKU: {prod.sku || "N/A"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        {prod.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-faint)]">
                All product stock levels are healthy!
              </div>
            )}
          </div>

          {/* Top Customers with Dues */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Outstanding Customer Dues
              </h3>
              <button
                type="button"
                onClick={() => navigate("/baki")}
                className="text-xs text-emerald-600 hover:underline font-semibold"
              >
                View Baki
              </button>
            </div>

            {customers.filter((c) => (c.totalDue || 0) > 0).length > 0 ? (
              <div className="space-y-2.5">
                {customers
                  .filter((c) => (c.totalDue || 0) > 0)
                  .slice(0, 5)
                  .map((cust) => (
                    <div
                      key={cust._id}
                      onClick={() => navigate(`/customers/${cust._id}`)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-light)] hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {cust.name}
                        </p>
                        <span className="text-[10px] text-[var(--text-faint)]">
                          {cust.phone || "No phone"}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {money(cust.totalDue || 0)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-faint)]">
                No customer receivables due.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebBusinessDashboard;
