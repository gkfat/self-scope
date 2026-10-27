<template>
    <div>
        <h1 class="text-h5 mb-4">
            自我分析報告
        </h1>

        <v-row>
            <v-col
                v-for="item in items"
                :key="item.key"
                cols="12"
                sm="6"
            >
                <v-card
                    variant="outlined"
                    height="100%"
                    :class="['report-card d-flex flex-column', { 'report-card--done': item.done }]"
                    :style="{ '--tone': item.tone }"
                >
                    <v-card-text class="flex-grow-1">
                        <div class="d-flex align-center justify-space-between mb-2">
                            <v-avatar
                                :color="item.done ? item.tone : 'grey'"
                                variant="tonal"
                                size="40"
                            >
                                <v-icon :icon="item.icon" />
                            </v-avatar>
                            <v-chip
                                v-if="item.done"
                                size="small"
                                color="success"
                                variant="tonal"
                                prepend-icon="mdi-check"
                            >
                                {{ item.result }}
                            </v-chip>
                        </div>
                        <div class="text-subtitle-1 font-weight-medium mb-1">
                            {{ item.title }}
                        </div>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                            {{ item.description }}
                        </p>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            :to="item.to"
                            :variant="item.done ? 'tonal' : 'text'"
                            :color="item.done ? item.tone : undefined"
                            append-icon="mdi-arrow-right"
                        >
                            {{ item.action }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts" setup>
import {
    BLOOD_TYPE_LABELS, ZODIAC_LABELS,
} from '../../shared/constants/zodiacLabels';
import { lifePathNumber } from '../../shared/utils/numerology';
import { zodiacFromIsoDate } from '../../shared/utils/zodiac';

useHead({ title: '自我分析報告' });

type ReportCard = {
    key: string;
    title: string;
    icon: string;
    tone: string;
    description: string;
    done: boolean;
    /** What the finished analysis is about, e.g. the sign or the type */
    result: string;
    to: string;
    action: string;
};

const {
    state, progress, load,
} = useExploration();

// Something may have changed since the last screen (a finished test, a saved profile)
onMounted(load);

const birthDate = computed(() => state.value.birthData?.birthDate ?? null);
const bloodType = computed(() => (state.value.bloodType === 'UNKNOWN' ? null : state.value.bloodType));

const items = computed<ReportCard[]>(() => {
    const sign = birthDate.value ? zodiacFromIsoDate(birthDate.value) : null;
    const blood = bloodType.value;
    const mbti = state.value.mbti;

    return [
        {
            key: 'ZODIAC',
            title: '星座',
            icon: 'mdi-star-four-points-outline',
            tone: '#b7791f',
            description: '從出生時太陽所在的位置，看你天生的性格傾向與行事風格。',
            done: sign !== null,
            result: sign ? ZODIAC_LABELS[sign] : '',
            to: sign ? `/analysis/zodiac/${sign}` : '/#fill',
            action: sign ? '查看星座分析' : '填寫出生日期',
        },
        {
            key: 'BLOOD',
            title: '血型',
            icon: 'mdi-water-outline',
            tone: '#c94f4f',
            description: '用常見的血型性格說法，看你與人相處和面對事情的習慣。',
            done: blood !== null,
            result: blood ? BLOOD_TYPE_LABELS[blood] : '',
            to: blood ? `/analysis/blood/${blood}` : '/#fill',
            action: blood ? '查看血型分析' : '選擇血型',
        },
        {
            key: 'MBTI',
            title: 'MBTI',
            icon: 'mdi-head-cog-outline',
            tone: '#2f5d8a',
            description: '從回答問題的方式，看你如何獲取能量、接收資訊與做決定。',
            done: mbti !== null,
            result: mbti ?? '',
            to: mbti ? `/analysis/mbti/${mbti}` : '/test',
            action: mbti ? '查看 MBTI 分析' : '開始測驗',
        },
        {
            key: 'HUMAN_DESIGN',
            title: '人類圖',
            icon: 'mdi-vector-triangle',
            tone: '#2e7d5b',
            description: '依出生當下的星體位置，看你的能量如何運作、怎樣做決定最順。',
            done: progress.value.done.HUMAN_DESIGN,
            result: '已計算',
            to: progress.value.done.HUMAN_DESIGN ? '/human-design' : '/#fill',
            action: progress.value.done.HUMAN_DESIGN ? '查看人類圖' : '填寫出生時間與地點',
        },
        {
            key: 'NUMEROLOGY',
            title: '生命靈數',
            icon: 'mdi-numeric',
            tone: '#7a5aa6',
            description: '把出生日期化成數字，看你的天賦傾向與今年的節奏。',
            done: birthDate.value !== null,
            result: birthDate.value ? `數字 ${lifePathNumber(birthDate.value)}` : '',
            to: birthDate.value ? '/analysis/numerology' : '/#fill',
            action: birthDate.value ? '查看生命靈數' : '填寫出生日期',
        },
    ];
});
</script>

<style scoped>
/* A card without a result yet stays quiet; one with a result lights up in its own color. */
.report-card {
    border-top: 3px solid rgba(var(--v-theme-on-surface), 0.12);
    opacity: 0.65;
    transition: opacity 0.2s, box-shadow 0.2s;
}

.report-card--done {
    border-top-color: var(--tone);
    background: color-mix(in srgb, var(--tone) 7%, rgb(var(--v-theme-surface)));
    opacity: 1;
    box-shadow: 0 2px 10px color-mix(in srgb, var(--tone) 22%, transparent);
}
</style>
