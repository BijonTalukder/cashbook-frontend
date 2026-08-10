import api from "./api";
import type { ITransaction } from "./transaction.service";

export interface ISupplier {
  _id: string;
  business: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance: number;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  totalPayable: number;
  status: boolean;
  createdAt: string;
}

export interface ISupplierPayload {
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance?: number;
  notes?: string;
}

export const supplierService = {
  getAll: async (businessId: string, search?: string): Promise<ISupplier[]> => {
    const { data } = await api.get(`/suppliers/business/${businessId}`, {
      params: search ? { search } : undefined,
    });
    return data.data;
  },

  getOne: async (id: string): Promise<{ supplier: ISupplier; transactions: ITransaction[] }> => {
    const { data } = await api.get(`/suppliers/${id}`);
    return data.data;
  },

  create: async (payload: ISupplierPayload): Promise<ISupplier> => {
    const { data } = await api.post("/suppliers", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<ISupplierPayload>): Promise<ISupplier> => {
    const { data } = await api.patch(`/suppliers/${id}`, payload);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};
