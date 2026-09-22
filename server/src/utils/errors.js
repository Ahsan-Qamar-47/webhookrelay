/**
 * Standardized API Error Helper & Formatter
 */

export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Format Zod validation errors into standardized error payload structure
 */
export function formatValidationError(zodError) {
  const issues = zodError.issues || [];
  const message = issues.map((i) => i.message).join(', ');
  const details = issues.map((i) => ({
    field: i.path.join('.'),
    message: i.message,
    code: i.code,
  }));

  return {
    code: 'VALIDATION_ERROR',
    message: message || 'Validation failed',
    details,
  };
}

/**
 * Create standardized success or error payload
 */
export function createErrorResponse(code, message, details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
