import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import { authApi } from "./auth-api";

let axiosClient = axios.create({
  baseURL:'https://preziq.duckdns.org/api/v1',

  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});


axiosClient.defaults.timeout = 1000 * 60 * 10;

axiosClient.defaults.withCredentials = true;

// Interceptor cho request
axiosClient.interceptors.request.use((config) => {
  if (!config?.url?.includes("/auth/refresh")) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Khai báo biến refreshTokenPromise để tránh gọi đồng thời
let refreshTokenPromise: Promise<string> | null = null;

// Interceptor cho response
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Xử lý lỗi 401
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Lấy thông tin lỗi từ response
      const errorData = error.response.data as any;
      let shouldRefresh = false;

      // Kiểm tra điều kiện để refresh token (code 1005)
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        shouldRefresh = errorData.errors.some((err: any) => err.code === 1005);
      } else if (errorData?.code === 1005) {
        shouldRefresh = true;
      }

      if (shouldRefresh) {
        if (!refreshTokenPromise) {
          refreshTokenPromise = authApi
            .refreshToken()
            .then((response) => {
              const newAccessToken =
                response?.data?.data?.accessToken ||
                response?.data?.accessToken;
              if (newAccessToken) {
                localStorage.setItem("accessToken", newAccessToken);
                return newAccessToken;
              }
              return Promise.reject(
                "Không nhận được access token từ API refresh"
              );
            })
            .catch((refreshError) => {
              localStorage.removeItem("accessToken");
              window.location.href = "/login"; // Chuyển hướng về trang đăng nhập
              return Promise.reject(refreshError);
            })
            .finally(() => {
              refreshTokenPromise = null;
            });
        }

        return refreshTokenPromise.then((accessToken) => {
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        });
      }
    }

    // Xử lý thông báo lỗi
    let errorMessage = error.message;
    if (error.response?.data && typeof error.response.data === "object") {
      const data = error.response.data as Record<string, any>;
      if (data.errors && Array.isArray(data.errors)) {
        errorMessage = data.errors.map((err: any) => err.message).join("; ");
      } else if (data.message) {
        errorMessage = data.message;
      }
    }

    if (error.response?.status !== 410) {
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
