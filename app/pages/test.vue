<template>
    <div class="report-page">
        <ReportBanner
            title="MBTI"
            :headline="result ? result.result : '16 型人格測驗'"
            tone="green"
        />

        <v-alert
            v-if="loadError"
            type="error"
            variant="tonal"
        >
            {{ loadError }}
        </v-alert>

        <v-progress-circular
            v-else-if="loading"
            indeterminate
        />

        <template v-else-if="result">
            <FixedResultView :result="result.content">
                <template #after-insight>
                    <MbtiGuide :current="result.result" />
                </template>
            </FixedResultView>

            <div class="d-flex justify-center mb-4">
                <v-btn
                    variant="outlined"
                    prepend-icon="mdi-restart"
                    @click="retake"
                >
                    重新測驗
                </v-btn>
            </div>

            <v-alert
                v-if="result.saveFailed"
                type="warning"
                variant="tonal"
                class="mb-4"
            >
                結果已計算，但儲存失敗。請稍後重新送出以儲存。
            </v-alert>
            <v-alert
                v-else-if="result.persisted"
                type="success"
                variant="tonal"
                class="mb-4"
            >
                結果已儲存於你的帳號。
            </v-alert>

        </template>

        <template v-else-if="test">
            <v-progress-linear
                :model-value="progress"
                class="mb-4"
            />
            <v-card
                v-for="question in pageQuestions"
                :key="question.questionId"
                class="question mb-3"
                :class="{ 'question--answered': isAnswered(question.questionId) }"
            >
                <v-card-text>
                    <div class="d-flex align-start ga-2 mb-2">
                        <span class="question__text">{{ question.text }}</span>
                        <v-spacer />
                        <v-icon
                            :icon="isAnswered(question.questionId) ? 'mdi-check-circle' : 'mdi-circle-outline'"
                            :color="isAnswered(question.questionId) ? 'success' : undefined"
                            :aria-label="isAnswered(question.questionId) ? '已作答' : '尚未作答'"
                            class="question__mark"
                        />
                    </div>
                    <v-radio-group
                        v-model="answers[question.questionId]"
                        inline
                        hide-details
                        color="success"
                    >
                        <v-radio
                            v-for="option in question.options"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                        />
                    </v-radio-group>
                </v-card-text>
            </v-card>

            <v-alert
                v-if="submitError"
                type="error"
                variant="tonal"
                class="mb-3"
            >
                {{ submitError }}
            </v-alert>

            <div class="d-flex justify-space-between">
                <v-btn
                    :disabled="page === 0"
                    @click="page -= 1"
                >
                    上一頁
                </v-btn>
                <v-btn
                    v-if="page < pageCount - 1"
                    color="primary"
                    :disabled="!pageComplete"
                    @click="page += 1"
                >
                    下一頁
                </v-btn>
                <v-btn
                    v-else
                    color="primary"
                    :disabled="!allAnswered"
                    :loading="submitting"
                    @click="submit"
                >
                    送出
                </v-btn>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { submissionResponseSchema } from '../../shared/schemas/api/test.schema';
import type {
    PublicTest, SubmissionResponse, TestSummary,
} from '../../shared/schemas/api/test.schema';

useHead({ title: '16 型人格測驗' });

const QUESTIONS_PER_PAGE = 8;
const RESULT_STORAGE_KEY = 'self-scope:mbti-result';

const route = useRoute();
const { isAuthenticated } = useAuth();
const { ensureSession } = useGuestSession();
const { post } = useApi();

const { load: loadExploration } = useExploration();
const loading = ref(true);
const loadError = ref<string | null>(null);
const test = ref<PublicTest | null>(null);
const answers = reactive<Record<string, number>>({});
const page = ref(0);
const submitting = ref(false);
const submitError = ref<string | null>(null);
const result = ref<SubmissionResponse | null>(null);

const questions = computed(() => test.value?.questions ?? []);
const pageCount = computed(() => Math.max(1, Math.ceil(questions.value.length / QUESTIONS_PER_PAGE)));
const pageQuestions = computed(() => questions.value.slice(page.value * QUESTIONS_PER_PAGE, (page.value + 1) * QUESTIONS_PER_PAGE));
function isAnswered(questionId: string): boolean {
    return answers[questionId] !== undefined;
}

const pageComplete = computed(() => pageQuestions.value.every((q) => answers[q.questionId] !== undefined));
const allAnswered = computed(() => questions.value.every((q) => answers[q.questionId] !== undefined));
const progress = computed(() => (questions.value.length
    ? (Object.keys(answers).length / questions.value.length) * 100
    : 0));

// Each page of questions starts at the top
watch(page, () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

function messageOf(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'data' in error) {
        const data = (error as { data?: { message?: string } }).data;
        if (data?.message) return data.message;
    }

    return error instanceof Error ? error.message : fallback;
}

// A guest's result is kept for this browser tab only; a signed-in user's is saved on the server.
function readStoredResult(): SubmissionResponse | null {
    try {
        const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
        if (!raw) return null;

        const parsed = submissionResponseSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
    } catch (error) {
        console.warn('[test] stored result unreadable:', error);
        return null;
    }
}

function storeResult(value: SubmissionResponse | null) {
    try {
        if (value) sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(value));
        else sessionStorage.removeItem(RESULT_STORAGE_KEY);
    } catch (error) {
        console.warn('[test] sessionStorage unavailable:', error);
    }
}

function retake() {
    storeResult(null);
    result.value = null;
    page.value = 0;
    for (const key of Object.keys(answers)) Reflect.deleteProperty(answers, key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(async () => {
    // Arriving from a report's "retake" button starts over instead of showing the kept result
    if (route.query.retake) storeResult(null);
    result.value = readStoredResult();

    try {
        const tests = await $fetch<TestSummary[]>('/api/tests');
        const first = tests[0];

        if (!first) {
            loadError.value = '目前沒有可用的測驗。';
            return;
        }

        test.value = await $fetch<PublicTest>(`/api/tests/${first.testId}`);
    } catch (error) {
        console.error('[test] failed to load test:', error);
        loadError.value = messageOf(error, '無法載入測驗，請稍後再試。');
    } finally {
        loading.value = false;
    }
});

async function submit() {
    if (!test.value) return;

    submitting.value = true;
    submitError.value = null;

    try {
        // Guests get a short-lived server session so their result can be saved if they sign in.
        if (!isAuthenticated.value) {
            await ensureSession();
        }

        result.value = await post<SubmissionResponse>(
            `/api/tests/${test.value.testId}/submissions`,
            {
                testVersion: test.value.version,
                answers: questions.value.map((q) => ({
                    questionId: q.questionId,
                    value: answers[q.questionId],
                })),
            },
            {},
            'optional',
        );
        storeResult(result.value);
        // The result is now part of the member's (or guest's) profile: other screens must see it
        await loadExploration();
    } catch (error) {
        console.error('[test] submit failed:', error);
        submitError.value = messageOf(error, '送出失敗，請稍後再試。');
    } finally {
        submitting.value = false;
    }
}
</script>

<style scoped>
/* Not answered yet: plain and muted, so what is left to do stands out */
.question {
    border-left: 4px solid rgba(var(--v-theme-on-surface), 0.12);
    transition: background-color 0.2s, border-color 0.2s;
}

.question__mark {
    opacity: 0.45;
}

.question--answered {
    border-left-color: rgb(var(--v-theme-success));
    background: rgba(var(--v-theme-success), 0.07);
}

.question--answered .question__mark {
    opacity: 1;
}

.question--answered .question__text {
    color: rgba(var(--v-theme-on-surface), 0.75);
}
</style>
