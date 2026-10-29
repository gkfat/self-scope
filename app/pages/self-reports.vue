<template>
    <div>
        <h1 class="text-h5 mb-4">
            自我分析報告
        </h1>

        <section
            v-for="system in systems"
            :key="system.key"
            class="mb-6"
        >
            <div class="d-flex align-center ga-2 mb-1">
                <v-icon
                    :icon="system.icon"
                    color="primary"
                    size="20"
                />
                <h2 class="system__title">
                    {{ system.title }}
                </h2>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-3">
                {{ system.purpose }}
            </p>
            <v-row>
                <v-col
                    v-for="item in itemsOf(system.key)"
                    :key="item.key"
                    cols="12"
                    sm="6"
                    md="4"
                >
                    <v-card
                        variant="outlined"
                        height="100%"
                        :class="['report-card d-flex flex-column', { 'report-card--done': item.done }]"
                    >
                        <v-card-text class="flex-grow-1">
                            <div class="d-flex align-center justify-space-between mb-2">
                                <v-avatar
                                    :color="item.done ? 'primary' : 'grey'"
                                    variant="tonal"
                                    size="40"
                                >
                                    <v-icon :icon="item.icon" />
                                </v-avatar>
                                <v-chip
                                    v-if="item.done"
                                    size="small"
                                    color="primary"
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
                                :color="item.done ? 'primary' : undefined"
                                append-icon="mdi-arrow-right"
                            >
                                {{ item.action }}
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </section>
    </div>
</template>

<script lang="ts" setup>
import { BAZI_ENTRY_ENABLED } from '../../shared/constants/bazi';
import { HUMAN_DESIGN_TYPE_LABELS } from '../../shared/constants/humanDesignLabels';
import { KIN_ENTRY_ENABLED } from '../../shared/constants/mayaKin';
import {
    BLOOD_TYPE_LABELS, ZODIAC_LABELS,
} from '../../shared/constants/zodiacLabels';
import type { HumanDesignResponse } from '../../shared/schemas/api/humanDesign.schema';
import { kinName, kinOf } from '../../shared/utils/mayaKin';
import { lifePathNumber } from '../../shared/utils/numerology';
import { zodiacFromIsoDate } from '../../shared/utils/zodiac';

useHead({ title: '自我分析報告' });

type SystemKey = 'symbolic' | 'personality';

type ReportCard = {
    key: string;
    system: SystemKey;
    title: string;
    icon: string;
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

const { isAuthenticated } = useAuth();
const { get } = useApi();

/** The human design type of a member's saved chart; the progress facts only know that a chart exists. */
const humanDesignType = ref<string | null>(null);

watch(() => [progress.value.done.HUMAN_DESIGN, isAuthenticated.value], async ([done, signedIn]) => {
    humanDesignType.value = null;

    if (!done || !signedIn) return;

    try {
        const chart = await get<HumanDesignResponse>('/api/human-design');

        humanDesignType.value = HUMAN_DESIGN_TYPE_LABELS[chart.type];
    } catch (error) {
        console.error('[self-reports] human design type failed:', error);
    }
}, { immediate: true });

const birthDate = computed(() => state.value.birthData?.birthDate ?? null);
const bloodType = computed(() => (state.value.bloodType === 'UNKNOWN' ? null : state.value.bloodType));

const items = computed<ReportCard[]>(() => {
    const sign = birthDate.value ? zodiacFromIsoDate(birthDate.value) : null;
    const blood = bloodType.value;
    const mbti = state.value.mbti;
    const baziReady = Boolean(state.value.birthData?.birthDate && state.value.birthData.birthTime);

    return [
        {
            key: 'ZODIAC',
            system: 'symbolic',
            title: '星座',
            icon: 'mdi-star-four-points-outline',
            description: '從出生時太陽所在的位置，看你天生的性格傾向與行事風格。',
            done: sign !== null,
            result: sign ? ZODIAC_LABELS[sign] : '',
            to: sign ? '/full-report/zodiac' : '/#fill',
            action: sign ? '查看星座分析' : '填寫出生日期',
        },
        {
            key: 'BLOOD',
            system: 'symbolic',
            title: '血型',
            icon: 'mdi-water-outline',
            description: '用常見的血型性格說法，看你與人相處和面對事情的習慣。',
            done: blood !== null,
            result: blood ? BLOOD_TYPE_LABELS[blood] : '',
            to: blood ? '/full-report/blood' : '/#fill',
            action: blood ? '查看血型分析' : '選擇血型',
        },
        {
            key: 'MBTI',
            system: 'personality',
            title: 'MBTI',
            icon: 'mdi-head-cog-outline',
            description: '從回答問題的方式，看你如何獲取能量、接收資訊與做決定。',
            done: mbti !== null,
            result: mbti ?? '',
            to: mbti ? '/full-report/mbti' : '/test',
            action: mbti ? '查看 MBTI 分析' : '開始測驗',
        },
        {
            key: 'HUMAN_DESIGN',
            system: 'symbolic',
            title: '人類圖',
            icon: 'mdi-vector-triangle',
            description: '依出生當下的星體位置，看你的能量如何運作、怎樣做決定最順。',
            done: progress.value.done.HUMAN_DESIGN,
            result: humanDesignType.value ?? '已計算',
            to: progress.value.done.HUMAN_DESIGN ? '/full-report/human-design' : '/#fill',
            action: progress.value.done.HUMAN_DESIGN ? '查看人類圖' : '填寫出生時間與地點',
        },
        ...(BAZI_ENTRY_ENABLED
            ? [{
                key: 'BAZI',
            system: 'symbolic',
                title: '八字命盤',
                icon: 'mdi-yin-yang',
                description: '由出生的年、月、日、時排出四柱，看五行的分布、日主的強弱與每十年的節奏。',
                done: baziReady,
                result: '可查看',
                to: baziReady ? '/full-report/bazi' : '/#fill',
                action: baziReady ? '查看八字命盤' : '填寫出生日期與時間',
            }]
            : []),
        {
            key: 'NUMEROLOGY',
            system: 'symbolic',
            title: '生命靈數',
            icon: 'mdi-numeric',
            description: '把出生日期化成數字，看你的天賦傾向與今年的節奏。',
            done: birthDate.value !== null,
            result: birthDate.value ? `數字 ${lifePathNumber(birthDate.value)}` : '',
            to: birthDate.value ? '/full-report/numerology' : '/#fill',
            action: birthDate.value ? '查看生命靈數' : '填寫出生日期',
        },
        ...(KIN_ENTRY_ENABLED
            ? [{
                key: 'MAYA_KIN',
                system: 'symbolic' as const,
                title: '瑪雅 Kin',
                icon: 'mdi-calendar-star',
                description: '依出生日期以 Dreamspell 曆法算出你的圖騰與調性，看你的本質與象徵。',
                done: birthDate.value !== null,
                result: birthDate.value ? kinName(kinOf(birthDate.value)) : '',
                to: birthDate.value ? '/full-report/maya-kin' : '/#fill',
                action: birthDate.value ? '查看瑪雅 Kin' : '填寫出生日期',
            }]
            : []),
    ];
});

/** The two ways of getting to know yourself, in the same words as the home page */
const systems = [
    {
        key: 'symbolic' as const,
        title: '命理與象徵系統',
        icon: 'mdi-star-four-points-outline',
        purpose: '娛樂、文化探索、象徵性解讀',
    },
    {
        key: 'personality' as const,
        title: '人格與心理特質',
        icon: 'mdi-head-cog-outline',
        purpose: '了解特質傾向與個人差異',
    },
];

const itemsOf = (system: SystemKey) => items.value.filter((item) => item.system === system);
</script>

<style scoped>
.system__title {
    font-size: 1.1rem;
    font-weight: 700;
}

/* One quiet look for every card: a plain outline, and the theme color only once the analysis has a result. */
.report-card {
    border-color: rgba(var(--v-theme-on-surface), 0.12);
    opacity: 0.7;
    transition: opacity 0.2s, border-color 0.2s;
}

.report-card--done {
    border-color: rgb(var(--v-theme-primary));
    opacity: 1;
}
</style>
