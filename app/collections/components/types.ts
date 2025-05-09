export interface Collection {
  id: string;
  collectionId: string;
  title: string;
  description: string;
  coverImage: string;
  isPublished: boolean;
  defaultBackgroundMusic?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  categoryId?: string;
  category?: Category;
  _activityCount?: number; // For mock data only
  views?: number;
  likes?: number;
  participants?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  orderIndex?: number;
}

export interface Activity {
  id: string;
  collection_id: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  duration?: number; // in minutes
  activity_type?:
    | "Quiz"
    | "Poll"
    | "Discussion"
    | "Case Study"
    | "Assignment"
    | "Presentation"
    | "Video"
    | "Reading"
    | "Exercise"
    | "Game";
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
