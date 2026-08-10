import api from "./api";

export interface IProduct {
  _id: string;
  business: string;
  name: string;
  sku?: string;
  category?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl?: string;
  status: boolean;
  createdAt: string;
}

export interface IProductPayload {
  businessId: string;
  name: string;
  sku?: string;
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  imageUrl?: string;
}

export const productService = {
  getAll: async (businessId: string, opts?: { search?: string; lowStock?: boolean }): Promise<IProduct[]> => {
    const { data } = await api.get(`/products/business/${businessId}`, {
      params: {
        ...(opts?.search ? { search: opts.search } : {}),
        ...(opts?.lowStock ? { lowStock: "true" } : {}),
      },
    });
    return data.data;
  },

  getOne: async (id: string): Promise<IProduct> => {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  },

  create: async (payload: IProductPayload): Promise<IProduct> => {
    const { data } = await api.post("/products", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<IProductPayload>): Promise<IProduct> => {
    const { data } = await api.patch(`/products/${id}`, payload);
    return data.data;
  },

  adjustStock: async (id: string, type: "increase" | "decrease" | "set", quantity: number): Promise<IProduct> => {
    const { data } = await api.post(`/products/${id}/adjust-stock`, { type, quantity });
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
