import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  dashboardService,
  type IBusinessSummary,
} from "../../services/dashboard.service";
import type { IBusiness } from "../../services/business.service";
import { customerService, type ICustomer } from "../../services/customer.service";
import { supplierService, type ISupplier } from "../../services/supplier.service";
import { productService, type IProduct } from "../../services/product.service";
import { saleService, type ISale } from "../../services/sale.service";
import { useTranslation } from "../../i18n/useTranslation";
import { toastLoadFailure } from "../../offline/notify";
import { useRefreshHandler } from "../../native/refresh";

import {
  BusinessHeader,
  type DatePeriod,
  BusinessHeroBalanceCard,
  BusinessKpiGrid,
  BusinessQuickActionGrid,
  DailyPerformanceStrip,
  LowStockAlertCard,
  RecentLedgerStreamCard,
  BusinessFloatingDock,
} from "./business";

interface Props {
  business: IBusiness;
  onRefresh?: () => void;
}

export const BusinessDashboardContent: React.FC<Props> = ({
  business,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Date period state ("today" | "7days" | "30days")
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>("today");

  // Balance privacy state (persisted in localStorage)
  const [balanceHidden, setBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem("hisabboi_business_balance_hidden") === "true";
  });

  // Dynamic data states
  const [summary, setSummary] = useState<IBusinessSummary | null>(null);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<IProduct[]>([]);
  const [recentSales, setRecentSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggleHideBalance = () => {
    setBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem("hisabboi_business_balance_hidden", String(next));
      return next;
    });
  };

  const loadData = useCallback(
    async (isSilent = false) => {
      if (!business?._id) return;
      isSilent ? setRefreshing(true) : setLoading(true);

      const [summaryRes, customersRes, suppliersRes, productsRes, salesRes] =
        await Promise.allSettled([
          dashboardService.getBusinessSummary(business._id),
          customerService.getAll(business._id),
          supplierService.getAll(business._id),
          productService.getAll(business._id, { lowStock: true }),
          saleService.getAll(business._id),
        ]);

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value);
        setFailed(false);
      } else {
        setFailed(true);
        if (!isSilent) toastLoadFailure(t("bizDashboard.loadFailed"));
      }

      if (customersRes.status === "fulfilled") {
        setCustomers(customersRes.value || []);
      }

      if (suppliersRes.status === "fulfilled") {
        setSuppliers(suppliersRes.value || []);
      }

      if (productsRes.status === "fulfilled") {
        setLowStockProducts(productsRes.value || []);
      }

      if (salesRes.status === "fulfilled") {
        setRecentSales(salesRes.value?.sales || []);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [business._id, t]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull-to-refresh
  useRefreshHandler(async () => {
    await loadData(true);
    onRefresh?.();
  });

  // Calculate Debtor & Creditor Counts
  const topDebtors = useMemo(() => {
    return customers.filter((c) => (c.totalDue ?? 0) > 0);
  }, [customers]);

  const topCreditors = useMemo(() => {
    return suppliers.filter((s) => (s.totalPayable ?? 0) > 0);
  }, [suppliers]);

  // Dynamic Today's Cash Sales vs Due Sales from real sales data
  const { todayCashSales, todayDueSales } = useMemo(() => {
    const todayStr = new Date().toDateString();
    let cash = 0;
    let due = 0;

    recentSales.forEach((s) => {
      if (s.date && new Date(s.date).toDateString() === todayStr) {
        cash += s.paidAmount || 0;
        due += s.dueAmount || 0;
      }
    });

    // If no sales match today specifically, fall back to todaySales from summary
    if (cash === 0 && due === 0 && (summary?.todaySales ?? 0) > 0) {
      cash = summary?.todaySales ?? 0;
    }

    return { todayCashSales: cash, todayDueSales: due };
  }, [recentSales, summary?.todaySales]);

  // Growth calculation from salesOverview
  const salesGrowth = useMemo(() => {
    const overview = summary?.salesOverview;
    if (!overview || overview.length < 2) return undefined;
    const latest = overview[overview.length - 1]?.total || 0;
    const previous = overview[overview.length - 2]?.total || 0;
    if (previous === 0) return latest > 0 ? 100 : 0;
    return Math.round(((latest - previous) / previous) * 100 * 10) / 10;
  }, [summary?.salesOverview]);

  // Balances
  const cashBalance = summary?.cashBalance ?? business.cashBalance ?? 0;
  const bankBalance = summary?.bankBalance ?? business.bankBalance ?? 0;
  const totalCash = cashBalance + bankBalance;

  // Period label
  const periodLabel = useMemo(() => {
    if (selectedPeriod === "today") return t("bizDashboard.todayLive");
    if (selectedPeriod === "7days") return t("bizDashboard.last7DaysSummary");
    return t("bizDashboard.last30DaysSummary");
  }, [selectedPeriod, t]);

  return (
    <div className="space-y-4 pb-28 text-slate-900 dark:text-neutral-100 max-w-lg mx-auto w-full px-1">
      {/* 1. Header & Branch Sub-Header with Date Filter Segment (100% Dynamic) */}
      <BusinessHeader
        business={business}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        onRefresh={() => loadData(true)}
        refreshing={refreshing}
      />

      {/* 2. Primary Hero Financial Card (100% Dynamic) */}
      <BusinessHeroBalanceCard
        totalCash={totalCash}
        cashInDrawer={cashBalance}
        bankBalance={bankBalance}
        currency={business.currency}
        growthPercentage={salesGrowth}
        balanceHidden={balanceHidden}
        onToggleHide={toggleHideBalance}
        onRefresh={() => loadData(true)}
        refreshing={refreshing}
      />

      {/* 3. Core Retail KPIs (2x2 Balanced Grid - 100% Dynamic) */}
      <BusinessKpiGrid
        todaySales={summary?.todaySales ?? 0}
        todayPurchases={summary?.todayPurchases ?? 0}
        totalReceivable={summary?.totalReceivable ?? 0}
        totalPayable={summary?.totalPayable ?? 0}
        currency={business.currency}
        salesGrowth={salesGrowth}
        purchaseCount={summary?.todayPurchases ? 1 : 0}
        debtorCount={topDebtors.length}
        creditorCount={topCreditors.length}
        periodLabel={periodLabel}
      />

      {/* 5. Quick Actions (4 Tactile Action Tiles) */}
      <BusinessQuickActionGrid
        onNewSale={() => navigate("/sales/new")}
        onNewPurchase={() => navigate("/purchases/new")}
        onNewExpense={() => navigate("/expenses?new=1")}
        onOpenBaki={() => navigate("/baki")}
      />

      {/* 6. Daily Performance Snapshot Strip (100% Dynamic) */}
      <DailyPerformanceStrip
        cashSales={todayCashSales}
        dueSales={todayDueSales}
        totalProfit={summary?.currentProfit ?? 0}
        currency={business.currency}
      />

      {/* 7. Low Stock Inventory Alert (100% Dynamic) */}
      <LowStockAlertCard
        lowStockProducts={lowStockProducts}
        onOrderNow={() => navigate("/purchases/new")}
      />

      {/* 8. Recent Transactions & Due Ledger Stream (100% Dynamic) */}
      <RecentLedgerStreamCard
        transactions={summary?.recentTransactions ?? []}
        currency={business.currency}
        onViewAll={() => navigate("/transactions")}
      />

      {/* 9. Sticky Bottom Fast POS Action Dock */}
      <BusinessFloatingDock
        onNewSale={() => navigate("/sales/new")}
        onReceiveBaki={() => navigate("/baki?tab=receive")}
      />
    </div>
  );
};

export default BusinessDashboardContent;
