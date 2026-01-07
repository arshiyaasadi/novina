/**
 * Standard error response structure
 */
export interface ApiError {
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Standard error codes for API responses
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  details?: unknown,
  code?: ErrorCode
): { error: ApiError; status: number } {
  return {
    error: {
      error,
      details,
      code: code || ErrorCode.INTERNAL_SERVER_ERROR,
    },
    status,
  };
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  validation: (details?: unknown) =>
    createErrorResponse("Validation failed", 400, details, ErrorCode.VALIDATION_ERROR),
  
  unauthorized: (message = "Invalid credentials") =>
    createErrorResponse(message, 401, undefined, ErrorCode.UNAUTHORIZED),
  
  forbidden: (message = "Access forbidden") =>
    createErrorResponse(message, 403, undefined, ErrorCode.FORBIDDEN),
  
  notFound: (message = "Resource not found") =>
    createErrorResponse(message, 404, undefined, ErrorCode.NOT_FOUND),
  
  conflict: (message = "Resource conflict") =>
    createErrorResponse(message, 409, undefined, ErrorCode.CONFLICT),
  
  internalServerError: (message = "Internal server error") =>
    createErrorResponse(message, 500, undefined, ErrorCode.INTERNAL_SERVER_ERROR),
};

