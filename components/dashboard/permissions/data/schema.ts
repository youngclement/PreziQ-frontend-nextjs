import { z } from 'zod';

export const permissionSchema = z.object({
	id: z.string(),
	name: z.string(),
	apiPath: z.string(),
	httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
	module: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	createdBy: z.string(),
});

export type Permission = z.infer<typeof permissionSchema>;
