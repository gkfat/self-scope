<template>
    <div class="report-page">
        <ReportBanner
            title="血型"
            :headline="label || undefined"
            :extended="Boolean(label)"
            tone="red"
        />

        <FullReportLink
            v-if="mine"
            slug="blood"
        />

        <v-alert
            v-if="!label"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            找不到這個血型的分析。
            <template #append>
                <v-btn
                    to="/"
                    size="small"
                    variant="text"
                >
                    回首頁
                </v-btn>
            </template>
        </v-alert>

        <template v-else>
            <v-card
                v-if="status !== 'ready'"
                variant="outlined"
                class="mb-4"
            >
                <v-card-title>概覽</v-card-title>
                <v-card-text>
                    <v-skeleton-loader
                        v-if="status === 'loading'"
                        type="paragraph, paragraph"
                    />
                    <v-alert
                        v-else-if="status === 'missing'"
                        type="info"
                        variant="tonal"
                    >
                        這項血型分析的內容還在準備中，晚一點再回來看看。
                    </v-alert>
                    <v-alert
                        v-else
                        type="error"
                        variant="tonal"
                    >
                        暫時無法載入血型分析，請重新整理頁面再試一次。
                    </v-alert>
                </v-card-text>
            </v-card>
            <FixedResultView
                v-else-if="result"
                :result="result"
            />
        </template>
    </div>
</template>

<script lang="ts" setup>
import { BLOOD_TYPE_LABELS } from '../../../../shared/constants/zodiacLabels';
import { bloodTypeSchema } from '../../../../shared/schemas/common';
import type { FixedResultResponse } from '../../../../shared/schemas/api/fixedResult.schema';
import { useFixedResult } from '../../../composables/useFixedResult';

const route = useRoute();
const parsed = bloodTypeSchema.safeParse(route.params.type);
// An unknown blood type is never analysed (RULE-002), so it has no page either.
const valid = parsed.success && parsed.data !== 'UNKNOWN';
const type = valid ? parsed.data : '';
const label = valid ? BLOOD_TYPE_LABELS[parsed.data] : '';

useHead({ title: label ? `${label}分析` : '血型分析' });

const {
    result, status,
} = useFixedResult<FixedResultResponse>(valid ? `/api/fixed-results/blood-types/${type}` : null);

// The full report is the visitor's own: only shown on the page of their own blood type
const { state: exploration } = useExploration();
const mine = computed(() => valid && exploration.value.bloodType === type);
</script>
