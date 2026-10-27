import type { KinTodayResponse } from '../../shared/schemas/api/mayaKin.schema';

/** `missing`: the content for today's Kin is not published yet (404). */
export type KinTodayStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'failed';

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const candidate = error as { statusCode?: number; status?: number };

    return candidate.statusCode ?? candidate.status;
}

/**
 * Today's Kin, shared by the Kin page and the home block. The server decides the Taipei date; the client
 * only asks (GET) or unlocks (POST) and shows what comes back.
 */
export function useKinToday() {
    const {
        get, post, 
    } = useApi();
    const today = useState<KinTodayResponse | null>('kinToday', () => null);
    const status = useState<KinTodayStatus>('kinTodayStatus', () => 'idle');
    const unlocking = ref(false);

    async function run(request: () => Promise<KinTodayResponse>): Promise<void> {
        try {
            today.value = await request();
            status.value = 'ready';
        } catch (error) {
            if (statusOf(error) === 404) {
                status.value = 'missing';

                return;
            }

            console.error('[useKinToday] request failed:', error);
            status.value = 'failed';
        }
    }

    /** Ask whether today's Kin has been unlocked. Writes nothing. */
    async function load(): Promise<void> {
        if (status.value !== 'ready') status.value = 'loading';

        await run(() => get<KinTodayResponse>('/api/kin/today'));
    }

    /** Unlock today's Kin; an earlier unlock of the same day comes back unchanged. */
    async function unlock(): Promise<void> {
        if (unlocking.value) return;

        unlocking.value = true;

        try {
            await run(() => post<KinTodayResponse>('/api/kin/today'));
        } finally {
            unlocking.value = false;
        }
    }

    function clear(): void {
        today.value = null;
        status.value = 'idle';
    }

    return {
        today, status, unlocking, load, unlock, clear,
    };
}
