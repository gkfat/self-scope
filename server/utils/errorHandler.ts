/**
 * Global error handler helpers for Nitro
 */

import {
    H3Error, createError,
} from 'h3';
import { AppError } from '../../shared/types/errors';

/**
 * Format error response
 */
export function formatErrorResponse(error: unknown) {
    if (error instanceof H3Error) {
        return {
            success: false,
            error: {
                message: error.message,
                statusCode: error.statusCode,
                code: error.data?.code,
            },
        };
    }

    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                message: error.message,
                statusCode: error.statusCode,
                code: error.code,
                details: error.details,
            },
        };
    }

    console.error('Unhandled error:', error);
    return {
        success: false,
        error: {
            message: 'Internal server error',
            statusCode: 500,
        },
    };
}

/**
 * Convert AppError to H3Error for Nitro
 */
export function toH3Error(error: unknown): H3Error {
    if (error instanceof H3Error) {
        return error;
    }

    if (error instanceof AppError) {
        return createError({
            statusCode: error.statusCode,
            message: error.message,
            data: {
                // h3 only forwards `data`/`statusMessage` to the client JSON body,
                // so duplicate the real reason into `data.message`.
                message: error.message,
                code: error.code,
                details: error.details,
            },
        });
    }

    // Unknown errors must not leak internals to the client.
    console.error('Unhandled error:', error);
    return createError({
        statusCode: 500,
        message: 'Internal server error',
    });
}
