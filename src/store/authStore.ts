import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IUser } from "../types/auth.types";
import { signOutFirebase } from "../config/firebase";

interface AuthState {
  user: IUser | null;
  token: string | null;
  setAuth: (user: IUser, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        void signOutFirebase();
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: "auth-storage" },
  ),
);
