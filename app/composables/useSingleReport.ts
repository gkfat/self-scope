import {
    singleReportResponseSchema, type SingleReportResponse, 
} from '../../shared/schemas/api/singleReport.schema';
import type { SingleReportSystem } from '../../shared/report/systems';

/** What is missing for a report, as the server says it (422), or that the reading is not published yet (404). */
export type SingleReportNeed = 'PROFILE_REQUIRED' | 'BLOOD_REQUIRED' | 'MBTI_REQUIRED' | 'NOT_PUBLISHED';

type Failure = {
    statusCode?: number;
    data?: { code?: string };
};

const NEEDS: readonly string[] = [
    'PROFILE_REQUIRED',
    'BLOOD_REQUIRED',
    'MBTI_REQUIRED',
];

/**
 * The single-dimension report of one system, for a member (kept) or a guest (made on the spot, not kept). It waits
 * until what the visitor has entered is known, then asks once; if something is missing it says what.
 */
export function useSingleReport(system: SingleReportSystem | null) {
    const { post } = useApi();
    const { restore } = useGuestSession();
    const { state } = useExploration();
    const { initAuthListener } = useAuth();

    const report = ref<SingleReportResponse | null>(null);
    const status = ref<'loading' | 'ready' | 'needs' | 'failed'>(system ? 'loading' : 'failed');
    const need = ref<SingleReportNeed | null>(null);

    async function load() {
        if (!system) return;

        status.value = 'loading';
        restore();

        try {
            report.value = singleReportResponseSchema.parse(await post<unknown>('/api/single-reports', { system }, {}, 'optional'));
            status.value = 'ready';
        } catch (error) {
            const failure = error as Failure;
            const code = failure.data?.code;

            if (failure.statusCode === 422 && code && NEEDS.includes(code)) {
                need.value = code as SingleReportNeed;
                status.value = 'needs';

                return;
            }

            if (failure.statusCode === 404) {
                need.value = 'NOT_PUBLISHED';
                status.value = 'needs';

                return;
            }

            console.error('[single-report] failed to load:', error);
            status.value = 'failed';
        }
    }

    onMounted(() => {
        initAuthListener();
    });

    // What the visitor has entered arrives asynchronously; the report is asked for once it is known
    watch(() => state.value.loaded, (loaded) => {
        if (loaded) void load();
    }, { immediate: true });

    return {
        report, status, need, reload: load,
    };
}
