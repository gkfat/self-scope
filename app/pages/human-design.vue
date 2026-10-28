<template>
    <div class="report-page">
        <ReportBanner
            title="人類圖"
            :headline="chart ? typeLabels[chart.type] : undefined"
            :extended="Boolean(chart)"
            tone="green"
        />

        <v-progress-linear
            v-if="working"
            indeterminate
            class="mb-4"
        />

        <v-alert
            v-else-if="!chart && !hasBirthData"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            人類圖需要出生日期、出生時間與出生城市。先到首頁填好，這裡就會直接顯示你的人類圖。
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

        <template v-if="chart">
            <v-card class="mb-4">
                <v-card-title>概覽</v-card-title>
                <v-card-text>
                    <v-row dense>
                        <v-col
                            v-for="item in summaryItems"
                            :key="item.label"
                            cols="6"
                            sm="4"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ item.label }}
                                    </div>
                                    <div class="text-subtitle-1 font-weight-medium">
                                        {{ item.value }}
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <v-alert
                v-if="chart.timeNote"
                type="warning"
                variant="tonal"
                class="mb-4"
            >
                {{ timeNoteText[chart.timeNote] }}
            </v-alert>

            <v-card class="mb-4">
                <v-card-title>人類圖</v-card-title>
                <v-card-text>
                    <HumanDesignChart :chart="chart" />
                </v-card-text>
            </v-card>

            <v-card
                v-if="readings.length"
                class="mb-4"
            >
                <v-card-title>整體特質解讀</v-card-title>
                <v-card-subtitle class="text-wrap">
                    以下是人類圖傳統說法裡，這些項目可能代表的傾向，僅供參考與自我探索。
                </v-card-subtitle>
                <v-card-text>
                    <v-row dense>
                        <v-col
                            v-for="reading in readings"
                            :key="reading.label"
                            cols="12"
                            md="6"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ reading.label }}
                                    </div>
                                    <div class="text-subtitle-1 font-weight-medium mb-2">
                                        {{ reading.title }}
                                    </div>
                                    <p class="text-body-2 mb-3">
                                        {{ reading.summary }}
                                    </p>
                                    <p
                                        v-if="reading.strategy"
                                        class="text-body-2 mb-3"
                                    >
                                        <span class="text-medium-emphasis">策略：</span>{{ reading.strategy }}
                                    </p>
                                    <p class="text-body-2 mb-3">
                                        <span class="text-medium-emphasis">可能的優勢：</span>{{ reading.strengths }}
                                    </p>
                                    <p class="text-body-2 mb-3">
                                        <span class="text-medium-emphasis">可能的盲點：</span>{{ reading.blindSpots }}
                                    </p>
                                    <p class="text-body-2 mb-0">
                                        <span class="text-medium-emphasis">想一想：</span>{{ reading.reflection }}
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>能量中心</v-card-title>
                <v-card-subtitle class="text-wrap">
                    有顏色的是「有定義」的中心，是你比較穩定的能量來源；白色的是「開放」的中心，比較彈性。
                </v-card-subtitle>
                <v-card-text>
                    <div class="text-subtitle-2 mb-2">
                        有定義的能量中心（{{ definedCenterCards.length }}）
                    </div>
                    <p
                        v-if="definedCenterCards.length === 0"
                        class="text-body-2 text-medium-emphasis"
                    >
                        沒有。九個能量中心都是開放的，你像一面鏡子，會反映身邊的環境。
                    </p>
                    <v-row
                        v-else
                        dense
                    >
                        <v-col
                            v-for="card in definedCenterCards"
                            :key="card.center"
                            cols="12"
                            sm="6"
                            md="4"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="text-subtitle-1 font-weight-medium">
                                        {{ card.label }}
                                    </div>
                                    <p class="text-body-2 mb-0 mt-1">
                                        {{ card.meaning }}
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>

                    <div
                        v-if="openCenterLabels.length"
                        class="mt-4"
                    >
                        <div class="text-subtitle-2 mb-1">
                            開放的能量中心（{{ openCenterLabels.length }}）
                        </div>
                        <p class="text-body-2 text-medium-emphasis mb-2">
                            這些地方比較彈性，也比較容易受身邊的人與環境影響，不是缺點。
                        </p>
                        <v-chip
                            v-for="label in openCenterLabels"
                            :key="label"
                            class="mr-1 mb-1"
                            size="small"
                            variant="outlined"
                        >
                            {{ label }}
                        </v-chip>
                    </div>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>通道</v-card-title>
                <v-card-subtitle class="text-wrap">
                    一條通道有兩端、各是一個閘門，兩端你都有，通道才算接通。
                </v-card-subtitle>
                <v-card-text>
                    <div class="mb-6">
                        <div class="text-subtitle-1 font-weight-medium">
                            已連接的通道（{{ channelCards.length }}）
                        </div>
                        <p class="text-body-2 text-medium-emphasis mb-3">
                            兩端的閘門你都有，通道接通了，兩端的能量中心也因此成為有定義。
                        </p>
                        <p
                            v-if="channelCards.length === 0"
                            class="text-body-2 text-medium-emphasis mb-0"
                        >
                            這張圖沒有已連接的通道。
                        </p>
                        <v-row
                            v-else
                            dense
                        >
                            <v-col
                                v-for="card in channelCards"
                                :key="card.key"
                                cols="12"
                                sm="6"
                                md="4"
                            >
                                <v-card
                                    variant="outlined"
                                    color="success"
                                    height="100%"
                                >
                                    <v-card-text class="text-high-emphasis">
                                        <div class="d-flex align-baseline ga-2">
                                            <span class="text-subtitle-1 font-weight-medium">{{ card.name }}</span>
                                            <span class="text-caption text-medium-emphasis">{{ card.english }}</span>
                                        </div>
                                        <p
                                            v-if="card.meaning"
                                            class="text-body-2 mt-2 mb-2"
                                        >
                                            {{ card.meaning }}
                                        </p>
                                        <div class="text-caption text-medium-emphasis">
                                            兩端閘門 {{ card.gates }} 都有
                                        </div>
                                        <div class="text-caption text-medium-emphasis">
                                            連接 {{ card.centers }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>

                    <div class="mb-6">
                        <div class="text-subtitle-1 font-weight-medium">
                            未連接的通道（{{ openChannelCards.length }}）
                        </div>
                        <p class="text-body-2 text-medium-emphasis mb-3">
                            只有其中一端的閘門你有，另一端沒有，所以通道還沒接通，也不會讓能量中心變成有定義。你有的那個閘門仍然是啟動的。
                        </p>
                        <p
                            v-if="openChannelCards.length === 0"
                            class="text-body-2 text-medium-emphasis mb-0"
                        >
                            沒有。你啟動的閘門都已經成對。
                        </p>
                        <v-row
                            v-else
                            dense
                        >
                            <v-col
                                v-for="card in openChannelCards"
                                :key="card.key"
                                cols="12"
                                sm="6"
                                md="4"
                            >
                                <v-card
                                    variant="outlined"
                                    height="100%"
                                >
                                    <v-card-text>
                                        <div class="d-flex align-baseline ga-2">
                                            <span class="text-subtitle-1 font-weight-medium">{{ card.name }}</span>
                                            <span class="text-caption text-medium-emphasis">{{ card.english }}</span>
                                        </div>
                                        <div class="text-body-2 mt-2">
                                            你有閘門 {{ card.have }}，缺閘門 {{ card.missing }}
                                        </div>
                                        <div class="text-caption text-medium-emphasis">
                                            補上才會連接 {{ card.centers }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>

                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>閘門</v-card-title>
                <v-card-subtitle class="text-wrap">
                    你的圖上啟動了 {{ gateCards.length }} 個閘門。每個閘門各有一個主題，不論有沒有接成通道，它的主題都在你身上。
                </v-card-subtitle>
                <v-card-text>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                        下面的標籤是「天體 閘門.線」：例如「太陽 28.2」，表示太陽落在閘門 28 的第 2 線。每個閘門分 6 條線，線是閘門裡更細的層次。出生當下（人格）與出生前約 88 天（設計）各有 13 個天體，所以共有 26 個標籤；有些天體會落在同一個閘門，因此下方每個閘門只列一次，點標籤可以跳到對應的閘門。
                    </p>
                    <div class="mb-3">
                        <div class="text-subtitle-2 mb-1">
                            人格（意識）閘門
                        </div>
                        <v-chip
                            v-for="item in chart.personality"
                            :key="`p-${item.body}`"
                            class="mr-1 mb-1"
                            size="small"
                            @click="jumpToGate(item.gate)"
                        >
                            {{ bodyLabels[item.body] }} {{ item.gate }}.{{ item.line }}
                        </v-chip>
                    </div>
                    <div>
                        <div class="text-subtitle-2 mb-1">
                            設計（潛意識）閘門
                        </div>
                        <v-chip
                            v-for="item in chart.design"
                            :key="`d-${item.body}`"
                            class="mr-1 mb-1"
                            size="small"
                            color="error"
                            variant="tonal"
                            @click="jumpToGate(item.gate)"
                        >
                            {{ bodyLabels[item.body] }} {{ item.gate }}.{{ item.line }}
                        </v-chip>
                    </div>

                    <div class="text-subtitle-2 mt-5 mb-2">
                        每個閘門的意思
                    </div>
                    <v-row dense>
                        <v-col
                            v-for="card in gateCards"
                            :key="card.gate"
                            cols="12"
                            sm="6"
                            md="4"
                        >
                            <v-card
                                :id="`gate-${card.gate}`"
                                variant="outlined"
                                height="100%"
                                class="gate-card"
                                :class="{ 'gate-card--lit': highlightedGate === card.gate }"
                            >
                                <v-card-text>
                                    <div class="d-flex align-center justify-space-between ga-2">
                                        <span class="text-subtitle-1 font-weight-medium">
                                            {{ card.gate }} {{ card.name }}
                                        </span>
                                        <v-chip
                                            size="x-small"
                                            :color="card.source === '設計' ? 'error' : undefined"
                                            variant="tonal"
                                        >
                                            {{ card.source }}
                                        </v-chip>
                                    </div>
                                    <p class="text-body-2 mt-2 mb-1">
                                        {{ card.meaning }}
                                    </p>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ card.center }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        來自：{{ card.from }}
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <HumanDesignFaq />

            <p class="text-caption text-medium-emphasis mb-4">
                {{ chart.disclaimer }}
            </p>

            <template v-if="isAuthenticated && chart.saved">
                <v-alert
                    type="success"
                    variant="tonal"
                    class="mb-4"
                >
                    已儲存於你的帳號，保存至 {{ expiryText }}。
                </v-alert>
                <ShareButton
                    source="HUMAN_DESIGN"
                    reference-id="main"
                />
            </template>
        </template>
    </div>
</template>

<script lang="ts" setup>
import type { HumanDesignResponse } from '../../shared/schemas/api/humanDesign.schema';
import { CENTERS } from '../../shared/constants/humanDesign';
import { CHANNEL_NAMES } from '../../shared/constants/humanDesignChannels';
import { CENTER_MEANINGS } from '../../shared/constants/humanDesignCenterMeanings';
import { CHANNEL_MEANINGS } from '../../shared/constants/humanDesignChannelMeanings';
import { GATE_INFO } from '../../shared/constants/humanDesignGates';
import { centerOfGate, hangingGates } from '../../shared/utils/humanDesignChart';
import {
    HUMAN_DESIGN_AUTHORITY_LABELS as authorityLabels,
    HUMAN_DESIGN_BODY_LABELS as bodyLabels,
    HUMAN_DESIGN_CENTER_LABELS as centerLabels,
    HUMAN_DESIGN_CROSS_ANGLE_LABELS as crossAngleLabels,
    HUMAN_DESIGN_DEFINITION_LABELS as definitionLabels,
    HUMAN_DESIGN_STRATEGY_LABELS as strategyLabels,
    HUMAN_DESIGN_TYPE_LABELS as typeLabels,
} from '../../shared/constants/humanDesignLabels';
import {
    HUMAN_DESIGN_AUTHORITY_INTERPRETATIONS,
    HUMAN_DESIGN_CROSS_ANGLE_INTERPRETATIONS,
    HUMAN_DESIGN_DEFINITION_INTERPRETATIONS,
    HUMAN_DESIGN_PROFILE_INTERPRETATIONS,
    HUMAN_DESIGN_TYPE_INTERPRETATIONS,
    type HumanDesignProfile,
} from '../../shared/constants/humanDesignInterpretations';

useHead({ title: '人類圖' });

type Problem = {
    type: 'error' | 'warning' | 'info';
    message: string;
};

const timeNoteText = {
    AMBIGUOUS: '你填的當地時間因夏令時間調整出現了兩次，這裡採用第一次。若你是第二次的時間，請回首頁把出生時間加上一小時再看，人生角色等結果可能不同。',
    NONEXISTENT: '你填的當地時間因夏令時間調整並不存在，這裡以調整前的時間計算，請確認出生時間是否正確。',
} as const;

const {
    isAuthenticated, initAuthListener,
} = useAuth();
const {
    get, post,
} = useApi();
const { ensureSession } = useGuestSession();
const {
    state, load: loadExploration,
} = useExploration();

const calculating = ref(false);
const chart = ref<HumanDesignResponse | null>(null);
const problem = ref<Problem | null>(null);

const birth = computed(() => state.value.birthData);
const hasBirthData = computed(() => Boolean(birth.value?.birthDate && birth.value.birthTime && birth.value.birthPlace));
/** Still finding out what the visitor has entered, or working the chart out. */
const working = computed(() => !state.value.loaded || calculating.value);

const crossText = computed(() => {
    if (!chart.value) return '';

    const [
        personalitySun,
        personalityEarth,
        designSun,
        designEarth,
    ] = chart.value.incarnationCross.gates;

    return `${crossAngleLabels[chart.value.incarnationCross.angle]}（${personalitySun}/${personalityEarth} | ${designSun}/${designEarth}）`;
});

/** The headline facts, one small card each. */
const summaryItems = computed(() => (chart.value
    ? [
        {
            label: '策略', value: strategyLabels[chart.value.strategy],
        },
        {
            label: '內在權威', value: authorityLabels[chart.value.authority],
        },
        {
            label: '人生角色', value: chart.value.profile,
        },
        {
            label: '定義', value: definitionLabels[chart.value.definition],
        },
        {
            label: '人生十字', value: crossText.value,
        },
    ]
    : []));

/**
 * The fixed reading of each chart-level part. A part without a reading is left out and logged: another part's text
 * must never stand in for it.
 */
const readings = computed(() => {
    const current = chart.value;

    if (!current) return [];

    const profile = HUMAN_DESIGN_PROFILE_INTERPRETATIONS[current.profile as HumanDesignProfile];
    const candidates = [
        {
            label: '類型',
            title: typeLabels[current.type],
            entry: HUMAN_DESIGN_TYPE_INTERPRETATIONS[current.type],
            strategy: HUMAN_DESIGN_TYPE_INTERPRETATIONS[current.type]?.strategy ?? '',
        },
        {
            label: '內在權威',
            title: authorityLabels[current.authority],
            entry: HUMAN_DESIGN_AUTHORITY_INTERPRETATIONS[current.authority],
            strategy: '',
        },
        {
            label: '人生角色',
            title: profile ? `${current.profile} ${profile.name}` : current.profile,
            entry: profile,
            strategy: '',
        },
        {
            label: '定義',
            title: definitionLabels[current.definition],
            entry: HUMAN_DESIGN_DEFINITION_INTERPRETATIONS[current.definition],
            strategy: '',
        },
        {
            label: '人生十字角度',
            title: crossAngleLabels[current.incarnationCross.angle],
            entry: HUMAN_DESIGN_CROSS_ANGLE_INTERPRETATIONS[current.incarnationCross.angle],
            strategy: '',
        },
    ];

    return candidates.flatMap(({
        entry, ...rest
    }) => {
        if (!entry) {
            console.error('[human-design] no interpretation for', rest.label, rest.title);

            return [];
        }

        return [{
            ...rest, ...entry,
        }];
    });
});

const channelName = (key: string) => CHANNEL_NAMES[key]?.zh ?? key;

/** Each complete channel: its name, its two gates and the two centers it joins. */
const channelCards = computed(() => (chart.value?.channels ?? []).map(([a, b]) => {
    const key = `${a}-${b}`;

    return {
        key,
        name: channelName(key),
        english: CHANNEL_NAMES[key]?.en ?? '',
        meaning: CHANNEL_MEANINGS[key] ?? '',
        gates: `${a}–${b}`,
        centers: `${centerLabels[centerOfGate(a)]} 與 ${centerLabels[centerOfGate(b)]}`,
    };
}));

/** Every gate the chart has, once, with its name, its meaning and which chart(s) it comes from. */
const gateCards = computed(() => {
    if (!chart.value) return [];

    const personality = new Set(chart.value.personality.map((item) => item.gate));
    const design = new Set(chart.value.design.map((item) => item.gate));

    return [...new Set([...personality, ...design])]
        .sort((a, b) => a - b)
        .map((gate) => ({
            gate,
            name: GATE_INFO[gate]?.name ?? '',
            meaning: GATE_INFO[gate]?.meaning ?? '',
            center: centerLabels[centerOfGate(gate)],
            source: personality.has(gate) && design.has(gate) ? '兩者皆有' : personality.has(gate) ? '人格' : '設計',
            from: [
                ...chart.value!.personality.filter((item) => item.gate === gate).map((item) => `人格${bodyLabels[item.body]} ${item.line} 線`),
                ...chart.value!.design.filter((item) => item.gate === gate).map((item) => `設計${bodyLabels[item.body]} ${item.line} 線`),
            ].join('、'),
        }));
});

const SCROLL_SETTLE_FRAMES = 3;
const SCROLL_MAX_WAIT_MS = 1500;
/** The gate card that is lit up for a moment after a label was pressed. */
const highlightedGate = ref<number | null>(null);

/** Resolve once the element has stopped moving (a smooth scroll has arrived), or after a short limit. */
function whenScrollSettled(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
        const startedAt = performance.now();
        let lastTop = element.getBoundingClientRect().top;
        let stillFrames = 0;

        const check = () => {
            const top = element.getBoundingClientRect().top;

            stillFrames = Math.abs(top - lastTop) < 0.5 ? stillFrames + 1 : 0;
            lastTop = top;

            if (stillFrames >= SCROLL_SETTLE_FRAMES || performance.now() - startedAt > SCROLL_MAX_WAIT_MS) {
                resolve();

                return;
            }

            requestAnimationFrame(check);
        };

        requestAnimationFrame(check);
    });
}

/**
 * Bring the gate card a label points to into view, then light it up so it can be found; the highlight
 * fades out on its own. Pressing again restarts it.
 */
async function jumpToGate(gate: number) {
    const element = document.getElementById(`gate-${gate}`);

    if (!element) return;

    highlightedGate.value = null;
    element.scrollIntoView({
        behavior: 'smooth', block: 'center',
    });

    await whenScrollSettled(element);
    // Clear first so the animation restarts when the same card is chosen twice in a row.
    highlightedGate.value = null;
    await nextTick();
    highlightedGate.value = gate;
}

/** Each defined center with what being defined can mean. */
const definedCenterCards = computed(() => (chart.value?.definedCenters ?? []).map((center) => ({
    center,
    label: centerLabels[center],
    meaning: CENTER_MEANINGS[center].defined,
})));

const openCenterLabels = computed(() => CENTERS
    .filter((center) => !chart.value?.definedCenters.includes(center))
    .map((center) => centerLabels[center]));

/**
 * Channels with only one of their two gates: the same channels as above, but not connected. Each one says
 * which gate the visitor has and which one is missing.
 */
const openChannelCards = computed(() => (chart.value ? hangingGates(chart.value) : [])
    .flatMap((item) => item.channels.map((channel) => ({
        key: channel.key,
        name: channelName(channel.key),
        english: CHANNEL_NAMES[channel.key]?.en ?? '',
        have: item.gate,
        missing: channel.partner,
        centers: `${centerLabels[item.center]} 與 ${centerLabels[centerOfGate(channel.partner)]}`,
    })))
    .sort((a, b) => a.have - b.have));

const expiryText = computed(() => (chart.value?.expiresAt ? new Date(chart.value.expiresAt).toLocaleDateString('zh-TW') : ''));

function problemFrom(error: unknown): Problem {
    const failure = error as { statusCode?: number };

    if (failure.statusCode === 400) {
        return {
            type: 'warning',
            message: '出生資料不正確，請回首頁檢查日期與出生城市。',
        };
    }

    if (failure.statusCode === 422) {
        return {
            type: 'info',
            message: '請先在首頁填好出生日期、出生時間與出生城市。',
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

    try {
        if (!isAuthenticated.value) await ensureSession();

        // The chart is for the birth data entered on the home page, nothing is typed here.
        chart.value = await post<HumanDesignResponse>('/api/human-design/calculations', {
            birthDate: birth.value?.birthDate,
            birthTime: birth.value?.birthTime,
            birthPlace: birth.value?.birthPlace,
        }, {}, 'optional');
    } catch (error) {
        console.error('[human-design] calculation failed:', error);
        problem.value = problemFrom(error);
    } finally {
        calculating.value = false;
    }
}

/**
 * Show a member's saved chart as it is; otherwise, when date, time and city are all known, work the chart
 * out right away.
 */
async function hydrate() {
    if (isAuthenticated.value) {
        try {
            chart.value = await get<HumanDesignResponse>('/api/human-design');
        } catch (error) {
            const status = (error as { statusCode?: number }).statusCode;

            // 404 just means there is no chart yet.
            if (status !== 404) console.error('[human-design] failed to load saved chart:', error);
        }
    }

    if (!chart.value && hasBirthData.value) await calculate();
}

onMounted(() => {
    initAuthListener();
});

// The saved data arrives asynchronously (auth state, then the request); start once it has.
watch(() => state.value.loaded, (loaded) => {
    if (loaded) void hydrate();
}, { immediate: true });

watch(isAuthenticated, async (signedIn, wasSignedIn) => {
    if (signedIn === wasSignedIn) return;

    chart.value = null;
    await loadExploration();
    await hydrate();
});
</script>

<style scoped>
.gate-card {
    scroll-margin-top: 80px;
}

/* Lit when picked from a label above, then fades back to the normal background. */
.gate-card--lit {
    animation: gate-lit 2.6s ease-out;
}

@keyframes gate-lit {
    0% {
        background-color: rgba(var(--v-theme-primary), 0.28);
    }

    35% {
        background-color: rgba(var(--v-theme-primary), 0.22);
    }

    100% {
        background-color: rgb(var(--v-theme-surface));
    }
}
</style>
