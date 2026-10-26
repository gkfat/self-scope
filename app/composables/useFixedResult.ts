export type FixedResultStatus = 'loading' | 'ready' | 'missing' | 'failed';

/**
 * Load one published fixed result. `missing` covers both a path that cannot exist (null url) and
 * content that is not published yet (404); `failed` is anything else.
 */
export function useFixedResult<T>(url: string | null, query: Record<string, string> = {}) {
    const result = ref<T | null>(null);
    const status = ref<FixedResultStatus>(url ? 'loading' : 'missing');

    onMounted(async () => {
        if (!url) return;

        try {
            result.value = await $fetch<T>(url, { query });
            status.value = 'ready';
        } catch (error) {
            const code = (error as { statusCode?: number }).statusCode;

            if (code === 404 || code === 400) {
                status.value = 'missing';

                return;
            }

            console.error('[useFixedResult] failed to load:', error);
            status.value = 'failed';
        }
    });

    return {
        result, status,
    };
}
