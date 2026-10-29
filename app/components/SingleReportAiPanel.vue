<template>
    <v-card
        variant="outlined"
        class="mb-4"
    >
        <v-card-title>AI 進階分析</v-card-title>
        <v-card-subtitle class="text-wrap">
            依上面這份報告的事實與歸納的面向，交給 AI 生成一份專屬於你的解讀。
        </v-card-subtitle>
        <v-card-text>
            <v-alert
                v-if="!report.persisted"
                type="info"
                variant="tonal"
            >
                登入後，這份報告會保存下來，就能用 {{ SINGLE_ANALYSIS_COST }} 點取得 AI 進階分析。
                <template #append>
                    <v-btn
                        to="/login"
                        size="small"
                        variant="text"
                    >
                        去登入
                    </v-btn>
                </template>
            </v-alert>

            <template v-else>
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

                <div v-if="generating">
                    <v-progress-linear
                        indeterminate
                        class="mb-2"
                    />
                    <p class="text-body-2 mb-0">
                        正在分析，通常不到一分鐘；可以先留在這一頁。
                    </p>
                </div>

                <v-alert
                    v-else-if="report.aiJob?.status === 'FAILED' && !problem"
                    type="warning"
                    variant="tonal"
                    class="mb-4"
                >
                    這次分析沒有成功，已退回 {{ SINGLE_ANALYSIS_COST }} 點，可以再試一次。
                </v-alert>

                <div v-if="report.ai && !generating">
                    <div
                        v-for="block in report.ai.blocks"
                        :key="block.key"
                        class="mb-4"
                    >
                        <div class="text-subtitle-1 font-weight-medium mb-1">
                            {{ block.title }}
                        </div>
                        <p
                            v-for="(segment, index) in block.segments"
                            :key="`${block.key}-${index}`"
                            :class="index === 0 ? 'text-body-2 mb-1' : 'text-caption text-medium-emphasis mb-1'"
                        >
                            {{ segment.text }}
                        </p>
                    </div>
                    <p class="text-caption text-medium-emphasis">
                        AI 綜合推論・{{ new Date(report.ai.generatedAt).toLocaleDateString('zh-TW') }} 產生。AI 的分析只是參考，不代表心理評估或專業建議。
                    </p>
                </div>

                <v-btn
                    v-if="!generating"
                    color="primary"
                    :loading="starting"
                    prepend-icon="mdi-creation-outline"
                    @click="confirmDialog = true"
                >
                    {{ report.ai ? '重新分析' : '取得 AI 進階分析' }}（{{ SINGLE_ANALYSIS_COST }} 點）
                </v-btn>
            </template>
        </v-card-text>

        <v-dialog
            v-model="confirmDialog"
            max-width="420"
        >
            <v-card>
                <v-card-title>花 {{ SINGLE_ANALYSIS_COST }} 點取得 AI 進階分析？</v-card-title>
                <v-card-text>
                    會從你的點數扣 {{ SINGLE_ANALYSIS_COST }} 點；如果分析失敗，會自動退回。上面的報告不會被改動。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        variant="text"
                        @click="confirmDialog = false"
                    >
                        取消
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="start"
                    >
                        確定
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script lang="ts" setup>
import { SINGLE_ANALYSIS_COST } from '../../shared/constants/ai';
import type {
    SingleAnalysisAccepted, SingleReportResponse,
} from '../../shared/schemas/api/singleReport.schema';

type Problem = {
    type: 'error' | 'warning' | 'info';
    message: string;
    to?: string;
    action?: string;
};

const POLL_MS = 3000;

const props = defineProps<{
    report: SingleReportResponse;
    /** Fetch the report again without a loading state */
    refresh: () => Promise<void>;
}>();

const { post } = useApi();
const { refresh: refreshPoints } = usePoints();

const confirmDialog = ref(false);
const starting = ref(false);
const problem = ref<Problem | null>(null);
const generating = computed(() => props.report.aiJob?.status === 'GENERATING');

function problemFrom(error: unknown): Problem {
    const failure = error as { statusCode?: number };

    if (failure.statusCode === 402) {
        return {
            type: 'warning', message: '點數不足，沒有扣點。', to: '/points', action: '查看點數',
        };
    }

    if (failure.statusCode === 429) {
        return {
            type: 'warning', message: '分析次數已達上限（每小時 3 次、每天 10 次），沒有扣點，請稍後再試。',
        };
    }

    if (failure.statusCode === 409) {
        return {
            type: 'info', message: '這份報告正在分析中。',
        };
    }

    if (failure.statusCode === 404) {
        return {
            type: 'info', message: '找不到這份報告，可能已過期，請重新整理頁面。',
        };
    }

    return {
        type: 'error', message: '暫時無法開始分析，沒有扣點，請稍後再試。',
    };
}

async function start() {
    confirmDialog.value = false;

    if (!props.report.id) return;

    starting.value = true;
    problem.value = null;

    try {
        await post<SingleAnalysisAccepted>(
            '/api/single-reports/analysis',
            { snapshotId: props.report.id },
            { headers: { 'Idempotency-Key': crypto.randomUUID().replaceAll('-', '') } },
        );
        await Promise.all([props.refresh(), refreshPoints()]);
    } catch (error) {
        console.error('[single-report] analysis failed to start:', error);
        problem.value = problemFrom(error);
    } finally {
        starting.value = false;
    }
}

// While an analysis is being made, look again until it is done or has failed
let timer: ReturnType<typeof setInterval> | null = null;

watch(generating, (running) => {
    if (timer) clearInterval(timer);

    timer = running ? setInterval(() => void props.refresh().then(refreshPoints), POLL_MS) : null;
}, { immediate: true });

onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
});
</script>
