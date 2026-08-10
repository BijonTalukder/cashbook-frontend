import api from "./api";
import type { ITransaction } from "./transaction.service";

export interface ICustomer {
  _id: string;
  business: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance: number;
  notes?: string;
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  status: boolean;
  createdAt: string;
}

export interface ICustomerPayload {
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance?: number;
  notes?: string;
}

export const customerService = {
  getAll: async (businessId: string, search?: string): Promise<ICustomer[]> => {
    const { data } = await api.get(`/customers/business/${businessId}`, {
      params: search ? { search } : undefined,
    });
    return data.data;
  },

  getOne: async (id: string): Promise<{ customer: ICustomer; transactions: ITransaction[] }> => {
    const { data } = await api.get(`/customers/${id}`);
    return data.data;
  },

  create: async (payload: ICustomerPayload): Promise<ICustomer> => {
    const { data } = await api.post("/customers", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<ICustomerPayload>): Promise<ICustomer> => {
    const { data } = await api.patch(`/customers/${id}`, payload);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
