import axios from 'axios';

const axiosClient = axios.create({
  baseURL:
    'http://ec2-54-169-33-117.ap-southeast-1.compute.amazonaws.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});
// // Add a request interceptor
// axios.interceptors.request.use(function (config) {
//     // Do something before request is sent
//     return config;
//   }, function (error) {
//     // Do something with request error
//     return Promise.reject(error);
//   });

// Add a response interceptor
axiosClient.interceptors.response.use(
  function (response: any) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  function (error: any) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  }
);

axiosClient.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Đảm bảo token được gửi
  }
  return config;
});

export default axiosClient;
