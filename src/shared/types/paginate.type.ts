export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type PaginatedQuery = {
  currentPage?: number;
  pageSize?: number;
  filter?: any;
  filterBy?: string;
  order?: 'ASC' | 'DESC' | string;
  orderBy?: string;
  from?: any;
  to?: any;
  field?: string;
};

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: 'user' | 'admin' | 'moderator';
}
