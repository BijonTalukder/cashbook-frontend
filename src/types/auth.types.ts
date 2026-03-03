export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  defaultBusiness?: string;
  onboardingCompleted: boolean;
  avatar?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  businessType: "personal" | "company" | "mass";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: IUser;
    token: string;
    business?: {
      _id: string;
      name: string;
      type: string;
      mealEnabled: boolean;
    };
  };
}
