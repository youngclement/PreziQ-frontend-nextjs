import { Collection, CollectionResponse } from "@/types/collection";
import { collectionsApi } from "@/api-client/collections-api";

export const CollectionService = {
  /**
   * Get all published collections
   */
  getAllPublishedCollections: async (
    page: number = 1,
    size: number = 12
  ): Promise<CollectionResponse> => {
    const response = await collectionsApi.getCollections({
      page,
      size,
      filter: "isPublished=true",
    });

    // Transform response to match our expected format
    const data = response.data.data || response.data;
    return {
      items: data.content || [],
      total: data.meta?.totalElements || 0,
      page: data.meta?.currentPage || page,
      size: data.meta?.pageSize || size,
      hasMore: data.meta?.hasNext || false,
    };
  },

  /**
   * Get user's own collections
   */
  getMyCollections: async (
    page: number = 1,
    size: number = 12
  ): Promise<CollectionResponse> => {
    const response = await collectionsApi.getCollections({
      page,
      size,
    });

    // Transform response to match our expected format
    const data = response.data.data || response.data;
    return {
      items: data.content || [],
      total: data.meta?.totalElements || 0,
      page: data.meta?.currentPage || page,
      size: data.meta?.pageSize || size,
      hasMore: data.meta?.hasNext || false,
    };
  },

  /**
   * Get collection by ID
   */
  getCollectionById: async (id: string): Promise<Collection> => {
    const response = await collectionsApi.getCollectionById(id);
    // Transform response if needed
    return response.data.data || response.data;
  },
};
