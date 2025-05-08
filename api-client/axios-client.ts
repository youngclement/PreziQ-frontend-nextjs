import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import { authApi } from "./auth-api";
import Cookies from "js-cookie";

let axiosClient = axios.create({
  baseURL:
    "http://ec2-54-169-33-117.ap-southeast-1.compute.amazonaws.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

axiosClient.defaults.timeout = 1000 * 60 * 10;

axiosClient.defaults.withCredentials = true;

// Add a function to check if we're in a browser environment
const isBrowser = () => typeof window !== "undefined";

// Interceptor cho request
axiosClient.interceptors.request.use((config) => {
  if (!config?.url?.includes("/auth/refresh")) {
    // Only try to access localStorage in browser environment
    if (isBrowser()) {
      // Ưu tiên token từ localStorage trước
      let token = localStorage.getItem("accessToken");

      // Nếu không có trong localStorage, thử lấy từ cookies
      if (!token) {
        const cookieToken = Cookies.get("accessToken");
        token = cookieToken || null;
      }

      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
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
  async (error: AxiosError) => {
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
          refreshTokenPromise = new Promise<string>((resolve, reject) => {
            authApi
              .refreshToken()
              .then((response) => {
                const newAccessToken =
                  response?.data?.data?.accessToken ||
                  response?.data?.accessToken;
                if (newAccessToken) {
                  if (isBrowser()) {
                    localStorage.setItem("accessToken", newAccessToken);
                    localStorage.setItem(
                      "tokenCreatedAt",
                      Date.now().toString()
                    );

                    // Lưu token mới vào cookie
                    Cookies.set("accessToken", newAccessToken, {
                      expires: 7, // 7 ngày
                      path: "/",
                      secure: process.env.NODE_ENV === "production",
                      sameSite: "lax",
                    });
                  }
                  resolve(newAccessToken);
                } else {
                  reject("Không nhận được access token từ API refresh");
                }
              })
              .catch((refreshError) => {
                if (isBrowser()) {
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("tokenCreatedAt");
                  localStorage.removeItem("userInfo");

                  // Xóa cookie token
                  Cookies.remove("accessToken", { path: "/" });

                  window.location.href = "/login"; // Chuyển hướng về trang đăng nhập
                }
                reject(refreshError);
              })
              .finally(() => {
                refreshTokenPromise = null;
              });
          });
        }

        try {
          const newToken = await refreshTokenPromise;
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        } catch (error) {
          throw error;
        }
      } else {
        // If token can't be refreshed and it's 401 error, redirect to login
        if (isBrowser()) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("tokenCreatedAt");
          localStorage.removeItem("userInfo");

          // Xóa cookie token
          Cookies.remove("accessToken", { path: "/" });

          window.location.href = "/login";
        }
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
