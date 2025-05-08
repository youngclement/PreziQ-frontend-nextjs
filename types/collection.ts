export interface Collection {
  id?: string;
  collectionId: string;
  title: string;
  description: string;
  coverImage?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  defaultBackgroundMusic?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  itemCount?: number;
  owner?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface CollectionResponse {
  items: Collection[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}
