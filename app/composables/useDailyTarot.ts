import type { DailyTarotResponse } from '../../shared/schemas/api/tarot.schema';

/** `missing`: the content for today's card is not published yet (404). */
export type DailyTarotStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'failed';

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const candidate = error as { statusCode?: number; status?: number };

    return candidate.statusCode ?? candidate.status;
}

/**
 * Today's tarot draw, shared by the tarot page and the home block. The server decides the Taipei
 * date; the client only asks (GET) or draws (POST) and shows what comes back.
 */
export function useDailyTarot() {
    const {
        get, post, 
    } = useApi();
    const today = useState<DailyTarotResponse | null>('dailyTarot', () => null);
    const status = useState<DailyTarotStatus>('dailyTarotStatus', () => 'idle');
    const drawing = ref(false);

    async function run(request: () => Promise<DailyTarotResponse>): Promise<void> {
        try {
            today.value = await request();
            status.value = 'ready';
        } catch (error) {
            if (statusOf(error) === 404) {
                status.value = 'missing';

                return;
            }

            console.error('[useDailyTarot] request failed:', error);
            status.value = 'failed';
        }
    }

    /** Ask whether today's card has been drawn. Writes nothing. */
    async function load(): Promise<void> {
        if (status.value !== 'ready') status.value = 'loading';

        await run(() => get<DailyTarotResponse>('/api/tarot/daily'));
    }

    /** Draw today's card; an earlier draw of the same day comes back unchanged. */
    async function draw(): Promise<void> {
        if (drawing.value) return;

        drawing.value = true;

        try {
            await run(() => post<DailyTarotResponse>('/api/tarot/daily'));
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
