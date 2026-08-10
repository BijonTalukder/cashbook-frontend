import api from "./api";

export interface IPLBreakdown {
  totalSales: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface IProfitLoss {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  current: IPLBreakdown;
  previous: IPLBreakdown;
}

export const reportService = {
  getProfitLoss: async (businessId: string, from: string, to: string): Promise<IProfitLoss> => {
    const { data } = await api.get(`/reports/profit-loss/${businessId}`, { params: { from, to } });
    return data.data;
  },
};
