import api from "./api";
import type { ITxnCategory } from "./transaction.service";

export interface IExpense {
  _id: string;
  business: string;
  category: ITxnCategory;
  amount: number;
  paymentMethod: string;
  date: string;
  note?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface IExpensePayload {
  businessId: string;
  categoryId: string;
  amount: number;
  paymentMethod?: string;
  note?: string;
  date?: string;
  attachmentUrl?: string;
}

export interface IExpensesResult {
  expenses: IExpense[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const expenseService = {
  getAll: async (businessId: string, params?: Record<string, string>): Promise<IExpensesResult> => {
    const { data } = await api.get(`/expenses/business/${businessId}`, { params });
    return data.data;
  },

  create: async (payload: IExpensePayload): Promise<IExpense> => {
    const { data } = await api.post("/expenses", payload);
    return data.data;
  },
};
