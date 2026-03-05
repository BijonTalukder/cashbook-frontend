import api from "./api";

export interface ITransactionSnapshot {
  _id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string;
  categoryName: string;
  note?: string;
  memberName: string;
}
export interface IMessMemberSummary {
  userId: string;
  name: string;
  totalDeposit: number;
  totalMeals: number;
  mealCost: number;
  otherExpense: number;
  totalCost: number;
  balance: number;
}
export interface IInvoice {
  _id: string;
  business: string;
  businessName: string;
  businessType: "personal" | "company" | "mass";
  month: number;
  year: number;
  generatedAt: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactions: ITransactionSnapshot[];
  isMess: boolean;
  mealCategoryId?: string;
  mealCategoryName?: string;
  totalMealCost?: number;
  totalMeals?: number;
  mealRate?: number;
  members?: IMessMemberSummary[];
}
export type IInvoiceListItem = Omit<IInvoice, "transactions" | "members">;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const monthName = (m: number) => MONTHS[m - 1] ?? "";

export const invoiceService = {
  generate: async (
    businessId: string,
    payload: { month: number; year: number; mealCategoryId?: string },
  ): Promise<IInvoice> => {
    const { data } = await api.post(
      `/invoices/${businessId}/generate`,
      payload,
    );
    return data.data;
  },
  list: async (businessId: string): Promise<IInvoiceListItem[]> => {
    const { data } = await api.get(`/invoices/${businessId}`);
    return data.data;
  },
  get: async (businessId: string, invoiceId: string): Promise<IInvoice> => {
    const { data } = await api.get(`/invoices/${businessId}/${invoiceId}`);
    return data.data;
  },
  delete: async (businessId: string, invoiceId: string): Promise<void> => {
    await api.delete(`/invoices/${businessId}/${invoiceId}`);
  },
};
