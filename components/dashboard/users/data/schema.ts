import { z } from 'zod';

const userStatusSchema = z.union([
	z.literal('active'),
	z.literal('inactive'),
	z.literal('invited'),
	z.literal('suspended'),
]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export interface Permission {
	id: string;
	name: string;
	apiPath: string;
	httpMethod: string;
	module: string;
}

export interface Role {
	id: string;
	name: string;
	description: string;
	active: boolean;
	permissions: Permission[];
}

export interface User {
	id: string;
	email: string;
	phoneNumber?: string;
	firstName: string;
	lastName: string;
	nickname?: string;
	avatar?: string;
	birthDate?: string;
	gender?: string;
	nationality?: string;
	isVerified: boolean;
	roles: Role[];
	createdAt: string;
	provider?: string;
}

export const userSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	firstName: z.string(),
	lastName: z.string(),
	isVerified: z.boolean(),
	roles: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			description: z.string(),
			active: z.boolean(),
			permissions: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					apiPath: z.string(),
					httpMethod: z.string(),
					module: z.string(),
				})
			),
		})
	),
	createdAt: z.string(),
	provider: z.string().optional(),
});

export const userListSchema = z.array(userSchema);
