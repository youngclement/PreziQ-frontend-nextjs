import axiosClient from './axios-client';

// Interface cho response của API
interface ApiResponse<T> {
	success: boolean;
	message: string;
	data?: T;
	meta?: {
		timestamp: string;
		instance: string;
	};
}

// Interface cho thông tin người dùng
interface UserProfile {
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	nickname: string;
	avatar: string;
	birthDate: string;
	gender: string;
	nationality: string;
	rolesSecured: Array<{
		createdAt: string;
		updatedAt: string;
		createdBy: string;
		id: string;
		name: string;
		description: string;
		active: boolean;
	}>;
}

// Interface cho request cập nhật profile
interface UpdateProfileRequest {
	firstName: string;
	lastName: string;
	nickname: string;
	avatar: string;
	birthDate: string;
	gender: string;
	nationality: string;
}

// Interface cho request cập nhật mật khẩu
interface UpdatePasswordRequest {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

// Interface cho request cập nhật email
interface UpdateEmailRequest {
	newEmail: string;
}

// Interface cho request xác thực thay đổi email
interface VerifyChangeEmailRequest {
	token: string;
}

export const userApi = {
	/**
	 * Cập nhật thông tin profile của người dùng
	 * @param data - Dữ liệu cập nhật profile
	 * @returns Promise với response từ API
	 */
	updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
		return axiosClient.patch('/users/update-profile', data);
	},

	/**
	 * Cập nhật mật khẩu của người dùng
	 * @param data - Dữ liệu cập nhật mật khẩu
	 * @returns Promise với response từ API
	 */
	updatePassword(
		data: UpdatePasswordRequest
	): Promise<ApiResponse<UserProfile>> {
		return axiosClient.put('/users/update-password', data);
	},

	/**
	 * Cập nhật email của người dùng
	 * @param data - Dữ liệu cập nhật email
	 * @returns Promise với response từ API
	 */
	updateEmail(data: UpdateEmailRequest): Promise<ApiResponse<null>> {
		return axiosClient.put('/users/update-email', data);
	},

	/**
	 * Xác thực thay đổi email
	 * @param data - Token xác thực
	 * @returns Promise với response từ API
	 */
	verifyChangeEmail(
		data: VerifyChangeEmailRequest
	): Promise<ApiResponse<null>> {
		return axiosClient.post('/users/verify-change-email', data);
	},
};
