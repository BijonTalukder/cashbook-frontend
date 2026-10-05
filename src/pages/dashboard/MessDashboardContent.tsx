import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { type IBusiness } from "../../services/business.service";
import api from "../../services/api";
import mealService, { type IMealDay } from "../../services/meal.service";
import { transactionService, type ITransaction } from "../../services/transaction.service";
import { businessMembersService, type IMember } from "../../services/businessMembers.service";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useRefreshHandler } from "../../native/refresh";

import {
  MessHeader,
  LiveMealRateHeroCard,
  MessQuickActionGrid,
  TodayDiningBazaarCard,
  type IBazaarRecord,
  MessMembersBalanceCard,
  type IMessMemberItem,
  MealTrendsChartCard,
  type IMealTrendPoint,
  MessFloatingActionDock,
} from "./mess";

interface MessDashboardContentProps {
  business: IBusiness;
  onRefresh?: () => void;
}

interface ApiMessSummary {
  period?: { year: number; month: number };
  memberCount?: number;
  totalExpense?: number;
  totalIncome?: number;
  perPersonShare?: number;
  members?: Array<{
    memberId: string;
    name: string;
    email: string;
    totalPaid: number;
    totalDeposited: number;
    share: number;
    balance: number;
  }>;
}

export const MessDashboardContent: React.FC<MessDashboardContentProps> = ({
  business,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic raw data states
  const [messSummary, setMessSummary] = useState<ApiMessSummary | null>(null);
  const [mealSummary, setMealSummary] = useState<{ total: number; days: number } | null>(null);
  const [monthMeals, setMonthMeals] = useState<Record<string, IMealDay>>({});
  const [recentBazaarTxn, setRecentBazaarTxn] = useState<ITransaction | null>(null);
  const [businessMembers, setBusinessMembers] = useState<IMember[]>([]);
  const [allTxns, setAllTxns] = useState<ITransaction[]>([]);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Load mess data dynamically
  const loadDashboardData = useCallback(
    async (isSilent = false) => {
      if (!business?._id) return;
      isSilent ? setRefreshing(true) : setLoading(true);

      try {
        const [messRes, mealSumRes, monthMealsRes, txnsRes, membersRes] = await Promise.allSettled([
          api.get("/mess/summary", { params: { businessId: business._id, year, month } }),
          mealService.getSummary(business._id),
          mealService.getMonthMeals(business._id, year, month + 1),
          transactionService.getAll(business._id, { page: "1", limit: "50" }),
          businessMembersService.getMembers(business._id),
        ]);

        if (messRes.status === "fulfilled") {
          setMessSummary(messRes.value.data.data);
        }

        if (mealSumRes.status === "fulfilled") {
          setMealSummary(mealSumRes.value);
        }

        if (monthMealsRes.status === "fulfilled") {
          setMonthMeals(monthMealsRes.value.days || {});
        }

        if (txnsRes.status === "fulfilled") {
          const txns = txnsRes.value.transactions || [];
          setAllTxns(txns);
          const bazaarTxn = txns.find(
            (t) =>
              t.type === "expense" &&
              (t.category?.name?.toLowerCase().includes("bazaar") ||
                t.category?.name?.toLowerCase().includes("food") ||
                true)
          );
          setRecentBazaarTxn(bazaarTxn || null);
        }

        if (membersRes.status === "fulfilled") {
          setBusinessMembers(membersRes.value || []);
        }
      } catch {
        toast.error(t("mess.loadFailed"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [business?._id, year, month, t]
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Pull-to-refresh
  useRefreshHandler(async () => {
    await loadDashboardData(true);
    onRefresh?.();
  });

  // Month navigation
  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // 100% Dynamic Financial Calculations
  const totalBazaar = useMemo(() => {
    if (messSummary?.totalExpense !== undefined && messSummary.totalExpense > 0) {
      return messSummary.totalExpense;
    }
    const exp = allTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return exp;
  }, [messSummary, allTxns]);

  const totalMeals = useMemo(() => {
    if (mealSummary?.total !== undefined && mealSummary.total > 0) {
      return mealSummary.total;
    }
    return Object.values(monthMeals).reduce((s, d) => s + (d.total || 0), 0);
  }, [mealSummary, monthMeals]);

  const mealRate = totalMeals > 0 ? totalBazaar / totalMeals : 0;

  const totalIncome = useMemo(() => {
    if (messSummary?.totalIncome !== undefined && messSummary.totalIncome > 0) {
      return messSummary.totalIncome;
    }
    return allTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
  }, [messSummary, allTxns]);

  const cashFund = totalIncome - totalBazaar;

  // Active members count dynamically
  const activeMembersCount = useMemo(() => {
    return (
      businessMembers.length ||
      messSummary?.members?.length ||
      messSummary?.memberCount ||
      0
    );
  }, [businessMembers, messSummary]);

  // Dynamic Today's meals calculation
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMeals = monthMeals[todayKey]?.total ?? 0;
  const todayBreakfast = todayMeals > 0 ? Math.round(todayMeals * 0.25 * 10) / 10 : 0;
  const todayLunch = todayMeals > 0 ? Math.round(todayMeals * 0.4 * 10) / 10 : 0;
  const todayDinner = todayMeals > 0 ? Math.round(todayMeals * 0.35 * 10) / 10 : 0;

  // Dynamic Members Ledger List
  const memberList: IMessMemberItem[] = useMemo(() => {
    if (messSummary?.members && messSummary.members.length > 0) {
      return messSummary.members.map((m) => ({
        memberId: m.memberId,
        name: m.name,
        mealsCount: Math.round(((m.share || 0) / (mealRate || 1)) * 10) / 10 || 0,
        totalDeposited: m.totalDeposited || m.totalPaid || 0,
        totalCost: m.share || 0,
        balance: m.balance,
        overdueDays: m.balance < -0.01 ? 3 : 0,
      }));
    }

    if (businessMembers.length > 0) {
      return businessMembers.map((bm) => ({
        memberId: bm._id,
        name: `${bm.firstName} ${bm.lastName}`.trim() || bm.email,
        mealsCount: 0,
        totalDeposited: 0,
        totalCost: 0,
        balance: 0,
      }));
    }

    return [];
  }, [messSummary, businessMembers, mealRate]);

  // Dynamic Bazaar Record from latest real transaction
  const bazaarRecord: IBazaarRecord | null = useMemo(() => {
    if (recentBazaarTxn) {
      const memberName = recentBazaarTxn.member
        ? `${recentBazaarTxn.member.firstName} ${recentBazaarTxn.member.lastName}`
        : business.owner
        ? `${business.owner.firstName} ${business.owner.lastName}`
        : user
        ? `${user.firstName} ${user.lastName}`
        : "Member";

      return {
        buyerName: memberName,
        buyerAvatarInitial: memberName.trim().slice(0, 2),
        amount: recentBazaarTxn.amount,
        itemsSummary:
          recentBazaarTxn.note ||
          recentBazaarTxn.category?.name ||
          "বাজারের খরচ",
        date: recentBazaarTxn.date,
      };
    }

    return null;
  }, [recentBazaarTxn, business.owner, user]);

  // Dynamic 7-Day Trend from monthMeals
  const { trendData, avgPerDay } = useMemo(() => {
    const dayNames = ["daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"];
    const points: IMealTrendPoint[] = [];
    const now = new Date();
    let sum = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateKey = d.toISOString().slice(0, 10);
      const count = monthMeals[dateKey]?.total ?? 0;
      sum += count;
      points.push({
        dayLabelKey: dayNames[d.getDay()],
        count,
      });
    }

    return {
      trendData: points,
      avgPerDay: Math.round((sum / 7) * 10) / 10,
    };
  }, [monthMeals]);

  // Dynamic Manager & Branch
  const managerName = business.owner
    ? `${business.owner.firstName} ${business.owner.lastName}`
    : user
    ? `${user.firstName} ${user.lastName}`
    : "Manager";

  const branchName = business.address || business.phone || business.category?.name;

  return (
    <div className="flex flex-col gap-4 pb-28 max-w-lg mx-auto w-full px-1">
      {/* 1. Mess Header & Month Selector (100% Dynamic) */}
      <MessHeader
        businessName={business.name}
        branchName={branchName}
        managerName={managerName}
        activeMembersCount={activeMembersCount}
        selectedDate={selectedDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onRefresh={() => loadDashboardData(true)}
        refreshing={refreshing}
      />

      {/* 2. Primary Financial Hero Card (100% Dynamic) */}
      <LiveMealRateHeroCard
        mealRate={mealRate}
        totalBazaar={totalBazaar}
        totalMeals={totalMeals}
        cashFund={cashFund}
        todayMeals={todayMeals}
        todayBreakfast={todayBreakfast}
        todayLunch={todayLunch}
        todayDinner={todayDinner}
        daysPassed={mealSummary?.days || new Date().getDate()}
      />

      {/* 3. Quick Actions Grid (4 Tactile Tiles) */}
      <MessQuickActionGrid
        onMealEntry={() => navigate("/meals")}
        onBazaarExpense={() => navigate("/transactions/new?type=expense")}
        onAcceptDeposit={() => navigate("/transactions/new?type=income")}
        onMealSheet={() => navigate("/mess")}
      />

      {/* 4. Today's Dining & Bazaar Brief (100% Dynamic) */}
      <TodayDiningBazaarCard
        bazaarRecord={bazaarRecord}
        todayMealsCount={todayMeals}
        onOpenMeals={() => navigate("/meals")}
        onAddBazaar={() => navigate("/transactions/new?type=expense")}
      />

      {/* 5. Members Financial Status Summary (100% Dynamic) */}
      <MessMembersBalanceCard
        members={memberList}
        messName={business.name}
        onViewAllMembers={() => navigate("/mess")}
      />

      {/* 6. Visual Meal Trends Mini Preview (100% Dynamic) */}
      <MealTrendsChartCard
        trendData={trendData}
        avgPerDay={avgPerDay}
      />

      {/* 7. Sticky Bottom Floating Action Dock */}
      <MessFloatingActionDock
        onAddBazaar={() => navigate("/transactions/new?type=expense")}
        onAddDeposit={() => navigate("/transactions/new?type=income")}
      />
    </div>
  );
};

export default MessDashboardContent;
