import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Receipt,
  UserPlus,
  Truck,
  ArrowDownCircle,
  ArrowUpCircle,
  PackagePlus,
  Wallet,
  Landmark,
  TrendingUp,
  HandCoins,
  Clock,
  ArrowLeftRight,
  ArrowRight,
  RefreshCw,
  Store,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  dashboardService,
  type IBusinessSummary,
} from "../../services/dashboard.service";
import type { IBusiness } from "../../services/business.service";
import { customerService, type ICustomer } from "../../services/customer.service";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { toCurrency } from "../../utils/currency";
import { toastLoadFailure } from "../../offline/notify";
import { haptic } from "../../native/bridge";

export const BusinessDashboardContent: React.FC<{ business: IBusiness }> = ({
  business,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { money, compact, date: fmtDate, num } = useFormat(
    toCurrency(business.currency)
  );

  const [summary, setSummary] = useState<IBusinessSummary | null>(null);
  const [topDebtors, setTopDebtors] = useState<ICustomer[]>([]);
  const [topCreditors, setTopCreditors] = useState<ISupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const QUICK_ACTIONS = [
    {
      key: "sale",
      label: t("bizDashboard.addSale"),
      icon: ShoppingCart,
      colorClass: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400",
      onClick: () => {
        haptic("selection");
        navigate("/sales/new");
      },
    },
    {
      key: "purchase",
      label: t("bizDashboard.addPurchase"),
      icon: Package,
      colorClass: "bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400",
      onClick: () => {
        haptic("selection");
        navigate("/purchases/new");
      },
    },
    {
      key: "expense",
      label: t("bizDashboard.addExpense"),
      icon: Receipt,
      colorClass: "bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400",
      onClick: () => {
        haptic("selection");
        navigate("/expenses?new=1");
      },
    },
    {
      key: "receive",
      label: t("payment.receive"),
      icon: ArrowDownCircle,
      colorClass: "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400",
      onClick: () => {
        haptic("selection");
        navigate("/baki?tab=receive");
      },
    },
    {
      key: "pay",
      label: t("payment.make"),
      icon: ArrowUpCircle,
      colorClass: "bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400",
      onClick: () => {
        haptic("selection");
        navigate("/baki?tab=pay");
      },
    },
    {
      key: "customer",
      label: t("bizDashboard.addCustomer"),
      icon: UserPlus,
      colorClass: "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400",
      onClick: () => {
        haptic("selection");
        navigate("/customers?new=1");
      },
    },
    {
      key: "supplier",
      label: t("bizDashboard.addSupplier"),
      icon: Truck,
      colorClass: "bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400",
      onClick: () => {
        haptic("selection");
        navigate("/suppliers?new=1");
      },
    },
    {
      key: "product",
      label: t("bizDashboard.addProduct"),
      icon: PackagePlus,
      colorClass: "bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400",
      onClick: () => {
        haptic("selection");
        navigate("/products?new=1");
      },
    },
  ];

  const load = async (silent = false) => {
    if (!silent) setLoading(true);

    const [summaryRes, customersRes, suppliersRes] = await Promise.allSettled([
      dashboardService.getBusinessSummary(business._id),
      customerService.getAll(business._id),
      supplierService.getAll(business._id),
    ]);

    if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
    if (customersRes.status === "fulfilled") {
      setTopDebtors(
        customersRes.value
          .filter((c) => c.totalDue > 0)
          .sort((a, b) => b.totalDue - a.totalDue)
          .slice(0, 3)
      );
    }
    if (suppliersRes.status === "fulfilled") {
      setTopCreditors(
        suppliersRes.value
          .filter((s) => s.totalPayable > 0)
          .sort((a, b) => b.totalPayable - a.totalPayable)
          .slice(0, 3)
      );
    }

    const summaryFailed = summaryRes.status === "rejected";
    setFailed(summaryFailed);
    if (summaryFailed && !silent) toastLoadFailure(t("bizDashboard.loadFailed"));

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business._id]);

  const statCards = [
    {
      key: "todaySales",
      label: t("bizDashboard.todaySales"),
      value: summary?.todaySales ?? 0,
      icon: ShoppingCart,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/60",
    },
    {
      key: "todayPurchases",
      label: t("bizDashboard.todayPurchases"),
      value: summary?.todayPurchases ?? 0,
      icon: Package,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-950/60",
    },
    {
      key: "todayExpenses",
      label: t("bizDashboard.todayExpenses"),
      value: summary?.todayExpenses ?? 0,
      icon: Receipt,
      colorClass: "text-rose-600 dark:text-rose-400",
      bgClass: "bg-rose-50 dark:bg-rose-950/60",
    },
    {
      key: "profit",
      label: t("bizDashboard.currentProfit"),
      value: summary?.currentProfit ?? 0,
      icon: TrendingUp,
      colorClass:
        (summary?.currentProfit ?? 0) >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
      bgClass:
        (summary?.currentProfit ?? 0) >= 0
          ? "bg-emerald-50 dark:bg-emerald-950/60"
          : "bg-rose-50 dark:bg-rose-950/60",
    },
    {
      key: "receivable",
      label: t("bizDashboard.totalReceivable"),
      value: summary?.totalReceivable ?? 0,
      icon: HandCoins,
      colorClass: "text-purple-600 dark:text-purple-400",
      bgClass: "bg-purple-50 dark:bg-purple-950/60",
    },
    {
      key: "payable",
      label: t("bizDashboard.totalPayable"),
      value: summary?.totalPayable ?? 0,
      icon: HandCoins,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50 dark:bg-amber-950/60",
    },
    {
      key: "cash",
      label: t("bizDashboard.cashBalance"),
      value: summary?.cashBalance ?? 0,
      icon: Wallet,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/60",
    },
    {
      key: "bank",
      label: t("bizDashboard.bankBalance"),
      value: summary?.bankBalance ?? 0,
      icon: Landmark,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-950/60",
    },
  ];

  const maxSales = Math.max(1, ...(summary?.salesOverview.map((d) => d.total) ?? [1]));

  return (
    <div className="space-y-4 pb-28 text-slate-900 dark:text-neutral-100 max-w-5xl mx-auto">
      {/* ── Native Business Header ─────────────────────── */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-4 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
            <Store size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-neutral-100 truncate leading-tight">
                {business.name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                {business.businessType || business.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5">
              {business.address || business.phone || t("businessType.business")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic("light");
            load(true);
          }}
          className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700/80 shadow-xs active:scale-95 transition-all select-none shrink-0"
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
        </button>
      </div>

      {/* ── Financial Summary Grid (100% Dynamic) ──────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statCards.map(({ key, label, value, icon: Icon, colorClass, bgClass }) => (
          <div
            key={key}
            className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400 truncate">
                {label}
              </span>
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}
              >
                <Icon size={14} />
              </div>
            </div>

            {loading ? (
              <div className="h-6 w-20 rounded-md bg-slate-100 dark:bg-neutral-800 animate-pulse mt-1" />
            ) : (
              <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-neutral-100 truncate leading-tight mt-1">
                {failed ? "—" : money(value)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Quick Actions Grid (8 Tactile Tiles) ─────────── */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 shadow-xs space-y-3">
        <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 px-1 uppercase tracking-wider">
          {t("dashboard.quickActions")}
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {QUICK_ACTIONS.map(({ key, label, icon: Icon, colorClass, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800/60 active:scale-95 transition-all group select-none shadow-xs"
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${colorClass}`}
              >
                <Icon size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Recent Transactions (100% Dynamic) ─────────── */}
        <div className="lg:col-span-3 bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400 dark:text-neutral-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {t("dashboard.recentTransactions")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                haptic("selection");
                navigate("/transactions");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {t("personalDashboard.allTxns")}
            </button>
          </div>

          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
          ) : !summary?.recentTransactions?.length ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-center text-slate-400 dark:text-neutral-500">
              <ArrowLeftRight size={24} className="text-slate-300 dark:text-neutral-600" />
              <p className="text-xs font-semibold">{t("personalDashboard.noTxnsYet")}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-neutral-800/80">
              {summary.recentTransactions.map((txn) => {
                const isIncome = txn.type === "income";
                return (
                  <div
                    key={txn._id}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-neutral-800/40 rounded-xl px-2 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                          {txn.category?.name ?? t("product.uncategorized")}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                          {fmtDate(txn.date, "short")}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-mono font-bold shrink-0 ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {money(isIncome ? txn.amount : -txn.amount, { signed: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Outstanding Dues (100% Dynamic) ─────────────── */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              {t("bizDashboard.outstandingDues")}
            </h2>
            <button
              type="button"
              onClick={() => {
                haptic("selection");
                navigate("/baki");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {t("common.viewAll")}
            </button>
          </div>

          {topDebtors.length === 0 && topCreditors.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-center text-slate-400 dark:text-neutral-500">
              <HandCoins size={24} className="text-slate-300 dark:text-neutral-600" />
              <p className="text-xs font-semibold">{t("bizDashboard.noDues")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topDebtors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    {t("baki.willReceive")}
                  </span>
                  <div className="space-y-1">
                    {topDebtors.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          haptic("light");
                          navigate(`/customers/${c._id}`);
                        }}
                        className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <span className="text-slate-800 dark:text-neutral-200 font-medium truncate">
                          {c.name}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {money(c.totalDue)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {topCreditors.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-neutral-800/80">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                    {t("baki.willPay")}
                  </span>
                  <div className="space-y-1">
                    {topCreditors.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          haptic("light");
                          navigate(`/suppliers/${s._id}`);
                        }}
                        className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <span className="text-slate-800 dark:text-neutral-200 font-medium truncate">
                          {s.name}
                        </span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">
                          {money(s.totalPayable)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sales Overview 7-Day Chart (100% Dynamic) ──── */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              {t("bizDashboard.salesOverview")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {t("bizDashboard.last7Days")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic("selection");
              navigate("/reports");
            }}
            className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            <span>{t("bizDashboard.viewReports")}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="h-44 flex items-center justify-center">
            <RefreshCw size={20} className="animate-spin text-slate-400" />
          </div>
        ) : maxSales <= 1 && summary?.salesOverview?.every((d) => d.total === 0) ? (
          <div className="h-44 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-neutral-500 text-center">
            <TrendingUp size={24} className="text-slate-300 dark:text-neutral-600" />
            <p className="text-xs">{t("bizDashboard.noSales")}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={summary?.salesOverview || []}
              margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => fmtDate(v, "short")}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => compact(v)}
              />
              <Tooltip
                formatter={(v?: number) => [money(v ?? 0), t("bizDashboard.salesSeries")]}
                labelFormatter={(v) => fmtDate(String(v), "short")}
              />
              <Bar
                dataKey="total"
                name={t("bizDashboard.salesSeries")}
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Floating Mobile Operational Dock ────────────── */}
      <div className="fixed bottom-[calc(var(--bottomnav-h,56px)+var(--safe-bottom,0px)+8px)] sm:bottom-4 left-0 right-0 z-30 px-4 pointer-events-none">
        <div className="max-w-lg mx-auto flex items-center gap-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-neutral-800 p-2 rounded-2xl shadow-xl pointer-events-auto">
          {/* + New Sale */}
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              navigate("/sales/new");
            }}
            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-white font-bold text-sm shadow-md shadow-emerald-600/20 select-none"
          >
            <ShoppingCart size={18} />
            <span>{t("bizDashboard.addSale")}</span>
          </button>

          {/* + New Purchase */}
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              navigate("/purchases/new");
            }}
            className="flex-1 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm shadow-xs select-none"
          >
            <Package size={18} />
            <span>{t("bizDashboard.addPurchase")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboardContent;
