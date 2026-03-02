import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IBusiness } from "../services/business.service";

interface BusinessState {
  activeBusiness: IBusiness | null;
  setActiveBusiness: (b: IBusiness) => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      activeBusiness: null,
      setActiveBusiness: (b) => set({ activeBusiness: b }),
    }),
    { name: "business-storage" },
  ),
);
