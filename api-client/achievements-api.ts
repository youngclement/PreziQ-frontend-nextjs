import axiosClient from './axios-client';

// Define the Achievement type
export interface Achievement {
  achievementId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  requiredPoints: number;
  createdAt?: string;
  updatedAt?: string;
}

// Define payload types for create and update
export interface CreateAchievementPayload {
  name: string;
  description?: string;
  iconUrl?: string;
  requiredPoints: number;
}

export interface UpdateAchievementPayload {
  name?: string;
  description?: string;
  iconUrl?: string;
  requiredPoints?: number;
}

// Define the API response structure for getAllAchievements
export interface AchievementsResponse {
  data: {
    data: {

      content: Achievement[];
    };
  };
}

// Define the API response structure for getMyAchievements
export interface MyAchievementsResponse {
  data: {
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
      content: Achievement[];
    };
    meta: {
      timestamp: string;
      instance: string;
    };
  };

}

export const achievementsApi = {
  // Create a new achievement
  createAchievement(payload: CreateAchievementPayload): Promise<Achievement> {
    return axiosClient.post('/achievements', {
      ...payload,
      name: payload.name.toUpperCase(),
    });
  },

  // Get all achievements
  getAllAchievements(): Promise<Achievement[]> {
    return axiosClient
      .get('/achievements?size=100')
      .then((response: AchievementsResponse) => {
        return response.data.data.content;
      });
  },


  // Get my achievements
  getMyAchievements(): Promise<MyAchievementsResponse['data']['data']> {
    return axiosClient
      .get(`/achievements/me`)
      .then((response: MyAchievementsResponse) => {
        return response.data.data;
      });
  },


  // Get achievement by ID
  getAchievementById(id: string): Promise<Achievement> {
    return axiosClient.get(`/achievements/${id}`);
  },

  // Update an achievement
  updateAchievement(
    id: string,
    payload: UpdateAchievementPayload
  ): Promise<Achievement> {
    return axiosClient.patch(`/achievements/${id}`, {
      ...payload,
      name: payload.name ? payload.name.toUpperCase() : undefined,
    });
  },

  // Delete an achievement
  deleteAchievement(id: string): Promise<void> {
    return axiosClient.delete(`/achievements/${id}`);
  },
};
