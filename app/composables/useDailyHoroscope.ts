import type { DailyHoroscopeResponse } from '../../shared/schemas/api/horoscope.schema';

/**
 * `missing`: some of today's content is not published yet (404). `needsProfile`: the member has no birth date, so
 * there is no sign to read the sky from (422).
 */
export type DailyHoroscopeStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'needsProfile' | 'failed';

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const candidate = error as { statusCode?: number; status?: number };

    return candidate.statusCode ?? candidate.status;
}

/**
 * Today's sign horoscope, shared by the fortune page and the home block. Nothing is drawn or kept: the server works
 * the answer out from the date and the member's sign, and asking writes nothing.
 */
export function useDailyHoroscope() {
    const { get } = useApi();
    const today = useState<DailyHoroscopeResponse | null>('dailyHoroscope', () => null);
    const status = useState<DailyHoroscopeStatus>('dailyHoroscopeStatus', () => 'idle');

    async function load(): Promise<void> {
        if (status.value !== 'ready') status.value = 'loading';

        try {
            today.value = await get<DailyHoroscopeResponse>('/api/horoscope/daily');
            status.value = 'ready';
        } catch (error) {
            const code = statusOf(error);

            if (code === 404) {
                status.value = 'missing';
            } else if (code === 422) {
                status.value = 'needsProfile';
            } else {
                console.error('[useDailyHoroscope] request failed:', error);
                status.value = 'failed';
            }
        }
    }

    function clear(): void {
        today.value = null;
        status.value = 'idle';
    }

    return {
        today, status, load, clear,
    };
}
