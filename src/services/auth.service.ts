import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "../types/auth.types";
import api from "./api";

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    console.log(payload);
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    console.log(data);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};
