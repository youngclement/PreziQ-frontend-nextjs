import axiosClient from "@/api-client/axios-client";


export interface CreateSessionRequest {
  collectionId: string;
}

export interface SessionResponse {
  success: boolean;
  message: string;
  data: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    sessionId: string;
    collection: {
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      collectionId: string;
      title: string;
      description: string;
      isPublished: boolean;
      coverImage: string;
    };
    hostUser: {
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      updatedBy: string;
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    sessionCode: string;
    startTime: string;
    sessionStatus: string;
    joinSessionQrUrl: string;
  };
  meta: {
    timestamp: string;
    instance: string;
  };
}

export interface SessionHistoryResponse {
  success: boolean;
  message: string;
  data: Array<{
    sessionId: string;
    sessionCode: string;
    startTime: string;
    endTime: string;
    sessionStatus: string;
    collection: {
      collectionId: string;
      title: string;
      description: string;
      coverImage: string;
    };
    hostUser: {
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    participantHistoryResponses: {};
  }>;
  meta: {
    timestamp: string;
    instance: string;
  };
}

export const sessionsApi = {
  createSession: async (
    data: CreateSessionRequest
  ): Promise<SessionResponse> => {
    const response = await axiosClient.post<SessionResponse>("/sessions", data);
    return response.data;
  },

  getSessionHistory: async (
    sessionId: string
  ): Promise<SessionHistoryResponse> => {
    const response = await axiosClient.get<SessionHistoryResponse>(
      `/sessions/${sessionId}/history`
    );
    return response.data;
  },
};
