<template>
    <div>
        <h1 class="text-h5 mb-4">
            詳細分析
        </h1>

        <v-alert
            v-if="!isAuthenticated"
            type="info"
            variant="tonal"
        >
            詳細分析需登入後使用（每份 5 點，註冊即贈 3 點）。
            <v-btn
                class="ml-2"
                color="primary"
                @click="signInWithGoogle"
            >
                以 Google 登入
            </v-btn>
        </v-alert>

        <template v-else>
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

            <v-card class="mb-6">
                <v-card-title>產生新的詳細分析</v-card-title>
                <v-card-text>
                    <p class="text-body-2 mb-2">
                        依你的星座、MBTI 與最近一次測驗結果，由 AI 產生八個章節的分析。
                        產生約需 1～2 分鐘，失敗或逾時會自動退還點數。
                    </p>
                    <v-checkbox
                        v-model="includeBloodType"
                        label="納入血型（已填寫血型時）"
                        hide-details
                    />
                </v-card-text>
                <v-card-actions>
                    <v-btn
                        color="primary"
                        :loading="starting"
                        :disabled="generating"
                        @click="confirmDialog = true"
                    >
                        產生詳細分析（5 點）
                    </v-btn>
                </v-card-actions>
            </v-card>

            <v-card
                v-if="current"
                class="mb-6"
            >
                <v-card-title>
                    {{ current.status === 'GENERATING' ? '產生中…' : '分析報告' }}
                </v-card-title>
                <v-card-text>
                    <div
                        v-if="current.status === 'GENERATING'"
                        class="d-flex align-center"
                    >
                        <v-progress-circular
                            indeterminate
                            size="24"
                            class="mr-3"
                        />
                        <span>正在產生，請稍候，可離開頁面稍後回來查看。</span>
                    </div>

                    <v-alert
                        v-else-if="current.status === 'FAILED'"
                        type="error"
                        variant="tonal"
                    >
                        {{ failureText(current.failureReason) }}已自動退還 5 點，可以再試一次。
                    </v-alert>

                    <template v-else>
                        <div
                            v-for="section in current.sections"
                            :key="section.key"
                            class="mb-5"
                        >
                            <h2 class="text-subtitle-1 font-weight-bold mb-1">
                                {{ section.title }}
                            </h2>
                            <p class="mb-1">
                                {{ section.content }}
                            </p>
                            <p class="text-caption text-medium-emphasis">
                                <v-chip
                                    size="x-small"
                                    class="mr-1"
                                    :color="section.evidenceKind === 'OBSERVED' ? 'primary' : 'secondary'"
                                >
                                    {{ section.evidenceKind === 'OBSERVED' ? '依據資料' : '推測' }}
                                </v-chip>
                                {{ section.evidence }}
                            </p>
                        </div>
                        <p class="text-caption text-medium-emphasis">
                            {{ current.disclaimer }}
                        </p>
                        <p
                            v-if="current.expiresAt"
                            class="text-caption text-medium-emphasis"
                        >
                            保存至 {{ new Date(current.expiresAt).toLocaleDateString('zh-TW') }}
                        </p>
                    </template>
                </v-card-text>
                <v-card-actions v-if="current.status === 'COMPLETED'">
                    <v-btn
                        :disabled="generating"
                        @click="regenerateTarget = current.reportId"
                    >
                        重新生成（5 點）
                    </v-btn>
                </v-card-actions>
            </v-card>

            <h2 class="text-subtitle-1 mb-2">
                我的報告
            </h2>
            <p
                v-if="reports.length === 0"
                class="text-body-2 text-medium-emphasis"
            >
                尚無報告。
            </p>
            <v-list v-else>
                <v-list-item
                    v-for="item in reports"
                    :key="item.reportId"
                    :active="current?.reportId === item.reportId"
                    @click="select(item.reportId)"
                >
                    <v-list-item-title>
                        {{ new Date(item.createdAt).toLocaleString('zh-TW') }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ statusText[item.status] }}{{ item.supersedesReportId ? '（重新生成）' : '' }}
                    </v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </template>

        <v-dialog
            v-model="confirmDialog"
            max-width="420"
        >
            <v-card>
                <v-card-title>確認產生詳細分析</v-card-title>
                <v-card-text>將扣除 5 點。失敗或逾時會自動退還。</v-card-text>
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

        <v-dialog
            :model-value="regenerateTarget !== null"
            max-width="420"
            @update:model-value="regenerateTarget = null"
        >
            <v-card>
                <v-card-title>重新生成</v-card-title>
                <v-card-text>將以目前的資料再產生一份新報告並扣除 5 點，舊報告會保留。</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="regenerateTarget = null">
                        取消
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="regenerate"
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
} from '../../shared/schemas/api/detailedReport.schema';

useHead({ title: '詳細分析' });

type Problem = {
    type: 'error' | 'warning' | 'info';
    message: string;
    to?: string;
    action?: string;
};

const POLL_INTERVAL_MS = 4000;

const statusText: Record<ReportItem['status'], string> = {
    GENERATING: '產生中',
    COMPLETED: '已完成',
    FAILED: '失敗（已退點）',
};

const failureTexts: Record<string, string> = {
    TIMEOUT: '產生逾時。',
    INVALID_OUTPUT: '產生的內容未通過品質檢查。',
    REFUSED: 'AI 無法處理這次的內容。',
    STALE: '產生中斷。',
};

const {
    isAuthenticated, signInWithGoogle, initAuthListener,
} = useAuth();
const {
    get, post,
} = useApi();

const includeBloodType = ref(true);
const starting = ref(false);
const confirmDialog = ref(false);
const regenerateTarget = ref<string | null>(null);
const reports = ref<ReportItem[]>([]);
const current = ref<ReportItem | null>(null);
const problem = ref<Problem | null>(null);
let pollTimer: ReturnType<typeof setTimeout> | null = null;

const generating = computed(() => current.value?.status === 'GENERATING');

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
            to: '/me',
            action: '前往填寫',
        };
    }

    return {
        type: 'error',
        message: failure.data?.message ?? '操作失敗，請稍後再試。',
    };
}

function stopPolling() {
    if (!pollTimer) return;

    clearTimeout(pollTimer);
    pollTimer = null;
}

async function refreshList() {
    reports.value = await get<ReportItem[]>('/api/detailed-reports');
}

async function select(reportId: string) {
    stopPolling();

    try {
        current.value = await get<ReportItem>(`/api/detailed-reports/${reportId}`);
    } catch (error) {
        console.error('[report] load failed:', error);
        problem.value = problemFrom(error);

        return;
    }

    if (current.value.status === 'GENERATING') {
        pollTimer = setTimeout(() => select(reportId), POLL_INTERVAL_MS);

        return;
    }

    await refreshList();
}

async function begin(action: () => Promise<ReportAccepted>) {
    starting.value = true;
    problem.value = null;

    try {
        const accepted = await action();

        await refreshList();
        await select(accepted.reportId);
    } catch (error) {
        console.error('[report] start failed:', error);
        problem.value = problemFrom(error);
    } finally {
        starting.value = false;
    }
}

async function start() {
    confirmDialog.value = false;
    await begin(() => post<ReportAccepted>(
        '/api/detailed-reports',
        { includeBloodType: includeBloodType.value },
        { headers: { 'Idempotency-Key': newIdempotencyKey() } },
    ));
}

async function regenerate() {
    const target = regenerateTarget.value;

    regenerateTarget.value = null;

    if (!target) return;

    await begin(() => post<ReportAccepted>(
        `/api/detailed-reports/${target}/regenerations`,
        undefined,
        { headers: { 'Idempotency-Key': newIdempotencyKey() } },
    ));
}

onMounted(async () => {
    initAuthListener();

    try {
        await refreshList();

        const running = reports.value.find((item) => item.status === 'GENERATING');

        if (running) await select(running.reportId);
    } catch (error) {
        // Not signed in yet (the page shows the sign-in prompt) or a transient failure.
        console.error('[report] initial load failed:', error);
    }
});

onBeforeUnmount(stopPolling);
</script>
