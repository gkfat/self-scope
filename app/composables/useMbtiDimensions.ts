import { z } from 'zod';
import {
    submissionResponseSchema, testAttemptItemSchema,
} from '../../shared/schemas/api/test.schema';
import type { DimensionScore } from '../../shared/utils/personalityScoring';

/** Where the test page keeps the result just worked out, for this browser tab only. */
export const MBTI_RESULT_STORAGE_KEY = 'self-scope:mbti-result';

/**
 * The strength of each of the four pairs for the member's latest result, when that result is of this type.
 * It comes from the result the test page just kept in this tab (a guest's, or a member's just after the test), or
 * else from the member's latest saved attempt. Null when there is none or it is of another type: the page then shows
 * the type alone, never scores that belong to someone else's or an older result.
 */
export function useMbtiDimensions(type: string) {
    const {
        isAuthenticated, initAuthListener,
    } = useAuth();
    const { get } = useApi();
    const dimensions = ref<Record<string, DimensionScore> | null>(null);

    function readKeptResult() {
        try {
            const raw = sessionStorage.getItem(MBTI_RESULT_STORAGE_KEY);

            if (!raw) return;

            const parsed = submissionResponseSchema.safeParse(JSON.parse(raw));

            if (parsed.success && parsed.data.result === type) dimensions.value = parsed.data.dimensions;
        } catch (error) {
            console.warn('[mbti] kept result unreadable:', error);
        }
    }

    async function loadLatestAttempt() {
        try {
            const attempts = z.array(testAttemptItemSchema).parse(await get<unknown>('/api/test-attempts'));
            const latest = attempts[0];

            if (latest && latest.result === type && latest.dimensions) dimensions.value = latest.dimensions;
        } catch (error) {
            console.error('[mbti] could not load the latest attempt:', error);
        }
    }

    onMounted(() => {
        initAuthListener();
        readKeptResult();
    });

    // The sign-in state arrives asynchronously; the saved attempt is the fallback when nothing was kept in this tab
    watch(isAuthenticated, (signedIn) => {
        if (signedIn && !dimensions.value) void loadLatestAttempt();
    }, { immediate: true });

    return { dimensions };
}
