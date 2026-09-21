import api from "./api";

export interface ICategory {
  _id: string;
  name: string;
  business?: string;
  status?: boolean;
}

export const categoryService = {
  getByBusiness: async (businessId: string): Promise<ICategory[]> => {
    const { data } = await api.get(`/categories/business/${businessId}`);
    return data.data;
  },

  create: async (payload: { name: string; businessId: string }): Promise<ICategory> => {
    const { data } = await api.post("/categories", payload);
    return data.data;
  },
};
