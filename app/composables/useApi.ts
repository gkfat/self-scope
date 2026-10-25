import type { FetchOptions } from 'ofetch';

type AuthMode = 'required' | 'optional';

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const candidate = error as { statusCode?: number; status?: number };

    return candidate.statusCode ?? candidate.status;
}

/**
 * API client composable.
 * - required: needs a signed-in user; attaches the Bearer token and retries once on 401
 * - optional: sends the token when signed in and the guest session header when present,
 *   otherwise stays anonymous (guest flows)
 */
export const useApi = () => {
    const {
        idToken, refreshToken, isAuthenticated,
    } = useAuth();
    const guestSessionId = useState<string | null>('guestSessionId', () => null);

    const withHeaders = (options: FetchOptions, token: string | null): FetchOptions => ({
        ...options,
        headers: {
            ...options.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(!token && guestSessionId.value ? { 'X-Guest-Session-Id': guestSessionId.value } : {}),
        },
    });

    const request = async <T>(
        url: string,
        options: FetchOptions = {},
        mode: AuthMode = 'required',
    ): Promise<T> => {
        if (mode === 'required' && !isAuthenticated.value) {
            throw new Error('Not authenticated');
        }

        const token = idToken.value ?? (mode === 'required' ? await refreshToken() : null);

        if (mode === 'required' && !token) {
            throw new Error('Failed to get authentication token');
        }

        try {
            return await $fetch<T>(url, withHeaders(options, token));
        } catch (error) {
            if (!token || statusOf(error) !== 401) throw error;

            const newToken = await refreshToken();

            if (!newToken) {
                throw new Error('Authentication expired, please login again', { cause: error });
            }

            return await $fetch<T>(url, withHeaders(options, newToken));
        }
    };

    return {
        request,
        get: <T>(url: string, options: FetchOptions = {}, mode: AuthMode = 'required') => request<T>(url, {
            ...options, method: 'GET',
        }, mode),
        post: <T>(url: string, body?: Record<string, unknown>, options: FetchOptions = {}, mode: AuthMode = 'required') => request<T>(url, {
            ...options, method: 'POST', body,
        }, mode),
        put: <T>(url: string, body?: Record<string, unknown>, options: FetchOptions = {}, mode: AuthMode = 'required') => request<T>(url, {
            ...options, method: 'PUT', body,
        }, mode),
        del: <T>(url: string, body?: Record<string, unknown>, options: FetchOptions = {}, mode: AuthMode = 'required') => request<T>(url, {
            ...options, method: 'DELETE', body,
        }, mode),
    };
};
