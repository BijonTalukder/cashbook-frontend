import api from "./api";

export interface IPayment {
  _id: string;
  business: string;
  direction: "in" | "out";
  partyType: "customer" | "supplier";
  party: { _id: string; name: string; phone?: string };
  amount: number;
  method: string;
  note?: string;
  date: string;
  createdAt: string;
}

export const paymentService = {
  receive: async (payload: {
    businessId: string; customerId: string; amount: number; method?: string; note?: string; date?: string;
  }): Promise<IPayment> => {
    const { data } = await api.post("/payments/receive", payload);
    return data.data;
  },

  pay: async (payload: {
    businessId: string; supplierId: string; amount: number; method?: string; note?: string; date?: string;
  }): Promise<IPayment> => {
    const { data } = await api.post("/payments/pay", payload);
    return data.data;
  },

  getAll: async (businessId: string, params?: Record<string, string>): Promise<{
    payments: IPayment[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const { data } = await api.get(`/payments/business/${businessId}`, { params });
    return data.data;
  },
};
