import api from "./api";

export interface ISaleItem {
  product: { _id: string; name: string; unit: string } | string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type SaleStatus = "paid" | "partial" | "due";

export interface ISale {
  _id: string;
  business: string;
  invoiceNumber: string;
  customer?: { _id: string; name: string; phone?: string } | null;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: SaleStatus;
  date: string;
  note?: string;
  createdAt: string;
}

export interface ISalePayload {
  businessId: string;
  customerId?: string;
  items: { product: string; quantity: number; unitPrice?: number }[];
  discount?: number;
  tax?: number;
  paidAmount?: number;
  paymentMethod?: string;
  note?: string;
  date?: string;
}

export interface ISalesResult {
  sales: ISale[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const saleService = {
  getAll: async (businessId: string, params?: Record<string, string>): Promise<ISalesResult> => {
    const { data } = await api.get(`/sales/business/${businessId}`, { params });
    return data.data;
  },

  getOne: async (id: string): Promise<ISale> => {
    const { data } = await api.get(`/sales/${id}`);
    return data.data;
  },

  create: async (payload: ISalePayload): Promise<ISale> => {
    const { data } = await api.post("/sales", payload);
    return data.data;
  },
};
