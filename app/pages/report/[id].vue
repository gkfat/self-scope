<template>
    <div class="report-page">
        <ReportBanner
            title="多維度報告"
            :headline="report ? report.position : undefined"
            :extended="Boolean(report)"
            tone="green"
        />

        <v-btn
            to="/report"
            variant="text"
            size="small"
            prepend-icon="mdi-arrow-left"
            class="mb-2"
        >
            多維度分析
        </v-btn>

        <v-card
            v-if="loading"
            variant="outlined"
            class="mb-4"
        >
            <v-card-text>
                <v-skeleton-loader type="paragraph, paragraph, paragraph" />
            </v-card-text>
        </v-card>

        <v-alert
            v-else-if="missing"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            找不到這份報告，可能已超過保存期限（6 個月）。
        </v-alert>

        <v-alert
            v-else-if="failed"
            type="error"
            variant="tonal"
            class="mb-4"
        >
            暫時無法讀取這份報告，請重新整理頁面再試一次。
        </v-alert>

        <template v-else-if="report">
            <v-card
                v-if="report.aiJob?.status === 'GENERATING'"
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <v-progress-linear
                        indeterminate
                        class="mb-2"
                    />
                    <p class="text-body-2 mb-0">
                        正在針對你改寫洞見，通常不到一分鐘；下面是規則已經找出的內容，可以先看。
                    </p>
                </v-card-text>
            </v-card>

            <v-alert
                v-else-if="report.aiJob?.status === 'FAILED'"
                type="warning"
                variant="tonal"
                class="mb-4"
            >
                AI 改寫這次沒有成功，已把點數退回。下面是規則找出的內容，仍然可以閱讀。
                <template #append>
                    <v-btn
                        to="/report"
                        size="small"
                        variant="text"
                    >
                        再試一次
                    </v-btn>
                </template>
            </v-alert>

            <MultiReportView :report="report" />
        </template>
    </div>
</template>

<script lang="ts" setup>
import {
    reportSnapshotDetailSchema, type ReportSnapshotDetail,
} from '../../../shared/schemas/api/reportSnapshot.schema';

useHead({ title: '多維度報告' });

const POLL_MS = 3000;

const route = useRoute();
const { get } = useApi();
const { initAuthListener } = useAuth();
const { refresh: refreshPoints } = usePoints();

const report = ref<ReportSnapshotDetail | null>(null);
const loading = ref(true);
const missing = ref(false);
const failed = ref(false);

async function load(silent = false) {
    if (!silent) loading.value = true;

    try {
        report.value = reportSnapshotDetailSchema.parse(await get<unknown>(`/api/report-snapshots/${String(route.params.id)}`));
    } catch (error) {
        const failure = error as { statusCode?: number };

        if (silent) {
            console.error('[report] refresh failed:', error);

            return;
        }

        if (failure.statusCode === 404) missing.value = true;
        else {
            console.error('[report] failed to load:', error);
            failed.value = true;
        }
    } finally {
        loading.value = false;
    }
}

// While the AI is rewriting, look again until it is done or has failed (a failure gives the points back)
let timer: ReturnType<typeof setInterval> | null = null;

watch(() => report.value?.aiJob?.status, (status) => {
    if (timer) clearInterval(timer);

    timer = status === 'GENERATING' ? setInterval(() => void load(true).then(refreshPoints), POLL_MS) : null;
});

onMounted(() => {
    initAuthListener();
    void load();
});

onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
});
</script>
