<template>
    <div class="report-page">
        <ReportBanner
            title="星座"
            :headline="label || undefined"
            :extended="Boolean(label)"
            tone="amber"
        />

        <v-alert
            v-if="!label"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            找不到這個星座。
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
                        這項星座分析的內容還在準備中，晚一點再回來看看。
                    </v-alert>
                    <v-alert
                        v-else
                        type="error"
                        variant="tonal"
                    >
                        暫時無法載入星座分析，請重新整理頁面再試一次。
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
                <v-card-title>進階星盤</v-card-title>
                <v-card-subtitle class="text-wrap">
                    用出生的時間與城市，看太陽以外的星體落在哪個星座，以及上升星座、宮位、宮主星與相位。
                </v-card-subtitle>
                <v-card-text>
                    <!-- With time and city: the chart -->
                    <template v-if="advancedReady">
                        <v-progress-linear
                            v-if="chartLoading"
                            indeterminate
                            class="mb-4"
                        />
                        <v-alert
                            v-else-if="chartFailed"
                            type="error"
                            variant="tonal"
                        >
                            暫時算不出星盤，請稍後再試。
                        </v-alert>
                        <template v-else-if="natal">
                            <v-alert
                                v-if="natal.timeNote"
                                type="warning"
                                variant="tonal"
                                class="mb-4"
                            >
                                {{ timeNoteText[natal.timeNote] }}
                            </v-alert>
                            <v-alert
                                v-if="sunSignDiffers"
                                type="info"
                                variant="tonal"
                                class="mb-4"
                            >
                                依你的出生時間精算，太陽落在{{ ZODIAC_LABELS[natal.bodies.SUN.sign] }}，與只用日期判斷的{{ label }}不同。出生日剛好在換座的邊界時會這樣。
                            </v-alert>

                            <div
                                v-for="group in groups"
                                :key="group.title"
                                class="mb-5"
                            >
                                <div class="text-subtitle-1 font-weight-medium">
                                    {{ group.title }}
                                </div>
                                <p class="text-body-2 text-medium-emphasis mb-3">
                                    {{ group.subtitle }}
                                </p>
                                <v-row dense>
                                    <v-col
                                        v-for="item in group.items"
                                        :key="item.key"
                                        cols="12"
                                        sm="6"
                                        md="4"
                                    >
                                        <v-card
                                            variant="outlined"
                                            height="100%"
                                        >
                                            <v-card-text>
                                                <div class="d-flex align-baseline justify-space-between ga-2">
                                                    <span class="text-subtitle-1 font-weight-medium">{{ item.name }}</span>
                                                    <span class="text-caption text-medium-emphasis">{{ item.degree }}°</span>
                                                </div>
                                                <p class="text-caption text-medium-emphasis mt-1 mb-2">
                                                    {{ item.role }}
                                                </p>
                                                <div class="text-h6 mb-1">
                                                    {{ item.sign }}
                                                </div>
                                                <p class="text-body-2 mb-0">
                                                    {{ item.meaning }}
                                                </p>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </div>

                            <div class="mb-5">
                                <div class="text-subtitle-1 font-weight-medium">
                                    宮位與宮主星
                                </div>
                                <p class="text-body-2 text-medium-emphasis mb-3">
                                    以上升星座為第 1 宮，依序數到第 12 宮（整宮制）。每一宮由它的星座的守護星掌管，這顆守護星稱為宮主星。
                                </p>
                                <v-row dense>
                                    <v-col
                                        v-for="house in houseCards"
                                        :key="house.house"
                                        cols="6"
                                        sm="4"
                                        md="3"
                                    >
                                        <v-card
                                            variant="outlined"
                                            height="100%"
                                        >
                                            <v-card-text>
                                                <div class="text-caption text-medium-emphasis">
                                                    第 {{ house.house }} 宮・{{ house.theme }}
                                                </div>
                                                <div class="text-subtitle-1 font-weight-medium">
                                                    {{ house.sign }}
                                                </div>
                                                <div class="text-body-2">
                                                    宮主星：{{ house.ruler }}
                                                </div>
                                                <div class="text-body-2 text-medium-emphasis">
                                                    {{ house.bodies }}
                                                </div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </div>

                            <div class="mb-2">
                                <div class="text-subtitle-1 font-weight-medium">
                                    星體之間的相位
                                </div>
                                <p class="text-body-2 text-medium-emphasis mb-3">
                                    兩顆星體在黃道上相距的角度接近特定角度時稱為相位。「相差」是離準確角度還差幾度，越小越準。
                                </p>
                                <p
                                    v-if="aspectRows.length === 0"
                                    class="text-body-2"
                                >
                                    這張星盤沒有落在範圍內的主要相位。
                                </p>
                                <v-row
                                    v-else
                                    dense
                                >
                                    <v-col
                                        v-for="aspect in aspectRows"
                                        :key="aspect.key"
                                        cols="12"
                                        sm="6"
                                        md="4"
                                    >
                                        <v-card variant="outlined">
                                            <v-card-text class="d-flex align-baseline justify-space-between ga-2">
                                                <span class="text-body-1">{{ aspect.first }} {{ aspect.type }} {{ aspect.second }}</span>
                                                <span class="text-caption text-medium-emphasis">相差 {{ aspect.orb }}°</span>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </div>
                        </template>
                    </template>

                    <!-- Without: blurred placeholders and the way to unlock -->
                    <div
                        v-else
                        class="locked"
                    >
                        <div
                            class="locked__preview"
                            aria-hidden="true"
                        >
                            <div
                                v-for="group in NATAL_GROUPS"
                                :key="group.title"
                                class="mb-5"
                            >
                                <v-skeleton-loader
                                    type="heading"
                                    class="mb-2"
                                />
                                <v-row dense>
                                    <v-col
                                        v-for="key in group.keys"
                                        :key="key"
                                        cols="12"
                                        sm="6"
                                        md="4"
                                    >
                                        <v-card variant="outlined">
                                            <v-card-text>
                                                <v-skeleton-loader type="list-item-two-line, text" />
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </div>
                        </div>
                        <div class="locked__cta">
                            <v-card
                                elevation="4"
                                class="pa-4 text-center"
                                max-width="420"
                            >
                                <div class="text-subtitle-1 font-weight-medium mb-1">
                                    想看進階星盤分析？
                                </div>
                                <p class="text-body-2 text-medium-emphasis mb-3">
                                    填寫出生時間與出生城市，就能看到月亮、上升與其他星體落在哪個星座，以及宮位、宮主星與星體之間的相位。
                                </p>
                                <v-btn
                                    to="/#fill"
                                    color="primary"
                                    prepend-icon="mdi-pencil-outline"
                                >
                                    填寫出生時間與城市
                                </v-btn>
                            </v-card>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <p
                v-if="result"
                class="text-caption text-medium-emphasis"
            >
                {{ result.disclaimer }}
                <template v-if="natal">
                    星盤中每個位置的說明，是同一星座的人共通的傾向，不代表你一定如此。
                </template>
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
import {
    ASPECT_LABELS, HOUSE_THEMES, NATAL_GROUPS, NATAL_LABELS, type NatalKey,
} from '../../../../shared/constants/natalLabels';
import { NATAL_PLACEMENT_MEANINGS } from '../../../../shared/constants/natalPlacementMeanings';
import { ZODIAC_LABELS } from '../../../../shared/constants/zodiacLabels';
import { zodiacSchema } from '../../../../shared/schemas/common';
import type { FixedResultResponse } from '../../../../shared/schemas/api/fixedResult.schema';
import type { NatalChartResponse } from '../../../../shared/schemas/api/natalChart.schema';
import { zodiacFromIsoDate } from '../../../../shared/utils/zodiac';
import { useFixedResult } from '../../../composables/useFixedResult';

const route = useRoute();
const parsed = zodiacSchema.safeParse(route.params.sign);
const sign = parsed.success ? parsed.data : '';
const label = parsed.success ? ZODIAC_LABELS[parsed.data] : '';

useHead({ title: label ? `${label}分析` : '星座分析' });

const timeNoteText = {
    AMBIGUOUS: '你填的當地時間因夏令時間調整出現了兩次，這裡採用第一次。若你是第二次的時間，請回首頁把出生時間加上一小時再看。',
    NONEXISTENT: '你填的當地時間因夏令時間調整並不存在，這裡以調整前的時間計算，請確認出生時間是否正確。',
} as const;

const {
    result, status,
} = useFixedResult<FixedResultResponse>(parsed.success ? '/api/fixed-results/zodiac' : null, { sign });

const { initAuthListener } = useAuth();
const { state } = useExploration();
const { post } = useApi();

const natal = ref<NatalChartResponse | null>(null);
const chartLoading = ref(false);
const chartFailed = ref(false);

const birth = computed(() => state.value.birthData);
/** Date, time and city are all known, and the date really is this sign's (the report is for one sign). */
const advancedReady = computed(() => Boolean(
    birth.value?.birthDate
    && birth.value.birthTime
    && birth.value.birthPlace
    && zodiacFromIsoDate(birth.value.birthDate) === sign,
));

const sunSignDiffers = computed(() => Boolean(natal.value && natal.value.bodies.SUN.sign !== sign));

/** The chart's placements, grouped as on the page. */
const groups = computed(() => {
    const chart = natal.value;

    if (!chart) return [];

    const placementOf = (key: NatalKey) => (key === 'ASCENDANT' ? chart.ascendant : chart.bodies[key]);

    return NATAL_GROUPS.map((group) => ({
        title: group.title,
        subtitle: group.subtitle,
        items: group.keys.map((key) => ({
            key,
            name: NATAL_LABELS[key].name,
            role: NATAL_LABELS[key].role,
            meaning: NATAL_PLACEMENT_MEANINGS[key][placementOf(key).sign],
            sign: ZODIAC_LABELS[placementOf(key).sign],
            degree: placementOf(key).degree,
        })),
    }));
});

/** The twelve houses: the theme, the sign, who rules it and which bodies are in it. */
const houseCards = computed(() => (natal.value?.houses ?? []).map((house) => ({
    house: house.house,
    theme: HOUSE_THEMES[house.house - 1] ?? '',
    sign: ZODIAC_LABELS[house.sign],
    ruler: NATAL_LABELS[house.ruler].name,
    bodies: house.bodies.length > 0 ? `星體：${house.bodies.map((body) => NATAL_LABELS[body].name).join('、')}` : '沒有星體',
})));

const aspectRows = computed(() => (natal.value?.aspects ?? []).map((aspect) => ({
    key: `${aspect.body1}-${aspect.body2}`,
    first: NATAL_LABELS[aspect.body1].name,
    second: NATAL_LABELS[aspect.body2].name,
    type: ASPECT_LABELS[aspect.type as keyof typeof ASPECT_LABELS],
    orb: aspect.orb.toFixed(1),
})));

async function loadChart() {
    if (!advancedReady.value || !birth.value) return;

    chartLoading.value = true;
    chartFailed.value = false;

    try {
        natal.value = await post<NatalChartResponse>('/api/zodiac/natal-chart', {
            birthDate: birth.value.birthDate,
            birthTime: birth.value.birthTime,
            birthPlace: birth.value.birthPlace,
        }, {}, 'optional');
    } catch (error) {
        console.error('[zodiac] natal chart failed:', error);
        chartFailed.value = true;
    } finally {
        chartLoading.value = false;
    }
}

onMounted(() => {
    initAuthListener();
});

// The saved birth data arrives asynchronously; work the chart out once it is known (and again if it changes).
watch([() => state.value.loaded, advancedReady], () => {
    if (state.value.loaded && advancedReady.value) void loadChart();
}, { immediate: true });
</script>

<style scoped>
.locked {
    position: relative;
}

/* The placeholders are blurred and cannot be selected or tabbed to: they only hint at what is behind. */
.locked__preview {
    filter: blur(4px);
    pointer-events: none;
    user-select: none;
}

.locked__cta {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
}
</style>
