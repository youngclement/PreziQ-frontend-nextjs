import axiosClient from "./axios-client";

// Activity type definitions
export type ActivityType =
  | "QUIZ_BUTTONS"
  | "QUIZ_CHECKBOXES"
  | "QUIZ_TRUE_OR_FALSE"
  | "QUIZ_TYPE_ANSWER"
  | "QUIZ_REORDER"
  | "INFO_SLIDE";

export interface ActivityTypeInfo {
  key: ActivityType;
  name: string;
  description: string;
  icon: string;
}

export interface CreateActivityPayload {
  collectionId: string;
  activityType?: ActivityType;
  title?: string;
  description?: string;
  isPublished?: boolean;
  backgroundColor?: string;
  backgroundImage?: string;
  customBackgroundMusic?: string;
}

export interface UpdateActivityPayload {
  activityType?: ActivityType;
  title?: string;
  description?: string;
  isPublished?: boolean;
  backgroundColor?: string;
  backgroundImage?: string;
  customBackgroundMusic?: string;
}

// Quiz types
export interface ButtonsQuizPayload {
  type: "CHOICE";
  questionText: string;
  timeLimitSeconds?: number;
  pointType?: "STANDARD" | "NO_POINTS" | "DOUBLE_POINTS";
  answers: {
    answerText: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export interface CheckboxesQuizPayload {
  type: "CHOICE";
  questionText: string;
  timeLimitSeconds?: number;
  pointType?: "STANDARD" | "NO_POINTS" | "DOUBLE_POINTS";
  answers: {
    answerText: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export interface TypeAnswerQuizPayload {
  type: "TYPE_ANSWER";
  questionText: string;
  timeLimitSeconds?: number;
  pointType?: "STANDARD" | "NO_POINTS" | "DOUBLE_POINTS";
  correctAnswer: string;
}

export interface TrueFalseQuizPayload {
  type: "TRUE_FALSE";
  questionText: string;
  timeLimitSeconds?: number;
  pointType?: "STANDARD" | "NO_POINTS" | "DOUBLE_POINTS";
  correctAnswer: boolean;
}

export interface ReorderQuizPayload {
  type: "REORDER";
  questionText: string;
  timeLimitSeconds: number;
  pointType: string;
  correctOrder: string[];
}

export type QuizPayload =
  | ButtonsQuizPayload
  | CheckboxesQuizPayload
  | TypeAnswerQuizPayload
  | TrueFalseQuizPayload
  | ReorderQuizPayload;

export interface ActivityResponse {
  success: boolean;
  message: string;
  data: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    activityId: string;
    activityType: ActivityType;
    title: string;
    description: string;
    isPublished: boolean;
    orderIndex: number;
    backgroundColor?: string;
    backgroundImage?: string;
    customBackgroundMusic?: string;
  };
  meta: {
    timestamp: string;
    instance: string;
  };
}

export interface ActivityTypesResponse {
  success: boolean;
  message: string;
  data: ActivityTypeInfo[];
  meta: {
    timestamp: string;
    instance: string;
  };
}

export const activitiesApi = {
  /**
   * Create a new activity
   * @param payload Activity data to create
   * @returns Promise with API results
   */
  createActivity(payload: CreateActivityPayload) {
    return axiosClient.post<ActivityResponse>("/activities", payload);
  },

  /**
   * Get all activity types
   * @returns Promise with the list of activity types
   */
  getActivityTypes() {
    return axiosClient.get<ActivityTypesResponse>("/activities/types");
  },

  /**
   * Update an existing activity (including changing its type)
   * @param activityId ID of the activity to update
   * @param payload Data to update
   * @returns Promise with API results
   */
  updateActivity(activityId: string, payload: UpdateActivityPayload) {
    return axiosClient.put<ActivityResponse>(
      `/activities/${activityId}`,
      payload
    );
  },

  /**
   * Delete an activity (also deletes associated quiz or slide)
   * @param activityId ID of the activity to delete
   * @returns Promise with API results
   */
  deleteActivity(activityId: string) {
    return axiosClient.delete<{ success: boolean; message: string }>(
      `/activities/${activityId}`
    );
  },

  /**
   * Update a buttons quiz
   * @param activityId ID of the activity
   * @param payload Quiz data
   * @returns Promise with API results
   */
  updateButtonsQuiz(activityId: string, payload: ButtonsQuizPayload) {
    return axiosClient.put(`/activities/${activityId}/quiz`, payload);
  },

  /**
   * Update a checkboxes quiz
   * @param activityId ID of the activity
   * @param payload Quiz data
   * @returns Promise with API results
   */
  updateCheckboxesQuiz: async (
    activityId: string,
    payload: CheckboxesQuizPayload
  ) => {
    console.log("Updating checkboxes quiz with payload:", payload);
    try {
      const response = await axiosClient.put(
        `/activities/${activityId}/quiz`,
        payload
      );
      console.log("Checkboxes quiz update response:", response);
      return response;
    } catch (error) {
      console.error("Error updating checkboxes quiz:", error);
      throw error;
    }
  },

  /**
   * Update a type answer quiz
   * @param activityId ID of the activity
   * @param payload Quiz data
   * @returns Promise with API results
   */
  updateTypeAnswerQuiz(activityId: string, payload: TypeAnswerQuizPayload) {
    return axiosClient.put(`/activities/${activityId}/quiz`, payload);
  },

  /**
   * Update a true/false quiz
   * @param activityId ID of the activity
   * @param payload Quiz data
   * @returns Promise with API results
   */
  updateTrueFalseQuiz(activityId: string, payload: TrueFalseQuizPayload) {
    return axiosClient.put(`/activities/${activityId}/quiz`, payload);
  },

  /**
   * Update a reorder quiz
   * @param activityId ID of the activity
   * @param payload Quiz data
   * @returns Promise with API results
   */
  updateReorderQuiz(activityId: string, payload: ReorderQuizPayload) {
    return axiosClient.put(`/activities/${activityId}/quiz`, payload);
  },
};
