// Constants for the application

export const APP_NAME = "Novina";
export const APP_VERSION = "0.1.0";

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
  },
  CONTENT: {
    LIST: "/api/content",
    CREATE: "/api/content",
    GET: (id: string) => `/api/content/${id}`,
    UPDATE: (id: string) => `/api/content/${id}`,
    DELETE: (id: string) => `/api/content/${id}`,
  },
  USER: {
    PROFILE: "/api/user/profile",
    UPDATE: "/api/user/update",
  },
  RISK_ASSESSMENT: {
    EVALUATE: "/api/risk-assessment/evaluate",
  },
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Validation
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_EMAIL_LENGTH = 255;
export const MAX_NAME_LENGTH = 100;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

