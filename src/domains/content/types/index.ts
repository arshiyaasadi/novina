export interface CreateContentData {
  title: string;
  body?: string;
  published?: boolean;
  authorId: string;
}

export interface UpdateContentData {
  title?: string;
  body?: string;
  published?: boolean;
}

export interface ContentResponse {
  id: string;
  title: string;
  body: string | null;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

