import axiosClient from './axios-client';
import { User } from '@/components/dashboard/users/data/schema';

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

interface CreateUserPayload {
	email: string;
	firstName: string;
	lastName: string;
	password?: string;
	roles?: string[];
	isVerified?: boolean;
}

interface InviteUserPayload {
	email: string;
	firstName: string;
	lastName: string;
}

interface UpdateUserPayload {
	email?: string;
	phoneNumber?: string;
	firstName?: string;
	lastName?: string;
	nickname?: string;
	avatar?: string;
	birthDate?: string;
	gender?: string;
	nationality?: string;
	isVerified?: boolean;
	roleIds?: string[];
}

interface GetUsersParams {
	page?: number;
	size?: number;
	search?: string;
}

export const usersApi = {
	/**
	 * Tạo một user mới
	 * @param payload Thông tin user cần tạo
	 * @returns Promise với kết quả từ API
	 */
	createUser(payload: CreateUserPayload) {
		return axiosClient.post<ApiResponse<User>>('/users', payload);
	},

	/**
	 * Mời một user mới tham gia hệ thống
	 * @param payload Thông tin user được mời
	 * @returns Promise với kết quả từ API
	 */
	inviteUser(payload: InviteUserPayload) {
		return axiosClient.post<ApiResponse<User>>('/users/invite', payload);
	},

	/**
	 * Lấy thông tin một user theo ID
	 * @param id ID của user
	 * @returns Promise với kết quả từ API
	 */
	getUserById(id: string) {
		return axiosClient.get<ApiResponse<User>>(`/users/${id}`);
	},

	/**
	 * Lấy thông tin user hiện tại
	 * @returns Promise với kết quả từ API
	 */
	getCurrentUser() {
		return axiosClient.get<ApiResponse<User>>('/users/me');
	},

	/**
	 * Lấy danh sách tất cả users với phân trang và tìm kiếm
	 * @param params Các tham số phân trang và tìm kiếm
	 * @returns Promise với kết quả từ API
	 */
	getUsers(params: GetUsersParams = { page: 1, size: 10 }) {
		return axiosClient.get<ApiResponse<PaginatedResponse<User>>>('/users', {
			params,
		});
	},

	/**
	 * Cập nhật thông tin một user
	 * @param id ID của user
	 * @param payload Thông tin cần cập nhật
	 * @returns Promise với kết quả từ API
	 */
	updateUser(id: string, payload: UpdateUserPayload) {
		return axiosClient.patch<ApiResponse<User>>(`/users/${id}`, payload);
	},

	/**
	 * Xóa một user
	 * @param id ID của user cần xóa
	 * @returns Promise với kết quả từ API
	 */
	deleteUser(id: string) {
		return axiosClient.delete<ApiResponse<User>>(`/users/${id}`);
	},

	/**
	 * Cập nhật vai trò cho một user
	 * @param id ID của user
	 * @param roleIds Danh sách ID các vai trò mới
	 * @returns Promise với kết quả từ API
	 */
	updateUserRoles(id: string, roleIds: string[]) {
		return axiosClient.patch<ApiResponse<User>>(`/users/${id}/roles`, {
			roleIds,
		});
	},

	/**
	 * Kích hoạt hoặc vô hiệu hóa một user
	 * @param id ID của user
	 * @param isActive Trạng thái hoạt động
	 * @returns Promise với kết quả từ API
	 */
	toggleUserStatus(id: string, isActive: boolean) {
		return axiosClient.patch<ApiResponse<User>>(`/users/${id}/status`, {
			isActive,
		});
	},

	/**
	 * Xác minh email cho người dùng
	 * @param id ID của user
	 * @returns Promise với kết quả từ API
	 */
	verifyUser(id: string) {
		return axiosClient.patch<ApiResponse<User>>(`/users/${id}/verify`, {
			isVerified: true,
		});
	},
};
