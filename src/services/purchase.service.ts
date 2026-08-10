import api from "./api";

export interface IPurchaseItem {
  product: { _id: string; name: string; unit: string } | string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type PurchaseStatus = "paid" | "partial" | "due";

export interface IPurchase {
  _id: string;
  business: string;
  referenceNumber: string;
  supplier?: { _id: string; name: string; phone?: string } | null;
  items: IPurchaseItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: PurchaseStatus;
  date: string;
  note?: string;
  createdAt: string;
}

export interface IPurchasePayload {
  businessId: string;
  supplierId?: string;
  items: { product: string; quantity: number; unitPrice?: number }[];
  discount?: number;
  paidAmount?: number;
  paymentMethod?: string;
  note?: string;
  date?: string;
}

export interface IPurchasesResult {
  purchases: IPurchase[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const purchaseService = {
  getAll: async (businessId: string, params?: Record<string, string>): Promise<IPurchasesResult> => {
    const { data } = await api.get(`/purchases/business/${businessId}`, { params });
    return data.data;
  },

  getOne: async (id: string): Promise<IPurchase> => {
    const { data } = await api.get(`/purchases/${id}`);
    return data.data;
  },

  create: async (payload: IPurchasePayload): Promise<IPurchase> => {
    const { data } = await api.post("/purchases", payload);
    return data.data;
  },
};
