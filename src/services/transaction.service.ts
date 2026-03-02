import api from "./api";

export type TxnType = "income" | "expense" | "transfer";
export type SplitType = "none" | "equal" | "custom" | "percentage";
export type SettleStatus = "not_applicable" | "pending" | "partial" | "settled";

export interface ITxnCategory {
  _id: string;
  name: string;
  type: "income" | "expense" | "both";
  icon?: string;
  group?: string;
}

export interface IMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
}

export interface IPaidFor {
  member: IMember;
  amount: number;
  note?: string;
}

export interface ITransaction {
  _id: string;
  business: string;
  type: TxnType;
  amount: number;
  date: string;
  category: ITxnCategory;
  note?: string;
  reference?: string;
  member: IMember;
  toMember?: Pick<IMember, "_id" | "firstName" | "lastName">;
  paidFor: IPaidFor[];
  splitType: SplitType;
  settlementStatus: SettleStatus;
  settledAmount: number;
  createdAt: string;
}

export interface ITxnSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface ICreateTxnPayload {
  businessId: string;
  type: TxnType;
  amount: number;
  category: string;
  note?: string;
  date?: string;
  reference?: string;
  memberId?: string;
  toMember?: string;
  paidFor?: { member: string; amount: number; note?: string }[];
  splitType?: SplitType;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IGetAllResult {
  transactions: ITransaction[];
  summary: ITxnSummary;
  pagination: IPagination;
}

/* ── Pending dues types ───────────────────────────────── */
export interface IDueTransaction {
  _id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface IPendingDue {
  from: Pick<IMember, "_id" | "firstName" | "lastName" | "email">;
  to: Pick<IMember, "_id" | "firstName" | "lastName" | "email">;
  amount: number;
  transactions: IDueTransaction[];
}

/* ── Settlement types ────────────────────────────────── */
export interface ISettlement {
  _id: string;
  transaction: string;
  paidBy: Pick<IMember, "_id" | "firstName" | "lastName" | "email">;
  paidTo: Pick<IMember, "_id" | "firstName" | "lastName" | "email">;
  amount: number;
  type: "full" | "partial";
  note?: string;
  date: string;
  createdAt: string;
}

/* ── Monthly summary types ───────────────────────────── */
export interface IMonthData {
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export interface IMonthlySummary {
  year: number;
  months: IMonthData[];
}

/* ── Service ─────────────────────────────────────────── */
export const transactionService = {
  /* ── Transactions ───────────────────────────────── */
  getAll: async (
    businessId: string,
    params?: Record<string, string>,
  ): Promise<IGetAllResult> => {
    const query = new URLSearchParams(params).toString();
    const { data } = await api.get(
      `/transactions/business/${businessId}?${query}`,
    );
    return data.data as IGetAllResult;
  },

  create: async (payload: ICreateTxnPayload): Promise<ITransaction> => {
    const { data } = await api.post("/transactions", payload);
    return data.data as ITransaction;
  },

  update: async (
    id: string,
    payload: Partial<ICreateTxnPayload>,
  ): Promise<ITransaction> => {
    const { data } = await api.patch(`/transactions/${id}`, payload);
    return data.data as ITransaction;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  settle: async (
    id: string,
    payload: { amount: number; paidTo: string; note?: string },
  ): Promise<{
    settledAmount: number;
    status: SettleStatus;
    remaining: number;
  }> => {
    const { data } = await api.post(`/transactions/${id}/settle`, payload);
    return data.data as {
      settledAmount: number;
      status: SettleStatus;
      remaining: number;
    };
  },

  getSettlements: async (id: string): Promise<ISettlement[]> => {
    const { data } = await api.get(`/transactions/${id}/settlements`);
    return data.data as ISettlement[];
  },

  getPendingDues: async (businessId: string): Promise<IPendingDue[]> => {
    const { data } = await api.get(`/transactions/dues/${businessId}`);
    return data.data as IPendingDue[];
  },

  getMonthlySummary: async (
    businessId: string,
    year?: number,
  ): Promise<IMonthlySummary> => {
    const { data } = await api.get(
      `/transactions/summary/${businessId}?year=${year ?? new Date().getFullYear()}`,
    );
    return data.data as IMonthlySummary;
  },

  /* ── Categories ─────────────────────────────────── */
  getCategories: async (businessId: string): Promise<ITxnCategory[]> => {
    const { data } = await api.get(`/transaction-categories/${businessId}`);
    return data.data as ITxnCategory[];
  },

  createCategory: async (payload: {
    businessId: string;
    name: string;
    type?: "income" | "expense" | "both";
  }): Promise<ITxnCategory> => {
    const { data } = await api.post("/transaction-categories", payload);
    return data.data as ITxnCategory;
  },
};
