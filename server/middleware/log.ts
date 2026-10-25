import { logRequest } from '../utils/logger';

/**
 * Log one line per API request (method, path, status, duration only).
 */
export default defineEventHandler((event) => {
    if (!event.path.startsWith('/api')) {
        return;
    }

    const startTime = Date.now();
    const {
        method, path,
    } = event;

    event.node.res.on('finish', () => {
        logRequest({
            severity: 'INFO',
            method,
            path,
            status: event.node.res.statusCode,
            durationMs: Date.now() - startTime,
            userId: event.context.auth?.uid,
            requestId: event.context.requestId,
        });
    });
});
