<template>
    <div class="report-page">
        <ReportBanner
            title="MBTI"
            :headline="valid ? type : undefined"
            :extended="valid"
            tone="green"
        />

        <v-alert
            v-if="!valid"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            找不到這個類型的分析。
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
                        這個類型的分析內容還在準備中，晚一點再回來看看。
                    </v-alert>
                    <v-alert
                        v-else
                        type="error"
                        variant="tonal"
                    >
                        暫時無法載入分析，請重新整理頁面再試一次。
                    </v-alert>
                </v-card-text>
            </v-card>
            <FixedResultView
                v-else-if="result"
                :result="result"
            />

            <div class="d-flex justify-center mb-4">
                <v-btn
                    to="/test?retake=1"
                    variant="outlined"
                    prepend-icon="mdi-restart"
                >
                    重新測驗
                </v-btn>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { mbtiTypeSchema } from '../../../../shared/schemas/common';
import type { FixedResultResponse } from '../../../../shared/schemas/api/fixedResult.schema';
import { useFixedResult } from '../../../composables/useFixedResult';

const route = useRoute();
const parsed = mbtiTypeSchema.safeParse(route.params.type);
const valid = parsed.success;
const type = parsed.success ? parsed.data : '';

useHead({ title: valid ? `${type} 分析` : 'MBTI 分析' });

const {
    result, status,
} = useFixedResult<FixedResultResponse>(valid ? `/api/fixed-results/mbti/${type}` : null);
</script>
