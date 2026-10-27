<template>
    <div class="report-page">
        <ReportBanner
            title="瑪雅 Kin"
            :headline="headline"
            :extended="Boolean(kin)"
            tone="red"
        />

        <v-alert
            v-if="exploration.loaded && !birthDate"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            瑪雅 Kin 需要出生日期，先填寫就能看到你的 Kin。
            <template #append>
                <v-btn
                    to="/#fill"
                    size="small"
                    variant="text"
                >
                    去填寫
                </v-btn>
            </template>
        </v-alert>

        <template v-else-if="birthDate">
            <v-skeleton-loader
                v-if="status === 'loading'"
                type="card, paragraph"
                class="mb-4"
            />

            <v-alert
                v-else-if="status === 'missing'"
                type="info"
                variant="tonal"
                class="mb-4"
            >
                這個 Kin 的分析內容還在準備中，晚一點再回來看看。
            </v-alert>

            <v-alert
                v-else-if="status === 'failed'"
                type="error"
                variant="tonal"
                class="mb-4"
            >
                暫時無法載入瑪雅 Kin 分析，請重新整理頁面再試一次。
            </v-alert>

            <template v-else-if="kin && result">
                <KinBadge
                    :kin="kin"
                    class="mb-4"
                />
                <FixedResultView
                    :result="result"
                    :show-disclaimer="false"
                />
                <p class="text-caption text-medium-emphasis mb-4">
                    {{ result.disclaimer }}
                </p>
            </template>
        </template>
    </div>
</template>

<script lang="ts" setup>
import type { FixedResultStatus } from '../../composables/useFixedResult';
import type { BirthKinResponse } from '../../../shared/schemas/api/mayaKin.schema';
import { kinName } from '../../../shared/utils/mayaKin';

useHead({ title: '瑪雅 Kin 分析' });

const { state: exploration } = useExploration();

const birthDate = computed(() => exploration.value.birthData?.birthDate ?? null);

const response = ref<BirthKinResponse | null>(null);
const status = ref<FixedResultStatus>('loading');

const kin = computed(() => response.value?.kin ?? null);
const result = computed(() => response.value?.content ?? null);
const headline = computed(() => (kin.value ? kinName(kin.value) : undefined));

// The date is only sent when there is one; the server works it out and nothing is stored.
watch(birthDate, async (value) => {
    if (!value) return;

    status.value = 'loading';

    try {
        response.value = await $fetch<BirthKinResponse>('/api/fixed-results/maya-kin', { query: { birthDate: value } });
        status.value = 'ready';
    } catch (error) {
        const code = (error as { statusCode?: number }).statusCode;

        response.value = null;
        status.value = code === 404 || code === 400 ? 'missing' : 'failed';

        if (status.value === 'failed') console.error('[maya-kin] failed to load:', error);
    }
}, { immediate: true });
</script>
