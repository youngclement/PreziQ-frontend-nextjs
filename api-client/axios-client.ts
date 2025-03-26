import axios, { AxiosError } from 'axios';
import { toast } from '@/hooks/use-toast';
import { authApi } from './auth-api';

let axiosClient = axios.create({
  baseURL:
    'http://ec2-54-169-33-117.ap-southeast-1.compute.amazonaws.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosClient.defaults.timeout = 1000 * 60 * 10;

// axiosClient.interceptors.request.use(
//   function (config) {
//     // Do something before request is sent
//     return config;
//   },
//   function (error) {
//     // Do something with request error
//     return Promise.reject(error);
//   }
// );

// // Add a request interceptor
axiosClient.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
});

// let refreshTokenPromise = null;

axiosClient.interceptors.response.use(
  (response: any) => {

    return response;
  },
  (error: AxiosError) => {
    const originalRequests = error.config;

    // if (
    //   (error.response?.status === 401 || isTestingRefresh) ||
    //   originalRequests
    // )
    if ( error.response?.status === 401 &&originalRequests) {
      if (!refreshTokenPromise) {
        refreshTokenPromise = authApi
          .refreshToken()
          .then((data) => {
            const newAccessToken = data?.data?.accessToken;

            if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
            }
            return newAccessToken;
          })
          .catch((_error) => {
            return Promise.reject(_error);
          })
          .finally(() => {
            refreshTokenPromise = null;
          });
      }

      return refreshTokenPromise.then((accessToken) => {

        localStorage.setItem('accessToken', accessToken);
        return axiosClient(originalRequests);
      });
    }

    let errorMessage = error?.message;
    if (error.response?.data?.message) {
      errorMessage = error.response?.data?.message;
    }
    if (error.response?.status !== 410) {
      toast({
        title: errorMessage,
      });
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
