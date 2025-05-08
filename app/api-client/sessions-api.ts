import { axiosInstance } from './axios-instance';

class SessionsApi {
  // ... existing code ...

  getSessionById(sessionId: string) {
    return axiosInstance.get(`/sessions/${sessionId}`);
  }

  getSessionByCode(sessionCode: string) {
    return axiosInstance.get(`/sessions/code/${sessionCode}`);
  }

  // Thêm API lấy tổng kết phiên học
  getSessionSummary(sessionCode: string) {
    return axiosInstance.get(`/sessions/${sessionCode}/summary`);
  }

  // ... existing code ...
}

export const sessionsApi = new SessionsApi();
