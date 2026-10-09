import type {
  AuthResponse,
  ForgotPasswordPayload,
  GoogleLoginPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SimpleResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "../types/auth.types";
import api from "./api";
import { retryRequest } from "./retry";

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    return retryRequest(
      async () => {
        const { data } = await api.post<AuthResponse>("/auth/register", payload, {
          timeout: 45000,
        });
        return data;
      },
      { retries: 2, delayMs: 1500 },
    );
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return retryRequest(
      async () => {
        const { data } = await api.post<AuthResponse>("/auth/login", payload, {
          timeout: 45000,
        });
        return data;
      },
      { retries: 2, delayMs: 1500 },
    );
  },

  googleLogin: async (payload: GoogleLoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/google", payload);
    return data;
  },

  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<SimpleResponse> => {
    const { data } = await api.post<SimpleResponse>(
      "/auth/forgot-password",
      payload,
    );
    return data;
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    const { data } = await api.post<VerifyOtpResponse>(
      "/auth/verify-otp",
      payload,
    );
    return data;
  },

  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<SimpleResponse> => {
    const { data } = await api.post<SimpleResponse>(
      "/auth/reset-password",
      payload,
    );
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};
