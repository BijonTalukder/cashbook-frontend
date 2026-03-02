import api from "./api";

export interface IMealMember {
  mealId: string;
  member: { _id: string; firstName: string; lastName: string; email: string };
  count: number;
  note?: string;
}

export interface IMealDay {
  date: string; // YYYY-MM-DD
  members: IMealMember[];
  total: number;
}

export interface IMealSummary {
  totalMeals: number;
  daysWithMeals: number;
  year: number;
  month: number;
}

const mealService = {
  getMonthMeals: async (businessId: string, year: number, month: number) => {
    const { data } = await api.get("/meals", {
      params: { businessId, year, month },
    });
    return data.data as {
      days: Record<string, IMealDay>;
      summary: IMealSummary;
    };
  },

  getSummary: async (businessId: string) => {
    const { data } = await api.get("/meals/summary", {
      params: { businessId },
    });
    return data.data as {
      total: number;
      days: number;
      month: number;
      year: number;
    };
  },

  addOrUpdateMeal: async (payload: {
    businessId: string;
    count: number;
    date?: string; // admin: any date YYYY-MM-DD
    memberId?: string; // admin: any member
    note?: string;
  }) => {
    const { data } = await api.post("/meals", payload);
    return data.data;
  },

  updateMeal: async (
    mealId: string,
    payload: { count?: number; note?: string },
  ) => {
    const { data } = await api.patch(`/meals/${mealId}`, payload);
    return data.data;
  },

  deleteMeal: async (mealId: string) => {
    const { data } = await api.delete(`/meals/${mealId}`);
    return data;
  },
};

export default mealService;
