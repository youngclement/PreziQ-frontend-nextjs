import {
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  BodyLogin,
} from '@/models/auth';
import axiosClient from './axios-client';

export const authApi = {
  login(payload: BodyLogin) {
    return axiosClient
      .post('/auth/login', payload)
      .then((response) => {
        const accessToken: string = response.data.data.accessToken;
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          return response;
        } else {
          throw new Error('Login failed: No access token received');
        }
      })
      .catch((error) => {
        console.error('Login error:', error);
        throw error;
      });
  },

  register(payload: RegisterPayload) {
    return axiosClient.post('/auth/register', payload);
  },

  logout() {
    return axiosClient.post('/auth/logout');
  },

  verifyEmail(payload: string) {
    return axiosClient.post('/auth/verify-active-account', payload);
  },

  resendEmail(payload: string) {
    return axiosClient.post('/auth/resend-verify', payload);
  },

  forgotPassword(payload: string) {
    return axiosClient.post('/auth/forgot-password', payload);
  },

  resetPassword(payload: ResetPasswordPayload) {
    return axiosClient.post('/auth/reset-password', payload);
  },
};
