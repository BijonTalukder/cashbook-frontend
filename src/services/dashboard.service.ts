import api from "./api";
import type { ITransaction } from "./transaction.service";

export interface IBusinessSummary {
  todaySales: number;
  todayPurchases: number;
  todayExpenses: number;
  totalReceivable: number;
  totalPayable: number;
  cashBalance: number;
  bankBalance: number;
  currentProfit: number;
  recentTransactions: ITransaction[];
  salesOverview: { date: string; total: number }[];
}

export const dashboardService = {
  getBusinessSummary: async (businessId: string): Promise<IBusinessSummary> => {
    const { data } = await api.get(`/dashboard/${businessId}`);
    return data.data;
  },
};
