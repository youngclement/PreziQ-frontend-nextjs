import { toast } from 'sonner';
import axiosClient from '@/api-client/axios-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Define types for location quiz data
interface LocationAnswer {
  longitude: number;
  latitude: number;
  radius: number;
}

interface CreateLocationQuizPayload {
  collectionId: string;
  activityType: string;
  title: string;
  description?: string;
  isPublished?: boolean;
  backgroundColor?: string;
  backgroundImage?: string;
  customBackgroundMusic?: string;
}

interface UpdateLocationQuizPayload {
  questionText: string;
  timeLimitSeconds: number;
  pointType: string;
  locationAnswers: LocationAnswer[];
}

/**
 * Service for handling collection-related API calls
 */
export const CollectionService = {
  /**
   * Reorder activities within a collection
   * @param collectionId The ID of the collection
   * @param orderedActivityIds The ordered array of activity IDs
   * @returns Promise with the result of the reordering operation
   */
  reorderActivities: async (
    collectionId: string,
    orderedActivityIds: string[]
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/collections/${collectionId}/activities/reorder`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderedActivityIds }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reorder activities');
      }

      return await response.json();
    } catch (error) {
      console.error('Error reordering activities:', error);
      throw error;
    }
  },

  /**
   * Reorder questions within an activity
   * @param activityId The ID of the activity
   * @param orderedQuestionIds The ordered array of question IDs
   * @returns Promise with the result of the reordering operation
   */
  reorderQuestions: async (
    activityId: string,
    orderedQuestionIds: string[]
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/activities/${activityId}/questions/reorder`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderedQuestionIds }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reorder questions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error reordering questions:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to reorder questions'
      );
      throw error;
    }
  },

  /**
   * Get a collection by ID
   * @param collectionId The ID of the collection to retrieve
   * @returns Promise with the collection data
   */
  getCollection: async (collectionId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/collections/${collectionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch collection');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching collection:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch collection'
      );
      throw error;
    }
  },

  /**
   * Create a new location quiz activity
   * @param payload Data for creating a new location quiz
   * @returns Promise with the created activity
   */
  createLocationQuizActivity: async (payload: CreateLocationQuizPayload) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/collections/${payload.collectionId}/activities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create location quiz');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating location quiz:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create location quiz'
      );
      throw error;
    }
  },

  /**
   * Create a new matching pair quiz activity
   * @param payload Data for creating a new matching pair quiz
   * @returns Promise with the created activity
   */
  createMatchingPairActivity: async (
    payload: Omit<CreateLocationQuizPayload, 'activityType'> & {
      activityType?: string;
    }
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/collections/${payload.collectionId}/activities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            activityType: 'QUIZ_MATCHING_PAIRS',
          }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to create matching pair quiz'
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating matching pair quiz:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create matching pair quiz'
      );
      throw error;
    }
  },
};
