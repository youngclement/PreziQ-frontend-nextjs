export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
  };
}

export interface BodyLogin {
    email?: string,
    password: string,
    phoneNumber?: string
}
