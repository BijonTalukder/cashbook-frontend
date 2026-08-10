import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Package, Receipt, UserPlus, Truck,
  ArrowDownCircle, ArrowUpCircle, PackagePlus,
  Wallet, Landmark, TrendingUp, HandCoins,
  Clock, ArrowLeftRight, ArrowRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { dashboardService, type IBusinessSummary } from "../../services/dashboard.service";
import type { IBusiness } from "../../services/business.service";
import { customerService, type ICustomer } from "../../services/customer.service";
import { supplierService, type ISupplier } from "../../services/supplier.service";

const C = {
  card: "var(--surface-1)",
  border: "var(--border)",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", { day: "2-digit", month: "short" });

const BusinessDashboardContent = ({ business }: { business: IBusiness }) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<IBusinessSummary | null>(null);
  const [topDebtors, setTopDebtors] = useState<ICustomer[]>([]);
  const [topCreditors, setTopCreditors] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = business.currency || "BDT";
  const currencySymbol = currency === "BDT" ? "৳" : `${currency} `;

  const QUICK_ACTIONS = [
    { label: "Add Sale", icon: ShoppingCart, color: "#10b981", onClick: () => navigate("/sales/new") },
    { label: "Add Purchase", icon: Package, color: "#3b82f6", onClick: () => navigate("/purchases/new") },
    { label: "Add Expense", icon: Receipt, color: "#ef4444", onClick: () => navigate("/expenses?new=1") },
    { label: "Add Customer", icon: UserPlus, color: "#8b5cf6", onClick: () => navigate("/customers?new=1") },
    { label: "Add Supplier", icon: Truck, color: "#f59e0b", onClick: () => navigate("/suppliers?new=1") },
    { label: "Receive Payment", icon: ArrowDownCircle, color: "#10b981", onClick: () => navigate("/baki") },
    { label: "Make Payment", icon: ArrowUpCircle, color: "#ef4444", onClick: () => navigate("/baki") },
    { label: "Add Product", icon: PackagePlus, color: "#3b82f6", onClick: () => navigate("/products?new=1") },
  ];

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [data, customers, suppliers] = await Promise.all([
        dashboardService.getBusinessSummary(business._id),
        customerService.getAll(business._id),
        supplierService.getAll(business._id),
      ]);
      setSummary(data);
      setTopDebtors(customers.filter((c) => c.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue).slice(0, 3));
      setTopCreditors(suppliers.filter((s) => s.totalPayable > 0).sort((a, b) => b.totalPayable - a.totalPayable).slice(0, 3));
    } catch {
      toast.error("Failed to load business summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business._id]);

  const statCards = [
    { label: "Today's Sales", value: summary?.todaySales ?? 0, icon: ShoppingCart, color: "#10b981" },
    { label: "Today's Purchases", value: summary?.todayPurchases ?? 0, icon: Package, color: "#3b82f6" },
    { label: "Today's Expenses", value: summary?.todayExpenses ?? 0, icon: Receipt, color: "#ef4444" },
    { label: "Total Receivable", value: summary?.totalReceivable ?? 0, icon: HandCoins, color: "#8b5cf6" },
    { label: "Total Payable", value: summary?.totalPayable ?? 0, icon: HandCoins, color: "#f59e0b" },
    { label: "Cash Balance", value: summary?.cashBalance ?? 0, icon: Wallet, color: "#10b981" },
    { label: "Bank Balance", value: summary?.bankBalance ?? 0, icon: Landmark, color: "#3b82f6" },
    { label: "Current Profit", value: summary?.currentProfit ?? 0, icon: TrendingUp, color: (summary?.currentProfit ?? 0) >= 0 ? "#10b981" : "#ef4444" },
  ];

  const maxSales = Math.max(1, ...(summary?.salesOverview.map((d) => d.total) ?? [1]));

  return (
    <div className="space-y-5">
      {/* ── Refresh ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
          {business.name}
        </h2>
        <button
          onClick={() => load(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-muted)" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Financial summary ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>
                <Icon size={13} />
              </div>
            </div>
            {loading ? (
              <div className="h-6 w-16 rounded animate-pulse" style={{ background: "var(--surface-4)" }} />
            ) : (
              <p className="text-xl font-bold leading-none truncate" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
                {currencySymbol}{fmt(value)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Quick actions ───────────────────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>Quick actions</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(({ label, icon: Icon, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl active:scale-95 transition-all group"
              style={{ border: "1px solid var(--border-light)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: `${color}14`, color }}>
                <Icon size={15} />
              </div>
              <span className="text-xs text-center leading-snug" style={{ color: "var(--text-muted)" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Recent transactions ───────────────────────── */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2">
              <Clock size={13} style={{ color: "var(--text-faint)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>Recent Transactions</span>
            </div>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : !summary?.recentTransactions.length ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <ArrowLeftRight size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>No transactions yet</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Sales, purchases & expenses will show up here</p>
            </div>
          ) : (
            summary.recentTransactions.map((txn) => (
              <div
                key={txn._id}
                className="flex items-center gap-3 px-5 py-3 transition-all"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: txn.type === "income" ? "#10b98115" : "#ef444415",
                    color: txn.type === "income" ? "#10b981" : "#ef4444",
                  }}
                >
                  {txn.type === "income" ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {txn.category?.name ?? "Uncategorized"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>{fmtDate(txn.date)}</p>
                </div>
                <p
                  className="text-sm font-semibold flex-shrink-0"
                  style={{ color: txn.type === "income" ? "#10b981" : "#ef4444" }}
                >
                  {txn.type === "income" ? "+" : "-"}{currencySymbol}{fmt(txn.amount)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* ── Outstanding dues ───────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>Outstanding Dues</p>
          {topDebtors.length === 0 && topCreditors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                <HandCoins size={16} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>No dues yet</p>
              <p className="text-xs px-4" style={{ color: "var(--text-faint)" }}>
                Customer &amp; supplier balances will appear here once you add them
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topDebtors.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>I Will Receive</p>
                  <div className="space-y-1">
                    {topDebtors.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => navigate(`/customers/${c._id}`)}
                        className="w-full flex items-center justify-between text-xs py-1"
                      >
                        <span style={{ color: "var(--text-primary)" }}>{c.name}</span>
                        <span className="font-semibold" style={{ color: "#10b981" }}>{currencySymbol}{fmt(c.totalDue)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {topCreditors.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>I Will Pay</p>
                  <div className="space-y-1">
                    {topCreditors.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => navigate(`/suppliers/${s._id}`)}
                        className="w-full flex items-center justify-between text-xs py-1"
                      >
                        <span style={{ color: "var(--text-primary)" }}>{s.name}</span>
                        <span className="font-semibold" style={{ color: "#ef4444" }}>{currencySymbol}{fmt(s.totalPayable)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sales overview ──────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}>
              Sales Overview
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Last 7 days</p>
          </div>
          <button
            onClick={() => navigate("/reports")}
            className="text-xs flex items-center gap-1 transition-all"
            style={{ color: "#10b981" }}
          >
            View reports <ArrowRight size={11} />
          </button>
        </div>
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <RefreshCw size={18} className="animate-spin" style={{ color: "var(--text-faint)" }} />
          </div>
        ) : maxSales <= 1 && summary?.salesOverview.every((d) => d.total === 0) ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
              <TrendingUp size={18} style={{ color: "var(--text-faint)" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>No sales recorded yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={summary?.salesOverview} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => fmtDate(v)}
                tick={{ fill: "var(--text-faint)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "var(--text-faint)", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                formatter={(v?: number) => [`${currencySymbol}${fmt(v ?? 0)}`, "Sales"]}
                labelFormatter={(v) => fmtDate(String(v))}
              />
              <Bar dataKey="total" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboardContent;
