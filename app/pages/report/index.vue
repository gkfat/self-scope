<template>
    <div class="report-page">
        <ReportBanner
            title="多維度分析"
            headline="把不同的系統放在一起看"
            tone="green"
        />

        <v-alert
            v-if="!isAuthenticated"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            多維度分析要登入後，用點數取得。登入後也可以回到這裡看過去的報告。
            <template #append>
                <v-btn
                    to="/login"
                    size="small"
                    color="primary"
                >
                    去登入
                </v-btn>
            </template>
        </v-alert>

        <template v-else>
            <p class="text-body-2 mb-4">
                選兩個以上的系統，規則會找出它們共同指向、彼此拉扯的地方，由 AI 產生獨一無二的解讀。
            </p>

            <v-alert
                v-if="problem"
                :type="problem.type"
                variant="tonal"
                class="mb-4"
            >
                {{ problem.message }}
                <template
                    v-if="problem.to"
                    #append
                >
                    <v-btn
                        :to="problem.to"
                        size="small"
                        variant="text"
                    >
                        {{ problem.action }}
                    </v-btn>
                </template>
            </v-alert>

            <v-card
                variant="outlined"
                class="mb-8 picker"
            >
                <v-card-text class="pa-5">
                    <div class="text-subtitle-1 font-weight-medium mb-3">
                        選擇要放在一起看的維度
                    </div>

                    <v-row
                        dense
                        class="mb-4"
                    >
                        <v-col
                            v-for="option in options"
                            :key="option.value"
                            cols="6"
                            sm="4"
                            md="2"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                                :class="['option', { 'option--on': selected.includes(option.value) }]"
                                :disabled="!option.ready"
                                @click="toggle(option)"
                            >
                                <v-card-text class="pa-3">
                                    <div class="d-flex align-center ga-2">
                                        <v-icon
                                            :icon="option.icon"
                                            :style="{ color: option.tone }"
                                        />
                                        <span class="text-subtitle-2 font-weight-medium">{{ option.label }}</span>
                                        <v-spacer />
                                        <v-icon
                                            v-if="selected.includes(option.value)"
                                            icon="mdi-check-circle"
                                            color="primary"
                                            size="20"
                                        />
                                    </div>
                                    <p
                                        v-if="option.ready"
                                        class="text-body-2 mt-1 mb-0 conclusion"
                                    >
                                        {{ option.conclusion }}
                                    </p>
                                    <p
                                        v-else
                                        class="text-caption text-medium-emphasis mt-1 mb-0"
                                    >
                                        需要：{{ option.need }}
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>

                    <div class="d-flex flex-wrap align-center ga-3">
                        <div>
                            <div class="text-body-1 font-weight-medium">
                                {{ cost === null ? '請選擇至少兩個系統' : `已選 ${selected.length} 個系統，共 ${cost} 點` }}
                            </div>
                        </div>
                        <v-spacer />
                        <v-btn
                            color="primary"
                            size="x-large"
                            variant="flat"
                            class="start"
                            :disabled="cost === null"
                            :loading="starting"
                            prepend-icon="mdi-creation-outline"
                            @click="start"
                        >
                            {{ cost === null ? '開始生成多維度分析' : `開始生成多維度分析（${cost} 點）` }}
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>

            <div class="text-h6 mb-2">
                我的多維度報告
            </div>
            <p
                v-if="!reports.length"
                class="text-body-2 text-medium-emphasis"
            >
                還沒有報告。
            </p>
            <v-card
                v-for="item in reports"
                :key="item.id"
                variant="outlined"
                class="mb-3"
            >
                <v-card-text>
                    <div class="d-flex flex-wrap align-center ga-2 mb-2">
                        <span class="text-subtitle-1 font-weight-medium">{{ item.systems.length }} 維度分析</span>
                        <span class="text-caption text-medium-emphasis">{{ new Date(item.generatedAt).toLocaleString('zh-TW') }}</span>
                        <v-spacer />
                        <template v-if="item.aiStatus === 'GENERATING'">
                            <v-progress-circular
                                indeterminate
                                size="18"
                                width="2"
                                class="mr-1"
                            />
                            <span class="text-body-2">生成中，通常不到一分鐘…</span>
                        </template>
                        <template v-else>
                            <span
                                v-if="item.aiStatus === 'FAILED'"
                                class="text-body-2 text-warning mr-2"
                            >AI 改寫沒有成功，已退點</span>
                            <v-btn
                                :to="`/report/${item.id}`"
                                color="primary"
                                size="small"
                                append-icon="mdi-arrow-right"
                            >
                                前往閱讀
                            </v-btn>
                        </template>
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                        <v-chip
                            v-for="part in item.parts"
                            :key="part.system"
                            size="small"
                            variant="tonal"
                            :prepend-icon="metaOf(part.system)?.icon"
                            :style="{ color: metaOf(part.system)?.tone }"
                        >
                            <span class="chip__text">{{ part.position }}</span>
                        </v-chip>
                    </div>
                </v-card-text>
            </v-card>
        </template>

    </div>
</template>

<script lang="ts" setup>
import { ELEMENT_LABELS } from '../../../shared/constants/bazi';
import { HUMAN_DESIGN_TYPE_LABELS } from '../../../shared/constants/humanDesignLabels';
import {
    BLOOD_TYPE_LABELS, ZODIAC_LABELS,
} from '../../../shared/constants/zodiacLabels';
import type { MultiReportSystem } from '../../../shared/report/systems';
import type { HumanDesignResponse } from '../../../shared/schemas/api/humanDesign.schema';
import type { MultiReportAccepted } from '../../../shared/schemas/api/multiReport.schema';
import type { ReportSnapshotItem } from '../../../shared/schemas/api/reportSnapshot.schema';
import { dayPillarOf } from '../../../shared/utils/bazi/dayPillar';
import { stemElement } from '../../../shared/utils/bazi/ganzhi';
import { kinName, kinOf } from '../../../shared/utils/mayaKin';
import { multiReportCost } from '../../../shared/utils/multiDimensionPricing';
import { lifePathNumber } from '../../../shared/utils/numerology';
import { zodiacFromIsoDate } from '../../../shared/utils/zodiac';
import { DIMENSION_META } from '../../utils/reportDimensions';

useHead({ title: '多維度分析' });

const POLL_MS = 3000;

type Problem = {
    type: 'error' | 'warning' | 'info';
    message: string;
    to?: string;
    action?: string;
};

const {
    isAuthenticated, initAuthListener,
} = useAuth();
const {
    get, post,
} = useApi();
const {
    state, progress,
} = useExploration();
const { refresh: refreshPoints } = usePoints();

const selected = ref<MultiReportSystem[]>([]);
const starting = ref(false);
const problem = ref<Problem | null>(null);
const reports = ref<ReportSnapshotItem[]>([]);

/** The human design type of a member's chart; the progress facts only know that a chart exists. */
const humanDesignType = ref<string | null>(null);

watch(() => [progress.value.done.HUMAN_DESIGN, isAuthenticated.value], async ([done, signedIn]) => {
    humanDesignType.value = null;

    if (!done || !signedIn) return;

    try {
        humanDesignType.value = HUMAN_DESIGN_TYPE_LABELS[(await get<HumanDesignResponse>('/api/human-design')).type];
    } catch (error) {
        console.error('[report] human design type failed:', error);
    }
}, { immediate: true });

/** Where the member stands in each system, as that system's own report says it, worked out here from what they have entered */
function conclusionOf(system: MultiReportSystem): string {
    const birthDate = state.value.birthData?.birthDate ?? null;
    const blood = state.value.bloodType;

    switch (system) {
    case 'ZODIAC': return birthDate ? `太陽${ZODIAC_LABELS[zodiacFromIsoDate(birthDate)]}` : '';
    case 'BLOOD': return blood === 'UNKNOWN' ? '' : BLOOD_TYPE_LABELS[blood];
    case 'MBTI': return state.value.mbti ?? '';
    case 'NUMEROLOGY': return birthDate ? `生命靈數 ${lifePathNumber(birthDate)}` : '';
    case 'MAYA_KIN': {
        if (!birthDate) return '';

        const kin = kinOf(birthDate);

        return `Kin ${kin.kinNumber}・${kinName(kin)}`;
    }
    case 'BAZI': {
        if (!birthDate || !state.value.birthData?.birthTime) return '';

        const { stem } = dayPillarOf(birthDate);

        return `${stem}${ELEMENT_LABELS[stemElement(stem)]}日主`;
    }
    case 'HUMAN_DESIGN': return humanDesignType.value ?? '已計算';
    }
}

const options = computed(() => DIMENSION_META.map((meta) => ({
    ...meta, ready: progress.value.done[meta.value], conclusion: conclusionOf(meta.value),
})));

const cost = computed(() => multiReportCost(selected.value));
const metaOf = (system: string) => DIMENSION_META.find((meta) => meta.value === system);

function toggle(option: { value: MultiReportSystem; ready: boolean }) {
    if (!option.ready) return;

    selected.value = selected.value.includes(option.value)
        ? selected.value.filter((value) => value !== option.value)
        : [...selected.value, option.value];
}

async function loadReports() {
    try {
        const all = await get<ReportSnapshotItem[]>('/api/report-snapshots');

        reports.value = all.filter((item) => item.kind === 'MULTI');
    } catch (error) {
        console.error('[report] failed to list reports:', error);
    }
}

// While a report is being made, look at the list again until none is, so that "go and read" appears when it is done
let timer: ReturnType<typeof setInterval> | null = null;

function watchRunning() {
    if (timer) return;

    timer = setInterval(async () => {
        await loadReports();

        if (!reports.value.some((item) => item.aiStatus === 'GENERATING') && timer) {
            clearInterval(timer);
            timer = null;
            void refreshPoints();
        }
    }, POLL_MS);
}

onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
});

function problemFrom(error: unknown): Problem {
    const failure = error as {
        statusCode?: number;
        data?: { code?: string };
    };

    if (failure.statusCode === 402) {
        return {
            type: 'warning', message: '點數不足，沒有扣點。', to: '/points', action: '查看點數',
        };
    }

    if (failure.statusCode === 429) {
        return {
            type: 'warning', message: '產生次數已達上限（每小時 3 次、每天 10 次），沒有扣點，請稍後再試。',
        };
    }

    if (failure.statusCode === 404) {
        return {
            type: 'info', message: '其中一個系統的解讀內容還在準備中，沒有扣點，晚一點再回來看看。',
        };
    }

    const code = failure.data?.code;

    if (code === 'NO_INSIGHTS') {
        return {
            type: 'info', message: '這個組合目前沒有找到跨系統的洞見，沒有扣點。換一個組合，或多加一個系統試試。',
        };
    }

    if (code === 'MBTI_REQUIRED') {
        return {
            type: 'info', message: '請先完成 16 型人格測驗。', to: '/test', action: '去測驗',
        };
    }

    if (code && ['PROFILE_REQUIRED', 'BLOOD_REQUIRED', 'BIRTH_TIME_REQUIRED', 'BIRTH_PLACE_REQUIRED'].includes(code)) {
        return {
            type: 'info', message: '有系統需要的資料還沒填寫，沒有扣點。', to: '/#fill', action: '去填寫',
        };
    }

    return {
        type: 'error', message: '暫時無法產生報告，沒有扣點，請稍後再試。',
    };
}

async function start() {
    starting.value = true;
    problem.value = null;

    try {
        const accepted = await post<MultiReportAccepted>(
            '/api/multi-reports',
            { systems: selected.value },
            { headers: { 'Idempotency-Key': crypto.randomUUID().replaceAll('-', '') } },
        );

        // The report shows up in the list below at once, as being made
        selected.value = [];
        await Promise.all([refreshPoints(), loadReports()]);

        if (accepted.status === 'GENERATING') watchRunning();
    } catch (error) {
        console.error('[report] failed to start:', error);
        problem.value = problemFrom(error);
    } finally {
        starting.value = false;
    }
}

// Who is looking, and their data and points, are loaded by the layout once per change of viewer; this page only reads
// its own list (loading them here too would race the layout's load)
async function readReports() {
    await loadReports();

    if (reports.value.some((item) => item.aiStatus === 'GENERATING')) watchRunning();
}

onMounted(() => {
    initAuthListener();

    if (isAuthenticated.value) void readReports();
});

watch(isAuthenticated, (signedIn) => {
    if (signedIn) void readReports();
});
</script>

<style scoped>
.picker {
    background: rgba(var(--v-theme-primary), 0.03);
}

.start {
    min-width: 280px;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.35);
}

.conclusion {
    font-weight: 600;
}

.chip__text {
    color: rgb(var(--v-theme-on-surface));
}

.option {
    cursor: pointer;
    transition: border-color 0.15s, background-color 0.15s;
}

.option--on {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.06);
}
</style>
