// src/types/api.ts

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message: string;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
  data: null;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: import('./roles').Role;
        fullName: string;
      };
    }
  }
}
