/**
 * Structured logging helpers.
 * Never put answers, reports or other personal content into log fields (NFR-006).
 */

type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

export type LogContext = {
    severity?: Severity;
    message?: string;

    method: string;
    path: string;
    status?: number;
    durationMs?: number;

    userId?: string;
    requestId?: string;

    error?: unknown;
};

export type LogEventContext = {
    severity?: Severity;
    message: string;

    module?: string; // auth / points / firestore
    action?: string; // verifyToken / deductPoints
    userId?: string;
    requestId?: string;

    data?: Record<string, unknown>;
    error?: unknown;
};

function serializeError(error: unknown) {
    if (error === undefined) return {};

    return {
        error: error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
            }
            : error,
    };
}

function write(severity: Severity, payload: Record<string, unknown>) {
    const output = JSON.stringify({
        severity,
        timestamp: new Date().toISOString(),
        ...payload,
    });

    if (severity === 'ERROR') {
        console.error(output);
        return;
    }

    console.log(output);
}

/**
 * API request log
 */
export function logRequest(context: LogContext) {
    const {
        severity = 'INFO', error, ...rest
    } = context;

    write(severity, {
        ...rest,
        ...serializeError(error),
    });
}

/**
 * Service log event
 */
export function logEvent(context: LogEventContext) {
    const {
        severity = 'INFO', error, ...rest
    } = context;

    write(severity, {
        ...rest,
        ...serializeError(error),
    });
}
