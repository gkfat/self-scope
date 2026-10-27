import type { DailyRuneResponse } from '../../shared/schemas/api/rune.schema';

/** `missing`: the content for today's rune is not published yet (404). */
export type DailyRuneStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'failed';

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const candidate = error as { statusCode?: number; status?: number };

    return candidate.statusCode ?? candidate.status;
}

/**
 * Today's rune draw, shared by the fortune page and the home block. The server decides the Taipei date; the client
 * only asks (GET) or draws (POST) and shows what comes back.
 */
export function useDailyRune() {
    const {
        get, post, 
    } = useApi();
    const today = useState<DailyRuneResponse | null>('dailyRune', () => null);
    const status = useState<DailyRuneStatus>('dailyRuneStatus', () => 'idle');
    const drawing = ref(false);

    async function run(request: () => Promise<DailyRuneResponse>): Promise<void> {
        try {
            today.value = await request();
            status.value = 'ready';
        } catch (error) {
            if (statusOf(error) === 404) {
                status.value = 'missing';

                return;
            }

            console.error('[useDailyRune] request failed:', error);
            status.value = 'failed';
        }
    }

    /** Ask whether today's rune has been drawn. Writes nothing. */
    async function load(): Promise<void> {
        if (status.value !== 'ready') status.value = 'loading';

        await run(() => get<DailyRuneResponse>('/api/rune/daily'));
    }

    /** Draw today's rune; an earlier draw of the same day comes back unchanged. */
    async function draw(): Promise<void> {
        if (drawing.value) return;

        drawing.value = true;

        try {
            await run(() => post<DailyRuneResponse>('/api/rune/daily'));
        } finally {
            drawing.value = false;
        }
    }

    function clear(): void {
        today.value = null;
        status.value = 'idle';
    }

    return {
        today, status, drawing, load, draw, clear,
    };
}
