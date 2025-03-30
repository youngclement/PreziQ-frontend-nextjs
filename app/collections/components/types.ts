export interface Collection {
	id: string;
	title: string;
	description: string;
	coverImage: string;
	isPublished: boolean;
	defaultBackgroundMusic?: string;
	createdAt?: string;
	updatedAt?: string;
	createdBy?: string;
}

export interface Activity {
	id: string;
	collection_id: string;
	title: string;
	description: string;
	is_published: boolean;
	created_at?: string;
	updated_at?: string;
}

// Interface để mapping dữ liệu từ API
export interface ApiCollectionResponse {
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
		content: Collection[];
	};
	meta: {
		timestamp: string;
		instance: string;
	};
}

export interface ApiCollectionDetail {
	success: boolean;
	message: string;
	data: Collection;
	meta: {
		timestamp: string;
		instance: string;
	};
}
