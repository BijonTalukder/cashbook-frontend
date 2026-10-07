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
import { useFormat } from "../../i18n/useFormat";
import { toCurrency } from "../../utils/currency";
import { useRefreshHandler } from "../../native/refresh";

import {
  MessHeader,
  LiveMealRateHeroCard,
  MessQuickActionGrid,
  TodayDiningBazaarCard,
  type IBazaarRecord,
  MessMembersBalanceCard,
  type IMessMemberItem,
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
  settlements?: Array<{
    from: string;
    fromId: string;
    to: string;
    toId: string;
    amount: number;
  }>;
}

export const MessDashboardContent: React.FC<MessDashboardContentProps> = ({
  business,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { money } = useFormat(toCurrency(business.currency));

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic raw data states
  const [messSummary, setMessSummary] = useState<ApiMessSummary | null>(null);
  const [mealSummary, setMealSummary] = useState<{ total: number; days: number } | null>(null);
  const [monthMeals, setMonthMeals] = useState<Record<string, IMealDay>>({});
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
          mealService.getMonthMeals(business._id, year, month),
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

  // Month window for the fallback transaction filters.
  const monthStart = useMemo(
    () => new Date(year, month, 1, 0, 0, 0, 0),
    [year, month],
  );
  const monthEnd = useMemo(
    () => new Date(year, month + 1, 0, 23, 59, 59, 999),
    [year, month],
  );

  const txnsInSelectedMonth = useMemo(
    () =>
      allTxns.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd;
      }),
    [allTxns, monthStart, monthEnd],
  );

  // 100% Dynamic Financial Calculations
  const totalBazaar = useMemo(() => {
    if (messSummary?.totalExpense !== undefined && messSummary.totalExpense > 0) {
      return messSummary.totalExpense;
    }
    // Fallback must respect the selected month, otherwise the figure leaks
    // expenses from prior months into the current view.
    return txnsInSelectedMonth
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
  }, [messSummary, txnsInSelectedMonth]);

  const totalMeals = useMemo(() => {
    if (mealSummary?.total !== undefined && mealSummary.total > 0) {
      return mealSummary.total;
    }
    return Object.values(monthMeals).reduce((s, d) => s + (d.total || 0), 0);
  }, [mealSummary, monthMeals]);

  // Prefer the server-computed perPersonShare when available — it's the
  // authoritative meal rate for the mess. Only fall back to a local divide
  // when the mess summary isn't yet loaded.
  const mealRate = useMemo(() => {
    if (messSummary?.perPersonShare !== undefined && messSummary.perPersonShare > 0) {
      return messSummary.perPersonShare;
    }
    return totalMeals > 0 ? totalBazaar / totalMeals : 0;
  }, [messSummary, totalMeals, totalBazaar]);

  const totalIncome = useMemo(() => {
    if (messSummary?.totalIncome !== undefined && messSummary.totalIncome > 0) {
      return messSummary.totalIncome;
    }
    return txnsInSelectedMonth
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
  }, [messSummary, txnsInSelectedMonth]);

  const cashFund = totalIncome - totalBazaar;

  // Most recent expense inside the selected month, used for the "today's
  // bazaar" record. Limited to the selected month to avoid surfacing an old
  // record when the user is browsing a different month.
  const recentBazaarTxn = useMemo(() => {
    return (
      txnsInSelectedMonth
        .filter((t) => t.type === "expense")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ||
      null
    );
  }, [txnsInSelectedMonth]);

  // Active members count dynamically
  const activeMembersCount = useMemo(() => {
    return (
      businessMembers.length ||
      messSummary?.members?.length ||
      messSummary?.memberCount ||
      0
    );
  }, [businessMembers, messSummary]);

  // Dynamic Today's meals calculation. The backend meal record is a single
  // count per member per day — there is no breakfast/lunch/dinner split in
  // any endpoint, so the dashboard must not invent one.
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMeals = monthMeals[todayKey]?.total ?? 0;

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
        // Only surface an overdue value when the backend actually provides one.
        // Otherwise the card simply omits the overdue row.
        overdueDays: undefined,
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

  return (
    <div className="flex flex-col gap-4 pb-28 max-w-lg mx-auto w-full px-1">
      {/* 1. Mess Header & Month Selector (100% Dynamic) */}
      <MessHeader
        businessName={business.name}
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
        daysPassed={mealSummary?.days || 0}
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

      {/* 6. Real Settlements / To Settle Up (100% Dynamic from Backend) */}
      {messSummary?.settlements && messSummary.settlements.length > 0 && (
        <section className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {t("mess.toSettleUp")}
              </h2>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/mess")}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              {t("common.details") || "বিস্তারিত"}
            </button>
          </div>

          <div className="space-y-2">
            {messSummary.settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {s.from?.[0] || "U"}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-rose-700 dark:text-rose-300">{s.from}</span>
                    <span className="mx-1.5 text-slate-400 dark:text-neutral-500">
                      {t("mess.pays")}
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{s.to}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-neutral-100 text-sm shrink-0">
                  {money(s.amount, { decimals: 0 })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Sticky Bottom Floating Action Dock */}
      <MessFloatingActionDock
        onAddBazaar={() => navigate("/transactions/new?type=expense")}
        onAddDeposit={() => navigate("/transactions/new?type=income")}
      />
    </div>
  );
};

export default MessDashboardContent;
