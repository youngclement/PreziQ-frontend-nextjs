import axios, { AxiosError } from 'axios';
import { toast } from '@/hooks/use-toast';
import { authApi } from './auth-api';

let axiosClient = axios.create({
  baseURL: 'https://preziq.duckdns.org/api/v1',
  headers: {
    'Content-Type': 'application/json',
   //withCredentials: true,
  },
});

axiosClient.defaults.timeout = 1000 * 60 * 10;


axiosClient.interceptors.request.use((config) => {
  if (!config?.url.includes('/auth/refresh')) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});


let refreshTokenPromise: Promise<string> | null = null;

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const originalRequest = error.config;

    // Kiểm tra nếu nhận được lỗi 401 và request chưa được retry
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Nếu chưa có lời gọi refresh nào đang chờ, thực hiện lời gọi refresh token
      if (!refreshTokenPromise) {
        refreshTokenPromise = authApi
          .refreshToken()
          .then((response) => {
            const newAccessToken = response?.data?.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
              return newAccessToken;
            }
            return Promise.reject(
              'Không nhận được access token từ API refresh'
            );
          })
          .catch((refreshError) => {
            // Xử lý lỗi refresh nếu cần (ví dụ: redirect đến trang login)
            return Promise.reject(refreshError);
          })
          .finally(() => {
            refreshTokenPromise = null;
          });
      }

      // Sau khi refresh token thành công, cập nhật header của request gốc và retry lại request
      return refreshTokenPromise.then((accessToken) => {
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      });
    }

    // Nếu lỗi không phải 401, thông báo lỗi cho người dùng
    const errorMessage = error.response?.data?.message || error.message;
    toast({
      title: errorMessage,
    });
    return Promise.reject(error);
  }
);


export default axiosClient;
