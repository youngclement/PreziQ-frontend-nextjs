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
  data: {
    meta: {
      currentPage: number;
      pageSize: number;
      totalPages: number;
      totalElements: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    content: Array<{
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      updatedBy?: string;
      sessionId: string;
      sessionCode: string;
      joinSessionQrUrl: string;
      sessionStatus: string;
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
      startTime: string;
      endTime?: string;
    }>;
  };
  meta: {
    timestamp: string;
    instance: string;
  };
}

export interface SessionParticipantsResponse {
  success: boolean;
  message: string;
  data: {
    meta: {
      currentPage: number;
      pageSize: number;
      totalPages: number;
      totalElements: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    content: Array<{
      sessionParticipantId: string;
      displayName: string;
      displayAvatar: string;
      finalScore: number;
      finalRanking: number;
      finalCorrectCount: number;
      finalIncorrectCount: number;
      user?: {
        userId: string;
        email: string;
      };
    }>;
  };
  meta: {
    timestamp: string;
    instance: string;
  };
}

export interface ParticipantSubmissionsResponse {
  success: boolean;
  message: string;
  data: {
    meta: {
      currentPage: number;
      pageSize: number;
      totalPages: number;
      totalElements: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    content: Array<{
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      activitySubmissionId: string;
      activity: {
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        updatedBy?: string;
        activityId: string;
        activityType: string;
        title: string;
        description: string;
        isPublished: boolean;
        orderIndex: number;
        backgroundColor?: string;
        backgroundImage?: string;
        quiz?: {
          createdAt: string;
          updatedAt: string;
          createdBy: string;
          updatedBy: string;
          quizId: string;
          questionText: string;
          timeLimitSeconds: number;
          pointType: string;
          quizAnswers: Array<{
            createdAt: string;
            updatedAt: string;
            createdBy: string;
            quizAnswerId: string;
            answerText: string;
            isCorrect: boolean;
            orderIndex: number;
          }>;
          quizLocationAnswers: any[];
        };
      };
      answerContent: string;
      isCorrect: boolean;
      responseScore: number;
    }>;
  };
  meta: {
    timestamp: string;
    instance: string;
  };
}

export interface SessionDetailResponse {
  message: string;
  data: {
    sessionId: string;
    sessionCode: string;
    joinSessionQrUrl: string;
    sessionStatus: string;
    collection: {
      collectionId: string;
      title: string;
      description: string;
      isPublished: boolean;
      coverImage: string;
      defaultBackgroundMusic?: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      updatedBy: string;
    };
    hostUser: {
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      nickname?: string;
      phoneNumber?: string;
      avatar?: string;
      birthDate?: string;
      gender?: string;
      nationality?: string;
      rolesSecured?: Array<{
        roleId: string;
        name: string;
        description: string;
      }>;
      createdAt: string;
      updatedAt: string;
    };
    startTime: string;
    endTime?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    statistics: {
      totalParticipants: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
      correctAnswerRate: number;
      activities?: Array<{
        activityId: string;
        title: string;
        correctAnswerRate: number;
        averageResponseTime: number;
      }>;
    };
    participants: Array<{
      sessionParticipantId: string;
      displayName: string;
      displayAvatar: string;
      finalScore: number;
      finalRanking: number;
      finalCorrectCount: number;
      finalIncorrectCount: number;
      user?: {
        userId: string;
        email: string;
      };
    }>;
  };
  meta: {
    timestamp: string;
    path: string;
    status: number;
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

  getMySessionsHistory: async (
    page = 1,
    limit = 100
  ): Promise<SessionHistoryResponse> => {
    const response = await axiosClient.get<SessionHistoryResponse>(
      `/sessions/me?page=${page}&size=${limit}`
    );
    return response.data;
  },

  getSessionHistoryById: async (
    sessionId: string
  ): Promise<SessionDetailResponse> => {
    const response = await axiosClient.get<SessionDetailResponse>(
      `/sessions/${sessionId}`
    );
    return response.data;
  },

  getSessionParticipants: async (
    sessionId: string,
    page = 1,
    limit = 100
  ): Promise<SessionParticipantsResponse> => {
    const response = await axiosClient.get<SessionParticipantsResponse>(
      `/sessions/${sessionId}/participants?page=${page}&size=${limit}`
    );
    return response.data;
  },

  getParticipantSubmissions: async (
    sessionId: string,
    participantId: string,
    page = 1,
    limit = 100
  ): Promise<ParticipantSubmissionsResponse> => {
    const response = await axiosClient.get<ParticipantSubmissionsResponse>(
      `/sessions/${sessionId}/participants/${participantId}/submissions?page=${page}&size=${limit}`
    );
    return response.data;
  },
};
