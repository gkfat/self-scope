import { classifyRoute } from '../utils/routeAccess';
import {
    getAuthUser, verifyAuthToken,
} from '../utils/auth';
import { AuthError } from '../../shared/types/errors';

/**
 * Global Authentication Middleware
 *
 * Behavior (see classifyRoute):
 * 1. public / self: skip authentication here
 * 2. optional: authenticate when a token is present; anonymous otherwise
 * 3. required (default): a valid token is mandatory
 *
 * The verified payload is stored in event.context.auth.
 */
export default defineEventHandler(async (event) => {
    if (!event.path.startsWith('/api')) {
        return;
    }

    const access = classifyRoute(event.method, event.path);

    if (access === 'public' || access === 'self') {
        return;
    }

    try {
        if (access === 'optional') {
            event.context.auth = await getAuthUser(event);
            return;
        }

        event.context.auth = await verifyAuthToken(event);
    } catch (error) {
        if (error instanceof AuthError) {
            throw createError({
                statusCode: 401,
                statusMessage: error.message,
            });
        }

        throw error;
    }
});
