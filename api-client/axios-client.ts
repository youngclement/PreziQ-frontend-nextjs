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
axiosClient.defaults.withCredentials = true;

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

    // Kiểm tra nếu có phản hồi và mã trạng thái là 401
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Lấy thông tin lỗi từ response
      const errorData = error.response.data;
      let shouldRefresh = false;

      // Kiểm tra nếu có mảng errors và tìm code 1005
      if (errorData.errors && Array.isArray(errorData.errors)) {
        shouldRefresh = errorData.errors.some((err: any) => err.code === 1005);
      } else if (errorData.code === 1005) {
        // Trường hợp lỗi không nằm trong mảng errors
        shouldRefresh = true;
      }

      // Chỉ gọi refresh token nếu code là 1005
      if (shouldRefresh) {
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
              // Nếu refresh token thất bại, xóa token và yêu cầu đăng nhập lại
              localStorage.removeItem('accessToken');
              window.location.href = '/login'; // Chuyển hướng về trang đăng nhập
              return Promise.reject(refreshError);
            })
            .finally(() => {
              refreshTokenPromise = null;
            });
        }

        return refreshTokenPromise.then((accessToken) => {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        });
      } else {
        // const errorMessage = error.response?.data?.errors?.length
        //   ? error.response.data.errors.map((err: any) => err.message).join('; ')
        //   : error.response?.data?.message ||
        //     error.message ||
        //     'Đã xảy ra lỗi. Vui lòng thử lại!';

        // toast({
        //   title: errorMessage,
        //   variant: 'destructive',
        // });
        return Promise.reject(error);
      }
    }

    // Xử lý các lỗi khác (không phải 401)
    // const errorMessage = error.response?.data?.errors?.length
    //   ? error.response.data.errors.map((err: any) => err.message).join('; ')
    //   : error.response?.data?.message ||
    //     error.message ||
    //     'Đã xảy ra lỗi. Vui lòng thử lại!';

        
    // toast({
    //   title: errorMessage,
    // });

    return Promise.reject(error);
  }
);

export default axiosClient;
