<template>
    <v-main>
        <v-container class="py-6">
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
                <v-card class="mb-4">
                    <v-card-title>{{ result.content.title }}（{{ result.result }}）</v-card-title>
                    <v-card-text>
                        <p class="mb-4">
                            {{ result.content.summary }}
                        </p>
                        <div v-if="result.content.strengths.length">
                            <strong>可能優勢</strong>
                            <ul class="mb-4">
                                <li
                                    v-for="item in result.content.strengths"
                                    :key="item"
                                >
                                    {{ item }}
                                </li>
                            </ul>
                        </div>
                        <div v-if="result.content.blindSpots.length">
                            <strong>潛在盲點</strong>
                            <ul class="mb-4">
                                <li
                                    v-for="item in result.content.blindSpots"
                                    :key="item"
                                >
                                    {{ item }}
                                </li>
                            </ul>
                        </div>
                        <p class="text-caption text-medium-emphasis">
                            {{ result.content.disclaimer }}
                        </p>
                    </v-card-text>
                </v-card>

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
                <GuestNotice v-else />
            </template>

            <template v-else-if="test">
                <h1 class="text-h5 mb-2">
                    {{ test.title }}
                </h1>
                <v-progress-linear
                    :model-value="progress"
                    class="mb-4"
                />
                <GuestNotice />

                <v-card
                    v-for="question in pageQuestions"
                    :key="question.questionId"
                    class="mb-3"
                >
                    <v-card-text>
                        <div class="mb-2">
                            {{ question.text }}
                        </div>
                        <v-radio-group
                            v-model="answers[question.questionId]"
                            inline
                            hide-details
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
        </v-container>
    </v-main>
</template>

<script lang="ts" setup>
import type {
    PublicTest, SubmissionResponse, TestSummary,
} from '../../shared/schemas/api/test.schema';

useHead({ title: '16 型人格測驗' });

const QUESTIONS_PER_PAGE = 8;

const { isAuthenticated } = useAuth();
const { ensureSession } = useGuestSession();
const { post } = useApi();

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
const pageComplete = computed(() => pageQuestions.value.every((q) => answers[q.questionId] !== undefined));
const allAnswered = computed(() => questions.value.every((q) => answers[q.questionId] !== undefined));
const progress = computed(() => (questions.value.length
    ? (Object.keys(answers).length / questions.value.length) * 100
    : 0));

function messageOf(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'data' in error) {
        const data = (error as { data?: { message?: string } }).data;
        if (data?.message) return data.message;
    }

    return error instanceof Error ? error.message : fallback;
}

onMounted(async () => {
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
    } catch (error) {
        console.error('[test] submit failed:', error);
        submitError.value = messageOf(error, '送出失敗，請稍後再試。');
    } finally {
        submitting.value = false;
    }
}
</script>
