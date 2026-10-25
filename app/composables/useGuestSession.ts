import type {
    ClaimGuestSessionResponse, CreateGuestSessionResponse,
} from '../../shared/schemas/api/guest.schema';

const STORAGE_KEY = 'guestSessionId';

export type ClaimOutcome =
    | { status: 'saved'; savedAttempts: number }
    | { status: 'nothing' }
    | { status: 'expired' }
    | { status: 'failed'; message: string };

function readStoredId(): string | null {
    try {
        return sessionStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.warn('[useGuestSession] sessionStorage unavailable:', error);
        return null;
    }
}

function writeStoredId(id: string | null) {
    try {
        if (id) {
            sessionStorage.setItem(STORAGE_KEY, id);
        } else {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    } catch (error) {
        console.warn('[useGuestSession] sessionStorage unavailable:', error);
    }
}

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const candidate = error as { statusCode?: number; status?: number };

    return candidate.statusCode ?? candidate.status;
}

/**
 * Anonymous session for visitors. Results live on the server for one day and
 * are only kept if the visitor signs in during that time (FR-032).
 * The id is shared with useApi through the 'guestSessionId' state.
 */
export const useGuestSession = () => {
    const sessionId = useState<string | null>('guestSessionId', () => null);
    const { post } = useApi();

    const restore = () => {
        if (import.meta.client && sessionId.value === null) {
            sessionId.value = readStoredId();
        }
    };

    /**
     * Return the current session id, creating a session if there is none.
     */
    const ensureSession = async (): Promise<string> => {
        restore();

        if (sessionId.value) return sessionId.value;

        const created = await $fetch<CreateGuestSessionResponse>('/api/guest-sessions', { method: 'POST' });

        sessionId.value = created.sessionId;
        writeStoredId(created.sessionId);

        return created.sessionId;
    };

    const forget = () => {
        sessionId.value = null;
        writeStoredId(null);
    };

    /**
     * Save the current session's results into the signed-in account.
     * Call after a successful sign-in.
     */
    const claim = async (): Promise<ClaimOutcome> => {
        restore();

        if (!sessionId.value) return { status: 'nothing' };

        try {
            const result = await post<ClaimGuestSessionResponse>(`/api/guest-sessions/${sessionId.value}/claim`);

            forget();

            return result.savedAttempts > 0
                ? {
                    status: 'saved', savedAttempts: result.savedAttempts,
                }
                : { status: 'nothing' };
        } catch (error) {
            if (statusOf(error) === 410) {
                forget();
                return { status: 'expired' };
            }

            console.error('[useGuestSession] claim failed:', error);

            return {
                status: 'failed',
                message: error instanceof Error ? error.message : '保存失敗，請稍後再試',
            };
        }
    };

    return {
        sessionId: computed(() => sessionId.value),
        ensureSession,
        claim,
        forget,
    };
};
