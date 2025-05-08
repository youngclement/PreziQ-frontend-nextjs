import axiosInstance from './axios-client';
import { Permission } from '@/components/dashboard/permissions/data/schema';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    totalPages: number;
    currentPage: number;
    totalElements: number;
  };
}

interface PaginatedResponse<T> {
  content: T[];
  meta: {
    totalPages: number;
    currentPage: number;
    totalElements: number;
  };
}

interface CreatePermissionPayload {
  name: string;
  apiPath: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  module?: string;
}

interface UpdatePermissionPayload {
  name?: string;
  apiPath?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  module?: string;
}

interface GetPermissionsParams {
  page?: number;
  size?: number;
  search?: string;
  module?: string;
}

interface CreateModulePayload {
  moduleName: string;
  permissionIds: string[];
}

export const permissionsApi = {
  /**
   * Lấy danh sách permissions với phân trang và tìm kiếm
   */
  getPermissions: async (params?: GetPermissionsParams) => {
    return axiosInstance.get<ApiResponse<PaginatedResponse<Permission>>>(
      '/permissions',
      {
        params,
      }
    );
  },

  /**
   * Lấy thông tin chi tiết của một permission theo ID
   */
  getPermissionById: async (permissionId: string) => {
    return axiosInstance.get<ApiResponse<Permission>>(
      `/permissions/${permissionId}`
    );
  },

  /**
   * Tạo mới một permission
   */
  createPermission: async (data: CreatePermissionPayload) => {
    return axiosInstance.post<ApiResponse<Permission>>('/permissions', data);
  },

  /**
   * Cập nhật thông tin của một permission
   */
  updatePermission: async (
    permissionId: string,
    data: UpdatePermissionPayload
  ) => {
    return axiosInstance.patch<ApiResponse<Permission>>(
      `/permissions/${permissionId}`,
      data
    );
  },

  /**
   * Xóa một permission
   */
  deletePermission: async (permissionId: string) => {
    return axiosInstance.delete<ApiResponse<Permission>>(
      `/permissions/${permissionId}`
    );
  },

  /**
   * Lấy danh sách các module có sẵn
   */
  getModules: async () => {
    return axiosInstance.get<ApiResponse<string[]>>('/permissions/modules');
  },

  /**
   * Tạo mới một module và gán permissions
   */
  createModule: async (data: CreateModulePayload) => {
    return axiosInstance.post<ApiResponse<{ module: string }>>(
      '/permissions/module',
      data
    );
  },

  /**
   * Xóa một module
   */
  deleteModule: async (moduleName: string) => {
    return axiosInstance.delete<ApiResponse<{ module: string }>>(
      `/permissions/module/${moduleName}`
    );
  },
};
