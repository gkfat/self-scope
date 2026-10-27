<template>
    <div class="report-page">
        <ReportBanner
            title="多維度分析"
            :headline="headline || undefined"
            :extended="Boolean(combination)"
            :tone="bannerTone"
        />

        <v-alert
            v-if="status === 'missing'"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            找不到這份報告，可能已過期或不是你的帳號產生的。
            <template #append>
                <v-btn
                    to="/report"
                    size="small"
                    variant="text"
                >
                    回多維度分析
                </v-btn>
            </template>
        </v-alert>

        <v-alert
            v-else-if="status === 'error'"
            type="error"
            variant="tonal"
            class="mb-4"
        >
            暫時無法載入報告，請重新整理頁面再試一次。
        </v-alert>

        <v-card
            v-else-if="status === 'loading' || !combination"
            variant="outlined"
        >
            <v-card-text>
                <v-skeleton-loader type="heading, paragraph, paragraph" />
            </v-card-text>
        </v-card>

        <template v-else>
            <!-- What this report is made from -->
            <v-card
                class="mb-4 composition"
                variant="flat"
            >
                <v-card-text>
                    <div class="d-flex flex-wrap align-center ga-x-4 mb-3 text-caption text-medium-emphasis">
                        <span>這份報告把你的 {{ parts.length }} 個維度放在一起看</span>
                        <v-spacer />
                        <span v-if="createdAt">
                            生成日期：{{ new Date(createdAt).toLocaleDateString('zh-TW') }}
                        </span>
                    </div>
                    <div class="composition__row">
                        <template
                            v-for="(part, index) in parts"
                            :key="part.value"
                        >
                            <v-icon
                                v-if="index > 0"
                                icon="mdi-close"
                                size="small"
                                class="composition__times"
                            />
                            <div
                                class="composition__tile"
                                :style="{ '--tone': part.tone }"
                            >
                                <v-icon
                                    :icon="part.icon"
                                    size="small"
                                />
                                <span class="composition__label">{{ part.label }}</span>
                                <span class="composition__result">{{ part.result }}</span>
                            </div>
                        </template>
                    </div>
                </v-card-text>
            </v-card>

            <!-- A generated report that is not finished -->
            <v-card
                v-if="report && report.status !== 'COMPLETED'"
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <div
                        v-if="report.status === 'GENERATING'"
                        class="d-flex align-center"
                    >
                        <v-progress-circular
                            indeterminate
                            size="24"
                            class="mr-3"
                        />
                        <span>報告還在整理，可以先離開，稍後再回來看。</span>
                    </div>
                    <v-alert
                        v-else
                        type="error"
                        variant="tonal"
                    >
                        這份報告沒有整理成功，已自動退還點數，可以回上一頁再試一次。
                    </v-alert>
                </v-card-text>
            </v-card>

            <!-- Written analysis -->
            <FixedResultView
                v-else-if="summary"
                :result="summary.content"
            />

            <!-- Generated analysis -->
            <template v-else-if="report">
                <v-card
                    v-for="(section, index) in report.sections"
                    :key="section.key"
                    class="mb-4 section-card"
                    variant="outlined"
                >
                    <v-card-text>
                        <div class="d-flex align-center mb-2">
                            <span class="section-card__index">{{ index + 1 }}</span>
                            <h2 class="text-h6">
                                {{ section.title }}
                            </h2>
                        </div>
                        <p class="section-card__content mb-3">
                            {{ section.content }}
                        </p>
                        <p class="text-caption text-medium-emphasis mb-0">
                            <v-chip
                                size="x-small"
                                class="mr-1"
                                :color="section.evidenceKind === 'OBSERVED' ? 'primary' : 'secondary'"
                            >
                                {{ section.evidenceKind === 'OBSERVED' ? '依據資料' : '推測' }}
                            </v-chip>
                            {{ section.evidence }}
                        </p>
                    </v-card-text>
                </v-card>
                <p
                    v-if="report.disclaimer"
                    class="text-caption text-medium-emphasis"
                >
                    {{ report.disclaimer }}
                </p>
            </template>

            <p
                v-if="expiresAt"
                class="text-caption text-medium-emphasis mt-2"
            >
                到期日：{{ new Date(expiresAt).toLocaleDateString('zh-TW') }}（到期後自動刪除）
            </p>

            <div class="mt-4 d-flex ga-2">
                <v-btn
                    to="/report"
                    variant="tonal"
                    prepend-icon="mdi-arrow-left"
                >
                    回多維度分析
                </v-btn>
                <v-btn
                    v-if="report?.status === 'COMPLETED'"
                    variant="text"
                    @click="regenerateDialog = true"
                >
                    重新生成（{{ regenerateCost }} 點）
                </v-btn>
            </div>
        </template>

        <v-snackbar
            v-model="snackbar"
            color="error"
        >
            {{ snackbarText }}
        </v-snackbar>

        <v-dialog
            v-model="regenerateDialog"
            max-width="420"
        >
            <v-card>
                <v-card-title>重新生成</v-card-title>
                <v-card-text>將以目前的資料再產生一份新報告並扣除 {{ regenerateCost }} 點，舊報告會保留。</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="regenerateDialog = false">
                        取消
                    </v-btn>
                    <v-btn
                        color="primary"
                        :loading="regenerating"
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
} from '../../../../shared/schemas/api/detailedReport.schema';
import type { SummaryItem } from '../../../../shared/schemas/api/summary.schema';
import { multiDimensionCost } from '../../../../shared/utils/multiDimensionPricing';

definePageMeta({ middleware: 'member' });
useHead({ title: '多維度分析報告' });

const POLL_INTERVAL_MS = 4000;

const route = useRoute();
const {
    get, post,
} = useApi();
const { refresh: refreshPoints } = usePoints();

const kind = computed(() => String(route.params.kind));
const id = computed(() => String(route.params.id));

const status = ref<'loading' | 'ready' | 'missing' | 'error'>('loading');
const summary = ref<SummaryItem | null>(null);
const report = ref<ReportItem | null>(null);
const regenerateDialog = ref(false);
const regenerating = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
let pollTimer: ReturnType<typeof setTimeout> | null = null;

const combination = computed(() => summary.value?.combinationKey ?? report.value?.combinationKey ?? null);
const parts = computed(() => (combination.value ? dimensionPartsOf(combination.value) : []));
const headline = computed(() => (combination.value ? combinationResult(combination.value) : ''));
/** When the report was made: the day it was bought, or finished when it was generated */
const createdAt = computed(() => summary.value?.obtainedAt ?? report.value?.completedAt ?? report.value?.createdAt ?? null);
const expiresAt = computed(() => summary.value?.expiresAt ?? report.value?.expiresAt ?? null);
const regenerateCost = computed(() => (combination.value ? multiDimensionCost(dimensionsOf(combination.value)) ?? '—' : '—'));
const bannerTone = computed<'green' | 'amber' | 'red'>(() => {
    const first = parts.value[0]?.value;

    if (first === 'BLOOD') return 'red';
    if (first === 'ZODIAC') return 'amber';

    return 'green';
});

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const candidate = error as { statusCode?: number; status?: number };

    return candidate.statusCode ?? candidate.status;
}

async function load() {
    try {
        if (kind.value === 'summary') {
            summary.value = await get<SummaryItem>(`/api/summaries/${id.value}`);
        } else if (kind.value === 'detailed') {
            report.value = await get<ReportItem>(`/api/detailed-reports/${id.value}`);
        } else {
            status.value = 'missing';

            return;
        }

        status.value = 'ready';

        if (report.value?.status === 'GENERATING') pollTimer = setTimeout(load, POLL_INTERVAL_MS);
    } catch (error) {
        console.error('[report] load failed:', error);
        status.value = statusOf(error) === 404 ? 'missing' : 'error';
    }
}

async function regenerate() {
    regenerating.value = true;

    try {
        await post<ReportAccepted>(
            `/api/detailed-reports/${id.value}/regenerations`,
            undefined,
            { headers: { 'Idempotency-Key': crypto.randomUUID().replaceAll('-', '') } },
        );
        await refreshPoints();
        await navigateTo('/report');
    } catch (error) {
        console.error('[report] regenerate failed:', error);
        snackbarText.value = statusOf(error) === 402 ? '點數不足，請先購買點數。' : '重新生成失敗，請稍後再試。';
        snackbar.value = true;
    } finally {
        regenerating.value = false;
        regenerateDialog.value = false;
    }
}

onMounted(load);
onBeforeUnmount(() => {
    if (pollTimer) clearTimeout(pollTimer);
});
</script>

<style scoped>
.composition {
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    background: rgb(var(--v-theme-surface));
}

.composition__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.composition__times {
    color: rgba(var(--v-theme-on-surface), 0.35);
}

.composition__tile {
    display: flex;
    flex: 1 1 120px;
    flex-direction: column;
    gap: 2px;
    padding: 10px 14px;
    border-left: 3px solid var(--tone);
    border-radius: 6px;
    background: color-mix(in srgb, var(--tone) 8%, rgb(var(--v-theme-surface)));
    color: var(--tone);
}

.composition__label {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
}

.composition__result {
    font-size: 1.15rem;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
}

.section-card__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-right: 10px;
    border-radius: 50%;
    background: rgba(var(--v-theme-primary), 0.12);
    font-size: 0.85rem;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
}

.section-card__content {
    line-height: 1.9;
    white-space: pre-line;
}
</style>
