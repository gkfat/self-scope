/**
 * Custom error types for better error handling.
 * Always throw one of these instead of a bare Error or createError.
 */

export type ErrorDetails = Record<string, unknown>;

/**
 * Base application error
 */
export class AppError extends Error {
    statusCode: number;
    code?: string;
    details?: ErrorDetails;

    constructor(
        message: string,
        statusCode: number = 500,
        code?: string,
        details?: ErrorDetails,
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

/**
 * Authentication errors (401)
 */
export class AuthError extends AppError {
    constructor(message: string = 'Authentication failed', code?: string) {
        super(message, 401, code);
    }
}

/**
 * Authorization errors (403)
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden', code?: string) {
        super(message, 403, code);
    }
}

/**
 * Resource not found (404)
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource', code?: string) {
        super(`${resource} not found`, 404, code);
    }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
    constructor(
        message: string = 'Validation failed',
        details?: ErrorDetails,
        code?: string,
    ) {
        super(message, 400, code, details);
    }
}

/**
 * Resource conflict (409), e.g. a repeat action that needs explicit confirmation
 */
export class ConflictError extends AppError {
    constructor(
        message: string = 'Resource conflict',
        details?: ErrorDetails,
        code?: string,
    ) {
        super(message, 409, code, details);
    }
}

/**
 * Resource no longer available (410), e.g. an expired guest session
 */
export class GoneError extends AppError {
    constructor(message: string = 'Resource expired', code?: string) {
        super(message, 410, code);
    }
}

/**
 * Request is well-formed but cannot be processed (422), e.g. missing MBTI result
 */
export class UnprocessableError extends AppError {
    constructor(message: string, code?: string, details?: ErrorDetails) {
        super(message, 422, code, details);
    }
}

/**
 * Not enough points or points expired (402)
 */
export class InsufficientPointsError extends AppError {
    constructor(message: string = 'Insufficient points', details?: ErrorDetails) {
        super(message, 402, 'INSUFFICIENT_POINTS', details);
    }
}

/**
 * Business logic errors (400)
 */
export class BusinessLogicError extends AppError {
    constructor(message: string, code?: string) {
        super(message, 400, code);
    }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends AppError {
    constructor(message: string = 'Rate limit exceeded', code?: string) {
        super(message, 429, code);
    }
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
    constructor(
        service: string,
        message: string = 'External service error',
        code?: string,
    ) {
        super(`${service}: ${message}`, 502, code);
    }
}

/**
 * Database errors (500)
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed', code?: string) {
        super(message, 500, code);
    }
}

/**
 * Extract a readable message from an unknown thrown value.
 */
export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
