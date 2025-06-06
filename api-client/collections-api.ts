import { Collection } from '@/app/collections/components/types';
import axiosClient from './axios-client';

interface CreateCollectionPayload {
  title: string;
  description?: string;
  coverImage?: string;
  isPublished?: boolean;
  defaultBackgroundMusic?: string;
  topic: string;
}

interface UpdateCollectionPayload {
  title?: string;
  description?: string;
  coverImage?: string;
  isPublished?: boolean;
  defaultBackgroundMusic?: string;
  topic?: string;
}

interface GetCollectionsParams {
  page?: number;
  size?: number;
  query?: string;
  isPublished?: boolean;
  owner?: string;
  sort?: string;
}

interface GetGroupedCollectionsByTopicParams {
  page?: number;
  size?: number;
}

export const collectionsApi = {
  /**
   * Tạo một collection mới
   * @param payload Thông tin collection cần tạo (title là bắt buộc)
   * @returns Promise với kết quả từ API
   */
  createCollection(payload: CreateCollectionPayload) {
    return axiosClient.post('/collections', payload);
  },

  /**
   * Lấy thông tin một collection theo ID
   * @param id ID của collection
   * @returns Promise với kết quả từ API
   */
  getCollectionById(id: string) {
    return axiosClient.get(`/collections/${id}`);
  },

  /**
   * Lấy danh sách tất cả collections với phân trang
   * @param params Các tham số phân trang và tìm kiếm
   * @returns Promise với kết quả từ API
   */
  getCollections(params: GetCollectionsParams = { page: 1, size: 100 }) {
    return axiosClient.get('/collections', { params });
  },

  /**
   * Lấy danh sách chỉ các collections đã được publish
   * @param params Các tham số phân trang và tìm kiếm
   * @returns Promise với kết quả từ API
   */
  getPublishedCollections(
    params: GetCollectionsParams = { page: 1, size: 100 }
  ) {
    return axiosClient.get('/collections', {
      params: {
        ...params,
        isPublished: true,
      },
    });
  },

  /**
   * Lấy danh sách collections của người dùng hiện tại
   * @param params Các tham số phân trang và tìm kiếm
   * @returns Promise với kết quả từ API
   */
  getMyCollections(params: GetCollectionsParams = { page: 1, size: 100 }) {

    return axiosClient.get('/collections/me', { params });

  },

  /**
   * Cập nhật thông tin một collection
   * @param id ID của collection
   * @param payload Thông tin cần cập nhật (tất cả đều là optional)
   * @returns Promise với kết quả từ API
   */
  updateCollection(id: string, payload: UpdateCollectionPayload) {
    return axiosClient.patch(`/collections/${id}`, payload);
  },

  /**
   * Xóa một collection
   * @param id ID của collection cần xóa
   * @returns Promise với kết quả từ API
   */
  deleteCollection(id: string) {
    return axiosClient.delete(`/collections/${id}`);
  },

  /**
   * Lấy danh sách các topics của collection
   * @returns Promise với kết quả từ API
   */
  getCollectionTopics() {
    return axiosClient.get('/collections/topics');
  },

  /**
   * Lấy danh sách collections được nhóm theo topic
   * @param params Các tham số phân trang
   * @returns Promise với kết quả từ API
   */
  getGroupedCollectionsByTopic(
    params: GetGroupedCollectionsByTopicParams = { page: 1, size: 10 }
  ) {
    return axiosClient.get('/collections/grouped/topics', { params });

  },

  /**
   * Copy một collection
   * @param id ID của collection cần copy
   * @returns Promise với kết quả từ API
   */
  copyCollection(id: string) {
    return axiosClient.post(`/collections/${id}/copy`);

  },
};
