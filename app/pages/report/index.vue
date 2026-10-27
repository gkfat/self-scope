<template>
    <div>
        <h1 class="text-h5 mb-4">
            多維度分析
        </h1>

        <template v-if="isAuthenticated">
            <v-alert
                v-if="problem"
                :type="problem.type"
                variant="tonal"
                class="mb-4"
            >
                {{ problem.message }}
                <v-btn
                    v-if="problem.to"
                    class="ml-2"
                    :to="problem.to"
                >
                    {{ problem.action }}
                </v-btn>
            </v-alert>

            <v-card
                class="maker mb-6"
                variant="flat"
            >
                <v-card-text class="pa-5 pa-sm-6">
                    <div class="d-flex align-center flex-wrap ga-2 mb-1">
                        <h2 class="text-h6">
                            產生新的多維度分析
                        </h2>
                        <v-spacer />
                        <span class="maker__cost">
                            <span class="maker__cost-num">{{ cost ?? '—' }}</span>
                            點
                        </span>
                    </div>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                        勾選至少 2 個維度，把它們放在一起看。
                    </p>

                    <div class="maker__grid mb-4">
                        <button
                            v-for="option in dimensionChoices"
                            :key="option.value"
                            type="button"
                            role="checkbox"
                            class="pick"
                            :class="{ 'pick--on': option.checked, 'pick--off': !option.done || option.full }"
                            :style="{ '--tone': option.tone }"
                            :aria-checked="option.checked"
                            :disabled="!option.done || option.full"
                            @click="toggle(option.value)"
                        >
                            <span class="pick__top">
                                <v-icon
                                    :icon="option.icon"
                                    size="20"
                                />
                                <v-icon
                                    :icon="option.checked ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'"
                                    size="20"
                                    class="pick__check"
                                />
                            </span>
                            <span class="pick__label">{{ option.label }}</span>
                            <span class="pick__result">{{ option.done ? option.result : '尚未完成' }}</span>
                        </button>
                    </div>

                    <v-alert
                        type="info"
                        variant="tonal"
                        density="compact"
                        icon="mdi-calendar-clock-outline"
                        class="mb-4"
                    >
                        報告保存 3 個月（含人類圖的報告保存 6 個月），到期後會自動刪除。
                        到期前可另外使用點數下載 PDF 檔。
                    </v-alert>

                    <v-btn
                        color="primary"
                        size="x-large"
                        block
                        class="maker__go"
                        prepend-icon="mdi-layers-triple-outline"
                        :loading="starting"
                        :disabled="generating || cost === null"
                        @click="confirmDialog = true"
                    >
                        產生多維度分析 · {{ cost ?? '—' }} 點
                    </v-btn>
                    <p
                        v-if="!progress.multiDimensionUnlocked"
                        class="text-body-2 text-medium-emphasis mt-3 mb-0"
                    >
                        至少完成 2 個維度才能做多維度分析。
                        <NuxtLink to="/">
                            回首頁完成
                        </NuxtLink>
                    </p>
                </v-card-text>
            </v-card>

            <v-alert
                v-if="purchased"
                type="success"
                variant="tonal"
                closable
                class="mb-4"
                @click:close="purchased = null"
            >
                已扣除 {{ purchased }} 點，報告正在整理，完成後點開卡片就能看。
            </v-alert>

            <h2 class="text-subtitle-1 mb-3">
                我的報告
            </h2>
            <p
                v-if="entries.length === 0"
                class="text-body-2 text-medium-emphasis"
            >
                尚無報告。
            </p>
            <v-row v-else>
                <v-col
                    v-for="item in entries"
                    :key="item.key"
                    cols="12"
                    sm="6"
                    md="4"
                >
                    <v-card
                        class="analysis-card"
                        :class="[`analysis-card--${item.state}`, `analysis-card--t${item.tier}`]"
                        :style="{ '--tone': item.tone, '--grad': item.gradient, '--tint': item.tint }"
                        :to="item.state === 'ready' ? item.to : undefined"
                        :ripple="item.state === 'ready'"
                    >
                        <v-card-text>
                            <div class="d-flex flex-wrap ga-1 mb-2">
                                <v-chip
                                    v-for="part in item.parts"
                                    :key="part.value"
                                    size="small"
                                    class="dim-chip"
                                    :style="{ '--chip-tone': part.tone }"
                                    variant="flat"
                                    :prepend-icon="part.icon"
                                >
                                    {{ part.label }}
                                </v-chip>
                            </div>
                            <div class="analysis-card__meta mb-2">
                                <span class="analysis-card__tier">{{ item.tier >= 5 ? '全維度' : `${item.tier} 維度` }}</span>
                                <span>{{ new Date(item.at).toLocaleDateString('zh-TW') }} 生成</span>
                            </div>

                            <template v-if="item.state === 'loading'">
                                <div class="text-h6 mb-2">
                                    報告整理中
                                </div>
                                <div class="analysis-card__bar mb-3" />
                                <p class="text-body-2 text-medium-emphasis mb-0">
                                    {{ item.generated ? '正在依你的資料逐份整理，約需 1～2 分鐘。' : '正在把這組維度整理成報告。' }}
                                    可以先離開，稍後再回來看。
                                </p>
                            </template>

                            <template v-else-if="item.state === 'failed'">
                                <div class="text-h6 mb-2">
                                    {{ item.result }}
                                </div>
                                <p class="text-body-2 mb-0">
                                    {{ failureText(item.failureReason) }}已自動退還 {{ item.cost }} 點，可以再試一次。
                                </p>
                            </template>

                            <template v-else>
                                <div class="text-h6 mb-1">
                                    {{ item.result }}
                                </div>
                                <p class="text-body-2 text-medium-emphasis mb-2">
                                    {{ item.title }}
                                </p>
                                <p
                                    v-if="item.expiresAt"
                                    class="analysis-card__expiry"
                                    :class="{ 'analysis-card__expiry--soon': item.expiresSoon }"
                                >
                                    <v-icon
                                        icon="mdi-calendar-clock-outline"
                                        size="14"
                                    />
                                    {{ new Date(item.expiresAt).toLocaleDateString('zh-TW') }} 到期
                                </p>
                                <span class="analysis-card__open">
                                    查看報告
                                    <v-icon
                                        icon="mdi-arrow-right"
                                        size="small"
                                    />
                                </span>
                            </template>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </template>

        <v-dialog
            v-model="confirmDialog"
            max-width="420"
        >
            <v-card>
                <v-card-title>確認產生多維度分析</v-card-title>
                <v-card-text>
                    將扣除 {{ cost }} 點。<template v-if="generatedChoice">
                        失敗或逾時會自動退還。
                    </template>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="confirmDialog = false">
                        取消
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="start"
                    >
                        確認
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </div>
</template>

<script lang="ts" setup>
import type {
    ReportAccepted, ReportItem,
} from '../../../shared/schemas/api/detailedReport.schema';
import type { SummaryItem, SummaryObtained } from '../../../shared/schemas/api/summary.schema';
import type { ReportDimension } from '../../../shared/schemas/firestore/detailedReport.schema';
import {
    isGeneratedAnalysis, multiDimensionCost,
} from '../../../shared/utils/multiDimensionPricing';
import type { HumanDesignResponse } from '../../../shared/schemas/api/humanDesign.schema';
import {
    BLOOD_TYPE_LABELS, ZODIAC_LABELS,
} from '../../../shared/constants/zodiacLabels';
import { lifePathNumber } from '../../../shared/utils/numerology';
import { HUMAN_DESIGN_TYPE_LABELS } from '../../../shared/constants/humanDesignLabels';

definePageMeta({ middleware: 'member' });

useHead({ title: '多維度分析' });

type Problem = {
    type: 'error' | 'warning' | 'info';
    message: string;
    to?: string;
    action?: string;
};

const POLL_INTERVAL_MS = 4000;
const TICK_MS = 500;
/** An expiry closer than this is highlighted */
const EXPIRY_WARNING_MS = 14 * 24 * 60 * 60 * 1000;
/** A new report shows its loading card at least this long, so the purchase feels like something happened. */
const MIN_LOADING_MS = 3200;

const failureTexts: Record<string, string> = {
    TIMEOUT: '產生逾時。',
    INVALID_OUTPUT: '產生的內容未通過品質檢查。',
    REFUSED: '這次的內容無法處理。',
    STALE: '產生中斷。',
};

const {
    isAuthenticated, initAuthListener,
} = useAuth();
const {
    get, post,
} = useApi();
const { refresh: refreshPoints } = usePoints();

const {
    progress, state, load,
} = useExploration();

const dimensionOptions = DIMENSION_META;

const selected = ref<ReportDimension[]>([]);
const starting = ref(false);
const confirmDialog = ref(false);
const reports = ref<ReportItem[]>([]);
const summaries = ref<SummaryItem[]>([]);
const problem = ref<Problem | null>(null);
const purchased = ref<number | null>(null);
/** Cards bought in this visit: when each may stop showing as loading */
const revealAt = ref<Record<string, number>>({});
const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | null = null;
let lastPoll = 0;

const humanDesignType = ref<string | null>(null);

/** What the member has in each dimension, shown on its card */
const results = computed<Record<ReportDimension, string>>(() => ({
    ZODIAC: state.value.birthData ? ZODIAC_LABELS[state.value.birthData.zodiac] : '',
    BLOOD: BLOOD_TYPE_LABELS[state.value.bloodType],
    MBTI: state.value.mbti ?? '',
    HUMAN_DESIGN: humanDesignType.value ?? '已計算',
    NUMEROLOGY: state.value.birthData ? `數字 ${lifePathNumber(state.value.birthData.birthDate)}` : '',
}));

const dimensionChoices = computed(() => dimensionOptions.map((option) => ({
    ...option,
    done: progress.value.done[option.value],
    checked: selected.value.includes(option.value),
    // Written content stops at three dimensions; the human design lifts that limit
    full: !selected.value.includes(option.value) && multiDimensionCost([...selected.value, option.value]) === null,
    result: results.value[option.value],
})));

function toggle(value: ReportDimension) {
    selected.value = selected.value.includes(value)
        ? selected.value.filter((item) => item !== value)
        : dimensionOptions.map((option) => option.value).filter((item) => item === value || selected.value.includes(item));
}

const cost = computed(() => multiDimensionCost(selected.value));
const generatedChoice = computed(() => isGeneratedAnalysis(selected.value));
const generating = computed(() => entries.value.some((item) => item.state === 'loading'));

function costOf(combination: CombinationLike): number | string {
    return multiDimensionCost(dimensionsOf(combination)) ?? '—';
}

function failureText(reason: string | null): string {
    return (reason && failureTexts[reason]) || '產生失敗。';
}

function newIdempotencyKey(): string {
    return crypto.randomUUID().replaceAll('-', '');
}

function problemFrom(error: unknown): Problem {
    const failure = error as {
        statusCode?: number;
        data?: { code?: string; message?: string };
    };

    if (failure.statusCode === 402) {
        return {
            type: 'warning',
            message: '點數不足，請先購買點數。',
            to: '/points',
            action: '查看點數',
        };
    }

    if (failure.statusCode === 429) {
        return {
            type: 'warning',
            message: '產生次數已達上限（每小時 3 次、每天 10 次），未扣點，請稍後再試。',
        };
    }

    if (failure.statusCode === 404) {
        return {
            type: 'info',
            message: '這個組合的分析內容還在準備中，沒有扣點，晚一點再回來看看。',
        };
    }

    if (failure.data?.code === 'MBTI_REQUIRED') {
        return {
            type: 'info',
            message: '請先完成 16 型人格測驗。',
            to: '/test',
            action: '前往測驗',
        };
    }

    if (failure.data?.code === 'PROFILE_REQUIRED') {
        return {
            type: 'info',
            message: '請先填寫生日與星座。',
            to: '/profile',
            action: '前往填寫',
        };
    }

    if (failure.data?.code === 'BLOOD_REQUIRED' || failure.data?.code === 'HUMAN_DESIGN_REQUIRED') {
        return {
            type: 'info',
            message: '所選的維度還沒完成，請先到首頁完成後再試。',
            to: '/',
            action: '回首頁',
        };
    }

    return {
        type: 'error',
        message: failure.data?.message ?? '操作失敗，請稍後再試。',
    };
}

async function refreshList() {
    [reports.value, summaries.value] = await Promise.all([
        get<ReportItem[]>('/api/detailed-reports'),
        get<SummaryItem[]>('/api/summaries'),
    ]);
}

type Entry = {
    key: string;
    at: number;
    state: 'loading' | 'ready' | 'failed';
    generated: boolean;
    tone: string;
    /** How many dimensions it combines: more of them look richer */
    tier: number;
    gradient: string;
    tint: string;
    parts: ReturnType<typeof dimensionPartsOf>;
    title: string;
    result: string;
    cost: number | string;
    expiresAt: number | null;
    expiresSoon: boolean;
    failureReason: string | null;
    to: string;
};

function stillRevealing(key: string): boolean {
    return (revealAt.value[key] ?? 0) > now.value;
}

function entryOf(
    key: string,
    at: number,
    combination: CombinationLike,
    to: string,
    status: 'GENERATING' | 'COMPLETED' | 'FAILED',
    failureReason: string | null,
    expiresAt: number | null,
): Entry {
    const parts = dimensionPartsOf(combination);
    // A single color needs a second stop to make a gradient
    const tones = parts.length > 1 ? parts.map((part) => part.tone) : [parts[0]?.tone ?? '#2f5d8a', parts[0]?.tone ?? '#2f5d8a'];
    const state = status === 'FAILED'
        ? 'failed'
        : (status === 'GENERATING' || stillRevealing(key) ? 'loading' : 'ready');

    return {
        key,
        at,
        state,
        generated: parts.some((part) => part.value === 'HUMAN_DESIGN'),
        tone: parts[0]?.tone ?? '#2f5d8a',
        tier: Math.min(parts.length, 5),
        gradient: `linear-gradient(90deg, ${tones.join(', ')})`,
        tint: `linear-gradient(135deg, ${tones.map((tone) => `color-mix(in srgb, ${tone} 9%, rgb(var(--v-theme-surface)))`).join(', ')})`,
        parts,
        title: combinationLabel(combination),
        result: combinationResult(combination),
        cost: costOf(combination),
        expiresAt,
        expiresSoon: expiresAt !== null && expiresAt - now.value < EXPIRY_WARNING_MS,
        failureReason,
        to,
    };
}

/** Generated reports and written-content analyses in one list, newest first */
const entries = computed<Entry[]>(() => [
    ...reports.value.map((item) => entryOf(
        `detailed-${item.reportId}`, item.createdAt, item.combinationKey,
        `/report/detailed/${item.reportId}`, item.status, item.failureReason, item.expiresAt,
    )),
    ...summaries.value.map((item) => entryOf(
        `summary-${item.summaryId}`, item.obtainedAt, item.combinationKey,
        `/report/summary/${item.summaryId}`, 'COMPLETED', null, item.expiresAt,
    )),
].sort((a, b) => b.at - a.at));

function startTicker() {
    if (ticker) return;

    ticker = setInterval(async () => {
        now.value = Date.now();

        const needsPoll = reports.value.some((item) => item.status === 'GENERATING');

        if (needsPoll && now.value - lastPoll >= POLL_INTERVAL_MS) {
            lastPoll = now.value;

            try {
                await refreshList();
            } catch (error) {
                console.error('[report] refresh failed:', error);
            }
        }

        if (!generating.value && !needsPoll) stopTicker();
    }, TICK_MS);
}

function stopTicker() {
    if (!ticker) return;

    clearInterval(ticker);
    ticker = null;
}

function reveal(key: string) {
    now.value = Date.now();
    revealAt.value = {
        ...revealAt.value, [key]: now.value + MIN_LOADING_MS,
    };
    startTicker();
}

async function begin(action: () => Promise<ReportAccepted>) {
    starting.value = true;
    problem.value = null;

    try {
        const accepted = await action();

        await refreshList();
        reveal(`detailed-${accepted.reportId}`);
        purchased.value = accepted.pointsDeducted > 0 ? accepted.pointsDeducted : null;
        await refreshPoints();
    } catch (error) {
        console.error('[report] start failed:', error);
        problem.value = problemFrom(error);
    } finally {
        starting.value = false;
    }
}

/** Written content: nothing is generated, so the result comes back with the purchase */
async function obtainSummary() {
    starting.value = true;
    problem.value = null;

    try {
        const obtained = await post<SummaryObtained>('/api/summaries', { dimensions: selected.value });

        await Promise.all([refreshList(), refreshPoints()]);
        // Something already owned costs nothing and needs no waiting
        if (obtained.pointsDeducted > 0) reveal(`summary-${obtained.summaryId}`);
        purchased.value = obtained.pointsDeducted > 0 ? obtained.pointsDeducted : null;
    } catch (error) {
        console.error('[report] obtain failed:', error);
        problem.value = problemFrom(error);
    } finally {
        starting.value = false;
    }
}

async function start() {
    confirmDialog.value = false;

    if (!generatedChoice.value) {
        await obtainSummary();

        return;
    }

    await begin(() => post<ReportAccepted>(
        '/api/detailed-reports',
        { dimensions: selected.value },
        { headers: { 'Idempotency-Key': newIdempotencyKey() } },
    ));
}

// Start with every finished dimension ticked; the member can narrow it down
watch(() => progress.value.done, (done) => {
    // Written content is the cheapest: start with up to three finished dimensions that are not the human design
    selected.value = dimensionOptions
        .map((option) => option.value)
        .filter((value) => done[value] && value !== 'HUMAN_DESIGN')
        .slice(0, 3);
}, { immediate: true });

// The human design card names the member's type, which the progress facts do not carry
watch(() => progress.value.done.HUMAN_DESIGN, async (done) => {
    if (!done || !isAuthenticated.value) return;

    try {
        const chart = await get<HumanDesignResponse>('/api/human-design');

        humanDesignType.value = HUMAN_DESIGN_TYPE_LABELS[chart.type];
    } catch (error) {
        console.error('[report] human design type failed:', error);
    }
}, { immediate: true });

onMounted(async () => {
    initAuthListener();
    await load();

    try {
        await refreshList();

        if (reports.value.some((item) => item.status === 'GENERATING')) startTicker();
    } catch (error) {
        // Not signed in yet (the page shows the sign-in prompt) or a transient failure.
        console.error('[report] initial load failed:', error);
    }
});

onBeforeUnmount(stopTicker);
</script>

<style scoped>
.maker {
    border: 1px solid rgba(47, 93, 138, 0.18);
    background:
        radial-gradient(circle at 100% 0%, rgba(47, 93, 138, 0.1) 0, rgba(47, 93, 138, 0) 45%),
        rgb(var(--v-theme-surface));
    box-shadow: 0 6px 22px rgba(47, 93, 138, 0.1);
}

.maker__cost {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    padding: 2px 14px;
    border-radius: 999px;
    background: rgba(217, 164, 65, 0.18);
    font-size: 0.875rem;
    font-weight: 500;
    color: #8a5a12;
}

.maker__cost-num {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
}

.maker__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
}

.maker__go {
    letter-spacing: 0.1em;
    box-shadow: 0 6px 16px rgba(47, 93, 138, 0.35);
}

/* A choosable dimension: quiet until ticked, then it takes its own color */
.pick {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 12px;
    background: rgb(var(--v-theme-surface));
    text-align: left;
    color: rgba(var(--v-theme-on-surface), 0.55);
    cursor: pointer;
    transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;
}

.pick:hover:not(:disabled) {
    border-color: var(--tone);
}

.pick:focus-visible {
    outline: 2px solid var(--tone);
    outline-offset: 2px;
}

.pick--on {
    border-color: var(--tone);
    background: color-mix(in srgb, var(--tone) 9%, rgb(var(--v-theme-surface)));
    box-shadow: 0 2px 10px color-mix(in srgb, var(--tone) 22%, transparent);
    color: var(--tone);
}

.pick--off {
    cursor: not-allowed;
    opacity: 0.55;
}

.pick__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.pick__check {
    opacity: 0.7;
}

.pick__label {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
}

.pick__result {
    font-size: 1.125rem;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
}

.analysis-card__expiry {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0 0 8px;
    font-size: 0.8125rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.analysis-card__expiry--soon {
    color: rgb(var(--v-theme-warning));
}

.dim-chip {
    background: color-mix(in srgb, var(--chip-tone) 14%, rgb(var(--v-theme-surface))) !important;
    color: var(--chip-tone) !important;
}

.analysis-card {
    --bar: 3px;
    position: relative;
    height: 100%;
    overflow: hidden;
    background: var(--tint);
    box-shadow: 0 2px 10px color-mix(in srgb, var(--tone) 18%, transparent);
    transition: transform 0.15s, box-shadow 0.15s;
}

/* The colored bar on top: one color per dimension, thicker the more dimensions */
.analysis-card::before {
    position: absolute;
    inset: 0 0 auto;
    height: var(--bar);
    background: var(--grad);
    content: '';
}

.analysis-card--t3 {
    --bar: 5px;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--tone) 28%, transparent);
}

.analysis-card--t4 {
    --bar: 7px;
    box-shadow:
        0 6px 22px color-mix(in srgb, var(--tone) 34%, transparent),
        inset 0 0 0 1px color-mix(in srgb, var(--tone) 35%, transparent);
}

.analysis-card--t5 {
    --bar: 9px;
    box-shadow:
        0 8px 28px color-mix(in srgb, var(--tone) 40%, transparent),
        inset 0 0 0 1.5px rgba(217, 164, 65, 0.7);
}

/* A slow sheen across the richest cards */
.analysis-card--t4.analysis-card--ready::after,
.analysis-card--t5.analysis-card--ready::after {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.45) 50%, transparent 60%);
    content: '';
    transform: translateX(-120%);
    animation: analysis-sheen 5s ease-in-out infinite;
    pointer-events: none;
}

@keyframes analysis-sheen {
    0%, 60% { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
}

.analysis-card--ready:hover {
    transform: translateY(-2px);
}

.analysis-card--loading {
    --bar: 3px;
    background: rgb(var(--v-theme-surface));
    box-shadow: none;
}

.analysis-card--loading::before {
    background: rgba(var(--v-theme-on-surface), 0.2);
}

.analysis-card--failed::before {
    background: rgb(var(--v-theme-error));
}

.analysis-card__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8125rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

.analysis-card__tier {
    padding: 0 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--tone) 16%, transparent);
    font-weight: 700;
    color: var(--tone);
}

.analysis-card__open {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;
    color: var(--tone);
}

/* A sweeping highlight while the report is being put together */
.analysis-card__bar {
    position: relative;
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: rgba(var(--v-theme-on-surface), 0.08);
}

.analysis-card__bar::after {
    position: absolute;
    inset: 0;
    width: 40%;
    border-radius: 3px;
    background: linear-gradient(90deg, transparent, rgba(var(--v-theme-primary), 0.55), transparent);
    content: '';
    animation: analysis-sweep 1.4s ease-in-out infinite;
}

@keyframes analysis-sweep {
    from { transform: translateX(-100%); }
    to { transform: translateX(250%); }
}

@media (prefers-reduced-motion: reduce) {
    .analysis-card--t4.analysis-card--ready::after,
    .analysis-card--t5.analysis-card--ready::after {
        animation: none;
        display: none;
    }

    .analysis-card__bar::after {
        animation: none;
        width: 100%;
    }
}
</style>
