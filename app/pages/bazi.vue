<template>
    <div class="report-page">
        <ReportBanner
            title="八字命盤"
            :headline="headline"
            :extended="Boolean(result)"
            tone="amber"
        />

        <v-progress-linear
            v-if="working"
            indeterminate
            class="mb-4"
        />

        <v-alert
            v-else-if="!result && !hasBirthData"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            八字命盤需要出生日期與出生時間，目前還沒有填寫：{{ missingText }}。先到首頁填好，這裡就會直接顯示你的命盤。
            <template #append>
                <v-btn
                    to="/#fill"
                    size="small"
                    color="primary"
                >
                    去填寫
                </v-btn>
            </template>
        </v-alert>

        <v-alert
            v-if="problem"
            :type="problem.type"
            variant="tonal"
            class="mb-4"
        >
            {{ problem.message }}
        </v-alert>

        <template v-if="result">
            <v-alert
                v-if="result.timeZoneAssumed"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-4"
            >
                沒有填出生城市，這張命盤以台北（UTC+8）的標準時間計算。若你出生在其他地區，請回首頁補填出生城市。
            </v-alert>

            <BaziDayMasterCard
                class="mb-4"
                :day-master="result.dayMaster"
                :season="result.facts.season"
                :solar-term="result.facts.solarTerm"
                :zodiac="result.facts.zodiac"
            />

            <v-card class="mb-4">
                <v-card-title>四柱</v-card-title>
                <v-card-subtitle class="text-wrap">
                    年、月、日、時各一柱，每柱有天干與地支。框起來的是日主。
                </v-card-subtitle>
                <v-card-text>
                    <BaziPillarsTable :result="result" />
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>命盤事實</v-card-title>
                <v-card-subtitle class="text-wrap">
                    由規則算出的固定資訊，只列事實，不評斷好壞。
                </v-card-subtitle>
                <v-card-text>
                    <BaziFactsPanel :result="result" />
                </v-card-text>
            </v-card>

            <v-row class="mb-1">
                <v-col
                    cols="12"
                    md="6"
                >
                    <v-card height="100%">
                        <v-card-title>五行分布</v-card-title>
                        <v-card-text>
                            <BaziElementBars :counts="result.elementCounts" />
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col
                    cols="12"
                    md="6"
                >
                    <v-card height="100%">
                        <v-card-title>十神彙整</v-card-title>
                        <v-card-text>
                            <BaziTenGodBars
                                :group-counts="result.groupCounts"
                                :ten-god-counts="result.tenGodCounts"
                            />
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-card class="mb-4">
                <v-card-title>日主強弱、命格與喜用神</v-card-title>
                <v-card-text>
                    <BaziStrengthMeter :strength="result.strength" />
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>大運與流年</v-card-title>
                <v-card-text>
                    <BaziLuckTimeline
                        v-if="result.luck && result.flowYears"
                        :luck="result.luck"
                        :flow-years="result.flowYears"
                    />
                    <template v-else>
                        <p class="text-body-2 mb-3">
                            {{ luckHint }}
                        </p>
                        <v-btn
                            v-if="result.luckStatus === 'NEEDS_GENDER'"
                            to="/profile"
                            size="small"
                            color="primary"
                            variant="tonal"
                        >
                            到「我的資料」提供性別
                        </v-btn>
                        <div v-if="result.flowYears">
                            <div class="text-subtitle-2 mb-1">
                                今年與接下來的流年
                            </div>
                            <BaziYearRow
                                v-for="(year, index) in result.flowYears"
                                :key="year.year"
                                :year="year"
                                :current="index === 0"
                            />
                        </div>
                    </template>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>解讀</v-card-title>
                <v-card-subtitle class="text-wrap">
                    依你的命盤取出事先寫好的內容，用「傾向」的角度描述，不說吉凶。
                </v-card-subtitle>
                <v-card-text>
                    <v-row dense>
                        <v-col
                            v-for="card in interpretationCards"
                            :key="card.key"
                            cols="12"
                            md="6"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ card.label }}
                                    </div>
                                    <div class="text-subtitle-1 font-weight-medium mb-1">
                                        {{ card.content.title }}
                                    </div>
                                    <p class="text-body-2">
                                        {{ card.content.summary }}
                                    </p>
                                    <div
                                        v-if="card.content.strengths.length"
                                        class="text-body-2"
                                    >
                                        <div class="font-weight-medium">
                                            較順手的地方
                                        </div>
                                        <ul class="interpretation__list">
                                            <li
                                                v-for="line in card.content.strengths"
                                                :key="line"
                                            >
                                                {{ line }}
                                            </li>
                                        </ul>
                                    </div>
                                    <div
                                        v-if="card.content.blindSpots.length"
                                        class="text-body-2"
                                    >
                                        <div class="font-weight-medium">
                                            較吃力的地方
                                        </div>
                                        <ul class="interpretation__list">
                                            <li
                                                v-for="line in card.content.blindSpots"
                                                :key="line"
                                            >
                                                {{ line }}
                                            </li>
                                        </ul>
                                    </div>
                                    <p
                                        v-if="card.content.growthAdvice"
                                        class="text-body-2 mb-0"
                                    >
                                        <span class="font-weight-medium">可以試試：</span>{{ card.content.growthAdvice }}
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>採用的計算規則</v-card-title>
                <v-card-text>
                    <ul class="rules">
                        <li
                            v-for="note in BAZI_RULE_NOTES"
                            :key="note"
                        >
                            {{ note }}
                        </li>
                    </ul>
                    <p class="text-body-2 mt-3 mb-0">
                        不同流派、不同網站的算法可能不同，結果也可能因此不同；出生時間接近交界時尤其明顯。
                    </p>
                </v-card-text>
            </v-card>

            <p class="text-caption text-medium-emphasis mb-6">
                {{ BAZI_DISCLAIMER }}
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
import {
    ELEMENT_LABELS, TEN_GOD_GROUP_LABELS, type TenGodGroup,
} from '../../shared/constants/bazi';
import {
    BAZI_DISCLAIMER, BAZI_RULE_NOTES,
} from '../../shared/constants/baziLabels';
import type { BaziResponse } from '../../shared/schemas/api/bazi.schema';
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';

useHead({ title: '八字命盤' });

type Problem = {
    type: 'error' | 'warning' | 'info';
    message: string;
};

const {
    initAuthListener, isAuthenticated,
} = useAuth();
const { post } = useApi();
const {
    state, load: loadExploration,
} = useExploration();

const calculating = ref(false);
const result = ref<BaziResponse | null>(null);
const problem = ref<Problem | null>(null);

const birth = computed(() => state.value.birthData);
const hasBirthData = computed(() => Boolean(birth.value?.birthDate && birth.value.birthTime));
const working = computed(() => !state.value.loaded || calculating.value);

const missingText = computed(() => [
    birth.value?.birthDate ? null : '出生日期',
    birth.value?.birthTime ? null : '出生時間',
].filter(Boolean).join('、'));

const headline = computed(() => (result.value
    ? `${result.value.dayMaster.stem}${ELEMENT_LABELS[result.value.dayMaster.element]}日主`
    : undefined));

const luckHint = computed(() => {
    if (result.value?.luckStatus === 'NEEDS_GENDER') {
        return '提供性別後可看大運。性別只用來決定大運的排法（男命與女命的順逆不同），不會用在其他地方，也可以選擇不提供。';
    }

    return '大運的起運要用到精確的出生時刻，所以需要出生時間。';
});

/** The label of the ten-god group the dominant-group text is about, from its content key. */
const dominantGroupLabel = computed(() => {
    const key = result.value?.interpretation.dominantGroup?.key ?? '';
    const group = key.replace('group_dominant_', '') as TenGodGroup;

    return TEN_GOD_GROUP_LABELS[group] ?? '';
});

type InterpretationCard = {
    key: string;
    label: string;
    content: FixedResultResponse;
};

/** The texts the chart needs, in reading order; the ones this chart does not use are left out. */
const interpretationCards = computed<InterpretationCard[]>(() => {
    const interpretation = result.value?.interpretation;

    if (!interpretation) return [];

    const cards: Array<[string, string, FixedResultResponse | null]> = [
        [
            'dayMaster',
            '日主',
            interpretation.dayMaster,
        ],
        [
            'month',
            '月令',
            interpretation.month,
        ],
        [
            'strongElement',
            '五行偏旺',
            interpretation.strongElement,
        ],
        ...interpretation.missingElements.map((content): [string, string, FixedResultResponse] => [
            content.key,
            '五行缺少',
            content,
        ]),
        [
            'dominantGroup',
            `十神偏多（${dominantGroupLabel.value}）`,
            interpretation.dominantGroup,
        ],
        [
            'strength',
            '日主強弱',
            interpretation.strength,
        ],
        [
            'pattern',
            '命格',
            interpretation.pattern,
        ],
        [
            'usefulGods',
            '喜用神',
            interpretation.usefulGods,
        ],
        [
            'bone',
            '稱骨',
            interpretation.bone,
        ],
        [
            'currentLuck',
            '目前的大運',
            interpretation.currentLuck,
        ],
    ];

    return cards.flatMap(([key, label, content]) => (content ? [{
        key, label, content,
    }] : []));
});

function problemFrom(error: unknown): Problem {
    const failure = error as { statusCode?: number };

    if (failure.statusCode === 400) {
        return {
            type: 'warning',
            message: '出生資料不正確，請回首頁檢查日期、時間與出生城市。',
        };
    }

    if (failure.statusCode === 404) {
        return {
            type: 'info',
            message: '八字的解讀內容準備中，請稍後再來看看。',
        };
    }

    return {
        type: 'error',
        message: '計算失敗，請稍後再試。',
    };
}

async function calculate() {
    calculating.value = true;
    problem.value = null;
    result.value = null;

    try {
        // Nothing is saved: the chart is worked out from the birth data entered on the home page
        result.value = await post<BaziResponse>('/api/bazi/calculations', {
            birthDate: birth.value?.birthDate,
            birthTime: birth.value?.birthTime,
            birthPlace: birth.value?.birthPlace ?? null,
            gender: state.value.gender,
        }, {}, 'optional');
    } catch (error) {
        console.error('[bazi] calculation failed:', error);
        problem.value = problemFrom(error);
    } finally {
        calculating.value = false;
    }
}

onMounted(() => {
    initAuthListener();
});

// The saved data arrives asynchronously (auth state, then the request); calculate once it has.
watch(() => state.value.loaded, (loaded) => {
    if (loaded && hasBirthData.value) void calculate();
}, { immediate: true });

watch(isAuthenticated, async (signedIn, wasSignedIn) => {
    if (signedIn === wasSignedIn) return;

    result.value = null;
    await loadExploration();

    if (hasBirthData.value) await calculate();
});
</script>

<style scoped>
.interpretation__list {
    margin: 2px 0 8px;
    padding-left: 1.2em;
}

.rules {
    margin: 0;
    padding-left: 1.2em;
    font-size: 0.9rem;
    line-height: 1.8;
}
</style>
