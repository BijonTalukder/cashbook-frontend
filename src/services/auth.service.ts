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

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
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
