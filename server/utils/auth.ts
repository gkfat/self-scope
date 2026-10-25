import type { H3Event } from 'h3';
import { getHeader } from 'h3';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from './firebaseAdmin';
import {
    AuthError, errorMessage,
} from '../../shared/types/errors';
import type { AuthTokenPayload } from '../../shared/types/auth';

/**
 * Verify a raw Firebase ID token.
 */
export async function verifyIdToken(idToken: string): Promise<AuthTokenPayload> {
    try {
        const decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);

        const googleIdentities: unknown = decoded.firebase?.identities?.['google.com'];
        const googleSub = Array.isArray(googleIdentities) && typeof googleIdentities[0] === 'string'
            ? googleIdentities[0]
            : undefined;

        return {
            uid: decoded.uid,
            email: decoded.email,
            email_verified: decoded.email_verified,
            googleSub,
        };
    } catch (error) {
        throw new AuthError(`Invalid authentication token: ${errorMessage(error)}`);
    }
}

/**
 * Verify the Firebase ID token from the Authorization header.
 */
export async function verifyAuthToken(event: H3Event): Promise<AuthTokenPayload> {
    const authHeader = getHeader(event, 'authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthError('Missing or invalid authorization header');
    }

    return verifyIdToken(authHeader.substring('Bearer '.length));
}

/**
 * Require authentication for a route.
 * Usage: const user = await requireAuth(event);
 */
export async function requireAuth(event: H3Event): Promise<AuthTokenPayload> {
    if (event.context.auth) return event.context.auth;

    const auth = await verifyAuthToken(event);
    event.context.auth = auth;

    return auth;
}

/**
 * Get the authenticated user, or null when the request is anonymous.
 * Only a missing token is treated as anonymous; an invalid token is still an error.
 */
export async function getAuthUser(event: H3Event): Promise<AuthTokenPayload | null> {
    if (event.context.auth) return event.context.auth;

    if (!getHeader(event, 'authorization')) return null;

    return requireAuth(event);
}
