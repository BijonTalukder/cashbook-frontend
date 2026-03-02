import api from "./api";

export type BusinessType = "personal" | "company" | "mass";
export type MemberRole = "owner" | "admin" | "member" | "viewer";

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

  createBusiness: async (payload: {
    name: string;
    type: BusinessType;
    category?: string;
  }): Promise<IBusiness> => {
    const { data } = await api.post("/businesses", payload);
    return data.data;
  },
  getMembers: async (
    businessId: string,
  ): Promise<
    {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    }[]
  > => {
    const { data } = await api.get(`/business-members/${businessId}`);
    // ✅ response structure: { data: [{ user: {...}, role, status }] }
    return (
      data.data as {
        user: {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
        role: string;
        status: string;
      }[]
    )
      .filter((m) => m.status === "active")
      .map((m) => ({
        _id: m.user._id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        role: m.role,
      }));
  },
};
