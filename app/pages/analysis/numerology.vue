<template>
    <div class="report-page">
        <ReportBanner
            title="生命靈數"
            :headline="number ? String(number) : undefined"
            :extended="Boolean(number)"
            tone="amber"
        />

        <FullReportLink
            v-if="number"
            slug="numerology"
        />

        <v-alert
            v-if="exploration.loaded && !birthDate"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            生命靈數需要出生日期，先填寫就能看到。
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

        <template v-else-if="number">
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
                        這項生命靈數分析的內容還在準備中，晚一點再回來看看。
                    </v-alert>
                    <v-alert
                        v-else
                        type="error"
                        variant="tonal"
                    >
                        暫時無法載入生命靈數分析，請重新整理頁面再試一次。
                    </v-alert>
                </v-card-text>
            </v-card>
            <FixedResultView
                v-else-if="result"
                :result="result"
                :show-disclaimer="false"
            />

            <v-card
                variant="outlined"
                class="mb-4"
            >
                <v-card-title>你的其他數字</v-card-title>
                <v-card-text>
                    <v-row dense>
                        <v-col
                            v-for="item in extraNumbers"
                            :key="item.label"
                            cols="12"
                            sm="4"
                        >
                            <v-card
                                variant="outlined"
                                density="compact"
                            >
                                <v-card-text>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ item.label }}
                                    </div>
                                    <div class="text-h5 font-weight-medium">
                                        {{ item.value }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ item.hint }}
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <p class="text-caption text-medium-emphasis mb-4">
                {{ result?.disclaimer ?? NUMEROLOGY_DISCLAIMER }}
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
import type { FixedResultResponse } from '../../../shared/schemas/api/fixedResult.schema';
import type { FixedResultStatus } from '../../composables/useFixedResult';
import {
    ageOn, birthdayNumber, lifePathNumber, personalYearNumber,
} from '../../../shared/utils/numerology';

useHead({ title: '生命靈數分析' });

const NUMEROLOGY_DISCLAIMER = '數字命理的關聯並沒有科學證據支持，本內容僅供娛樂與自我探索參考，不代表心理評估或診斷。';

const {
    state: exploration,
} = useExploration();

const birthDate = computed(() => exploration.value.birthData?.birthDate ?? null);

function localIsoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

const today = new Date();

const number = computed(() => (birthDate.value ? lifePathNumber(birthDate.value) : null));
const extraNumbers = computed(() => {
    if (!birthDate.value) return [];

    return [
        {
            label: '生日數', value: birthdayNumber(birthDate.value), hint: '出生日的數字，看你的天賦傾向',
        },
        {
            label: `${today.getFullYear()} 年個人流年`,
            value: personalYearNumber(birthDate.value, today.getFullYear()),
            hint: '今年的主題與節奏',
        },
        {
            label: '今年歲數', value: ageOn(birthDate.value, localIsoDate(today)), hint: '依今天的日期計算',
        },
    ];
});

const result = ref<FixedResultResponse | null>(null);
const status = ref<FixedResultStatus>('loading');

watch(number, async (value) => {
    if (value === null) return;

    status.value = 'loading';

    try {
        result.value = await $fetch<FixedResultResponse>(`/api/fixed-results/numerology/${value}`);
        status.value = 'ready';
    } catch (error) {
        const code = (error as { statusCode?: number }).statusCode;

        result.value = null;
        status.value = code === 404 || code === 400 ? 'missing' : 'failed';

        if (status.value === 'failed') console.error('[numerology] failed to load:', error);
    }
}, { immediate: true });
</script>
