<template>
    <v-main>
        <v-container class="py-6">
            <h1 class="text-h5 mb-4">
                簡易 summary
            </h1>

            <v-alert
                v-if="!isAuthenticated"
                type="info"
                variant="tonal"
            >
                簡易 summary 需登入後取得（每組結果 1 點，註冊即贈 3 點）。
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

                <v-card
                    v-if="summary"
                    class="mb-4"
                >
                    <v-card-title>{{ summary.content.title }}</v-card-title>
                    <v-card-text>
                        <p class="mb-4">
                            {{ summary.content.summary }}
                        </p>
                        <p
                            v-if="summary.pointsDeducted === 0"
                            class="text-caption"
                        >
                            你已取得過這組結果，本次不扣點。
                        </p>
                        <p class="text-caption text-medium-emphasis">
                            {{ summary.content.disclaimer }}
                        </p>
                        <p class="text-caption text-medium-emphasis">
                            保存至 {{ new Date(summary.expiresAt).toLocaleDateString('zh-TW') }}
                        </p>
                    </v-card-text>
                </v-card>

                <v-checkbox
                    v-model="includeBloodType"
                    label="納入血型（已填寫血型時）"
                    hide-details
                />
                <v-btn
                    color="primary"
                    class="mt-2"
                    :loading="loading"
                    @click="obtain"
                >
                    取得簡易 summary（1 點）
                </v-btn>
            </template>
        </v-container>
    </v-main>
</template>

<script lang="ts" setup>
import type { SummaryObtained } from '../../shared/schemas/api/summary.schema';

useHead({ title: '簡易 summary' });

type Problem = {
    type: 'error' | 'warning' | 'info';
    message: string;
    to?: string;
    action?: string;
};

const {
    isAuthenticated, signInWithGoogle, initAuthListener,
} = useAuth();
const { post } = useApi();

const includeBloodType = ref(true);
const loading = ref(false);
const summary = ref<SummaryObtained | null>(null);
const problem = ref<Problem | null>(null);

onMounted(() => {
    initAuthListener();
});

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

    if (failure.data?.code === 'MBTI_REQUIRED') {
        return {
            type: 'info',
            message: '請先完成 16 型人格測驗，才能取得 summary。',
            to: '/test',
            action: '前往測驗',
        };
    }

    if (failure.data?.code === 'PROFILE_REQUIRED') {
        return {
            type: 'info',
            message: '請先填寫生日與星座。',
        };
    }

    if (failure.statusCode === 404) {
        return {
            type: 'warning',
            message: '這組結果的內容尚未提供，未扣點，請稍後再試。',
        };
    }

    return {
        type: 'error',
        message: failure.data?.message ?? '取得失敗，請稍後再試。',
    };
}

async function obtain() {
    loading.value = true;
    problem.value = null;

    try {
        summary.value = await post<SummaryObtained>('/api/summaries', { includeBloodType: includeBloodType.value });
    } catch (error) {
        console.error('[summary] obtain failed:', error);
        problem.value = problemFrom(error);
    } finally {
        loading.value = false;
    }
}
</script>
