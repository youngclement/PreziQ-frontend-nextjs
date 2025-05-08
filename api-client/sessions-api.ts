import axiosClient from "./axios-client";

// Types for the session history response
export interface SessionHistoryResponse {
  session: {
    sessionId: string;
    collection: {
      collectionId: string;
      title: string;
      description: string;
      thumbnailUrl: string;
      isPublished: boolean;
    };
    hostUser: {
      userId: string;
      displayName: string;
      email: string;
      profilePictureUrl: string;
    };
    sessionCode: string;
    startTime: string;
    endTime: string;
    sessionStatus: string;
    createdAt: string;
    updatedAt: string;
  };
  participantHistoryResponses: Array<{
    sessionParticipantId: string;
    displayName: string;
    displayAvatar: string;
    finalScore: number;
    finalRanking: number;
    finalCorrectCount: number;
    finalIncorrectCount: number;
    activitySubmissions: Array<{
      activitySubmissionId: string;
      answerContent: string;
      isCorrect: boolean;
      responseScore: number;
    }>;
  }>;
}

export const sessionsApi = {
  /**
   * Get history for a specific session
   * @param sessionId The ID of the session
   * @returns Promise with API result
   */
  getSessionHistory(sessionId: string) {
    return axiosClient.get<{ data: SessionHistoryResponse }>(
      `/sessions/${sessionId}/history`
    );
  },

  /**
   * Get all sessions
   * @param params Pagination parameters
   * @returns Promise with API result
   */
  getSessions(
    params: { page?: number; size?: number } = { page: 1, size: 20 }
  ) {
    return axiosClient.get("/sessions", { params });
  },
};
