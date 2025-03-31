import axiosClient from './axios-client';
import {
	Role,
	Permission,
	RoleResponse,
	Meta,
} from '@/components/dashboard/roles/data/schema';

interface ApiResponse<T> {
	success: boolean;
	message: string;
	data: T;
	meta: {
		timestamp: string;
		instance: string;
	};
}

interface PaginatedResponse<T> {
	meta: {
		currentPage: number;
		pageSize: number;
		totalPages: number;
		totalElements: number;
		hasNext: boolean;
		hasPrevious: boolean;
	};
	content: T[];
}

interface CreateRolePayload {
	name: string;
	description: string;
	active: boolean;
	permissions: string[];
}

interface UpdateRolePayload {
	name?: string;
	description?: string;
	active?: boolean;
	permissions?: string[];
}

interface GetRolesParams {
	page?: number;
	size?: number;
	search?: string;
}

interface GetRolesResponse {
	code: number;
	statusCode: number;
	message: string;
	data: {
		meta: Meta;
		content: Role[];
	};
	timestamp: string;
	path: string;
}

export const rolesApi = {
	/**
	 * Tạo một role mới
	 * @param payload Thông tin role cần tạo
	 * @returns Promise với kết quả từ API
	 */
	createRole(payload: CreateRolePayload) {
		return axiosClient.post<ApiResponse<Role>>('/roles', payload);
	},

	/**
	 * Lấy thông tin một role theo ID
	 * @param id ID của role
	 * @returns Promise với kết quả từ API
	 */
	getRoleById(id: string) {
		return axiosClient.get<ApiResponse<Role>>(`/roles/${id}`);
	},

	/**
	 * Lấy danh sách tất cả roles với phân trang và tìm kiếm
	 * @param params Các tham số phân trang và tìm kiếm
	 * @returns Promise với kết quả từ API
	 */
	getRoles(params: GetRolesParams = { page: 1, size: 10 }) {
		return axiosClient.get<ApiResponse<PaginatedResponse<Role>>>('/roles', {
			params,
		});
	},

	/**
	 * Cập nhật thông tin một role
	 * @param id ID của role
	 * @param payload Thông tin cần cập nhật
	 * @returns Promise với kết quả từ API
	 */
	updateRole(id: string, payload: UpdateRolePayload) {
		return axiosClient.patch<ApiResponse<Role>>(`/roles/${id}`, payload);
	},

	/**
	 * Xóa một role
	 * @param id ID của role cần xóa
	 * @returns Promise với kết quả từ API
	 */
	deleteRole(id: string) {
		return axiosClient.delete<ApiResponse<Role>>(`/roles/${id}`);
	},

	/**
	 * Lấy danh sách tất cả permissions có sẵn
	 * @returns Promise với danh sách permissions
	 */
	getAvailablePermissions() {
		return axiosClient.get<ApiResponse<Permission[]>>('/roles/permissions');
	},

	/**
	 * Cập nhật permissions cho một role
	 * @param id ID của role
	 * @param permissions Danh sách permissions mới
	 * @returns Promise với kết quả từ API
	 */
	updateRolePermissions(id: string, permissions: string[]) {
		return axiosClient.patch<ApiResponse<Role>>(`/roles/${id}/permissions`, {
			permissions,
		});
	},
};
