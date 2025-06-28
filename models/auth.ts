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
  email?: string;
  password: string;
  phoneNumber?: string;
}

export interface Role {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  roleId: string;
  name: string;
  description: string;
  active: boolean;
}

export interface User {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  rolesSecured: Role[];
}

export interface AccountResponse {
  success: boolean;
  message: string;
  data: User;
  meta: {
    timestamp: string;
    instance: string;
  };
}
