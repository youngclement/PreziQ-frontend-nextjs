import axiosClient from './axios-client';

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
      defaultBackgroundMusic?: string; //luật
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
      defaultBackroundMusic?: string;
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

export interface SessionHistoryResponseByCode {
  success: boolean;
  message: string;
  data: {
    meta: PaginationMeta;
    content: Session[];
  };
  meta: {
    timestamp: string;
    instance: string;
  };
}

interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface Session {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  sessionId: string;
  sessionCode: string;
  joinSessionQrUrl: string;
  sessionStatus: string;
  collection: Collection;
  hostUser: HostUser;
  startTime: string;
}

interface Collection {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  collectionId: string;
  title: string;
  description: string;
  isPublished: boolean;
  coverImage: string;
  defaultBackgroundMusic: string;
  topic: string;
}

interface HostUser {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const sessionsApi = {
  createSession: async (
    data: CreateSessionRequest
  ): Promise<SessionResponse> => {
    const response = await axiosClient.post<SessionResponse>('/sessions', data);
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
  getSessionHistoryByCode: async (
    sessionCode: string
  ): Promise<SessionHistoryResponseByCode> => {
    const response = await axiosClient.get<SessionHistoryResponseByCode>(
      `/sessions/me?filter=sessionCode~'${sessionCode}'`
    );
    return response.data;
  },
};
