import api from "./api";

export type BusinessType = "personal" | "company" | "mass" | "business";
export type MemberRole = "owner" | "admin" | "member" | "viewer";

export type BusinessSubType =
  | "retail_shop"
  | "restaurant"
  | "online_shop"
  | "service_business"
  | "freelancer"
  | "wholesale"
  | "other";

export type PaymentMethod = "cash" | "bank" | "bkash" | "nagad" | "other";

export interface IBusiness {
  _id: string;
  name: string;
  type: BusinessType;
  category?: { _id: string; name: string };
  mealEnabled: boolean;
  currency: string;
  status: boolean;
  owner: { _id: string; firstName: string; lastName: string; email: string };
  createdAt: string;

  // Business Mode fields
  businessType?: BusinessSubType;
  phone?: string;
  address?: string;
  logoUrl?: string;
  openingBalance?: number;
  cashBalance?: number;
  bankBalance?: number;
  invoiceSettings?: { prefix: string; nextNumber: number };
  paymentMethods?: PaymentMethod[];
}

export interface IBusinessMembership {
  _id: string;
  business: IBusiness;
  role: MemberRole;
  status: "active" | "invited" | "inactive";
  joinedAt: string;
}
export interface IBusinessCategory {
  // ✅ এটা add করো
  _id: string;
  name: string;
  isGlobal: boolean;
  status: boolean;
}
export interface IBusinessTransactionCategory {
  _id: string;
  name: string;
  type: "income" | "expense" | "both";  // ← এটা যোগ করুন
  isGlobal: boolean;
  status: boolean;
}
export const businessService = {
  getMyBusinesses: async (): Promise<IBusinessMembership[]> => {
    const { data } = await api.get("/businesses/my");
    return data.data;
  },

  getCategories: async () => {
    const { data } = await api.get("/categories");
    return data.data;
  },

  createCategory: async (name: string) => {
    const { data } = await api.post("/categories", { name });
    return data.data;
  },

  geTransactiontCategories: async (businessId: string) => {
    const { data } = await api.get(`/transaction-categories/${businessId}`);
    return data.data as IBusinessTransactionCategory[];
  },

  createBusiness: async (payload: {
    name: string;
    type: BusinessType;
    category?: string;
    businessType?: BusinessSubType;
    phone?: string;
    address?: string;
    logoUrl?: string;
    currency?: string;
    openingBalance?: number;
  }): Promise<IBusiness> => {
    const { data } = await api.post("/businesses", payload);
    return data.data;
  },
  completeOnboarding: async (): Promise<void> => {
    await api.post('/businesses/complete-onboarding');
  },
  updateBusiness: async (
    businessId: string,
    payload: Partial<{
      name: string;
      businessType: BusinessSubType;
      phone: string;
      address: string;
      logoUrl: string;
      currency: string;
      invoiceSettings: { prefix: string; nextNumber: number };
      paymentMethods: PaymentMethod[];
      openingBalance?: number;
    }>,
  ): Promise<IBusiness> => {
    const { data } = await api.patch(`/businesses/${businessId}`, payload);
    return data.data;
  },
  getMembers: async (businessId: string) => {
    const { data } = await api.get(`/business-members/${businessId}`);

    return data.data.map((m: { _id: string; firstName: string; lastName: string; email: string; role: string }) => ({
      _id: m._id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      role: m.role,
    }));
  }
};
