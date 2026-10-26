<template>
    <div>
        <h1 class="text-h5 mb-4">
            個人中心
        </h1>

        <v-alert
            v-if="!isAuthenticated"
            type="info"
            variant="tonal"
        >
            請先登入。
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
                v-if="loadError"
                type="error"
                variant="tonal"
                class="mb-4"
            >
                {{ loadError }}
            </v-alert>

            <v-card class="mb-4">
                <v-card-title>我的資料</v-card-title>
                <v-card-text>
                    <v-btn
                        to="/profile"
                        variant="text"
                    >
                        查看或修改出生日期、血型、出生時間與地點
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>點數</v-card-title>
                <v-card-text>
                    可用 {{ balance?.availableBalance ?? '—' }} 點
                    <v-btn
                        class="ml-2"
                        to="/points"
                        variant="text"
                    >
                        明細
                    </v-btn>
                    <v-btn
                        to="/purchase"
                        variant="text"
                    >
                        購買
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>測驗結果（保存 3 個月）</v-card-title>
                <v-card-text>
                    <p v-if="!attempts.length">
                        尚無測驗結果。
                    </p>
                    <v-list v-else>
                        <v-list-item
                            v-for="item in attempts"
                            :key="item.attemptId"
                            :title="`${item.result} · ${formatDate(item.completedAt)}`"
                            :subtitle="`保存至 ${formatDate(item.expiresAt)}`"
                        />
                    </v-list>
                    <v-btn
                        to="/test"
                        variant="text"
                    >
                        重新測驗
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>簡易 summary（保存 3 個月）</v-card-title>
                <v-card-text>
                    <p v-if="!summaries.length">
                        尚未取得。
                    </p>
                    <v-list v-else>
                        <v-list-item
                            v-for="item in summaries"
                            :key="item.summaryId"
                            :title="item.content.title"
                            :subtitle="`保存至 ${formatDate(item.expiresAt)}`"
                        >
                            <template #append>
                                <ShareButton
                                    source="SUMMARY"
                                    :reference-id="item.summaryId"
                                />
                            </template>
                        </v-list-item>
                    </v-list>
                    <v-btn
                        to="/summary"
                        variant="text"
                    >
                        取得 summary
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>人類圖（保存 3 個月）</v-card-title>
                <v-card-text>
                    <v-btn
                        to="/human-design"
                        variant="text"
                    >
                        查看或計算人類圖
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>詳細分析（保存 6 個月）</v-card-title>
                <v-card-text>
                    <v-btn
                        to="/report"
                        variant="text"
                    >
                        查看或產生詳細分析
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-card class="mb-4">
                <v-card-title>付款紀錄</v-card-title>
                <v-card-text>
                    <p v-if="!payments.length">
                        尚無付款紀錄。
                    </p>
                    <v-list v-else>
                        <v-list-item
                            v-for="item in payments"
                            :key="item.paymentId"
                            :title="`${item.pointsPurchased} 點 · ${item.amount.amount} ${item.amount.currency}`"
                            :subtitle="`${statusLabel[item.status]} · ${formatDate(item.createdAt)}`"
                        />
                    </v-list>
                </v-card-text>
            </v-card>

            <v-card>
                <v-card-title>資料管理</v-card-title>
                <v-card-text>
                    <p class="mb-2">
                        刪除所選資料（不影響點數與付款）：
                    </p>
                    <v-checkbox
                        v-for="option in scopeOptions"
                        :key="option.value"
                        v-model="selectedScopes"
                        :label="option.label"
                        :value="option.value"
                        hide-details
                        density="compact"
                    />
                    <v-btn
                        class="mt-2"
                        :disabled="!selectedScopes.length"
                        @click="confirmData = true"
                    >
                        刪除所選資料
                    </v-btn>

                    <v-divider class="my-4" />

                    <p class="mb-2">
                        刪除帳號會移除你的全部資料（含付款紀錄）。未用的點數會失效且不退款。
                    </p>
                    <v-btn
                        color="error"
                        @click="confirmAccount = true"
                    >
                        刪除帳號
                    </v-btn>
                </v-card-text>
            </v-card>
        </template>

        <v-dialog
            v-model="confirmData"
            max-width="420"
        >
            <v-card>
                <v-card-title>確定刪除所選資料？</v-card-title>
                <v-card-text>刪除後無法復原。</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="confirmData = false">
                        取消
                    </v-btn>
                    <v-btn
                        color="error"
                        :loading="deleting"
                        @click="deleteData"
                    >
                        刪除
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog
            v-model="confirmAccount"
            max-width="420"
        >
            <v-card>
                <v-card-title>確定刪除帳號？</v-card-title>
                <v-card-text>
                    你目前有 {{ balance?.availableBalance ?? 0 }} 點，刪除後將失效且不退款。此操作無法復原。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="confirmAccount = false">
                        取消
                    </v-btn>
                    <v-btn
                        color="error"
                        :loading="deleting"
                        @click="deleteAccount"
                    >
                        永久刪除
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar
            v-model="snackbar"
            :color="snackbarColor"
        >
            {{ message }}
        </v-snackbar>
    </div>
</template>

<script lang="ts" setup>
import type { PaymentItem } from '../../shared/schemas/api/payment.schema';
import type { PointBalance } from '../../shared/schemas/api/points.schema';
import type { SummaryItem } from '../../shared/schemas/api/summary.schema';
import type { TestAttemptItem } from '../../shared/schemas/api/test.schema';
import type {
    DeleteDataScope, DeleteResult,
} from '../../shared/schemas/api/account.schema';

useHead({ title: '個人中心' });

const {
    isAuthenticated, signInWithGoogle, signOut, initAuthListener,
} = useAuth();
const {
    get, del,
} = useApi();

const balance = ref<PointBalance | null>(null);
const attempts = ref<TestAttemptItem[]>([]);
const summaries = ref<SummaryItem[]>([]);
const payments = ref<PaymentItem[]>([]);
const loadError = ref<string | null>(null);

const selectedScopes = ref<DeleteDataScope[]>([]);
const confirmData = ref(false);
const confirmAccount = ref(false);
const deleting = ref(false);

const snackbar = ref(false);
const snackbarColor = ref('success');
const message = ref('');

const statusLabel = {
    PENDING: '處理中',
    COMPLETED: '已完成',
    FAILED: '失敗',
} as const;

const scopeOptions: Array<{ value: DeleteDataScope; label: string }> = [
    {
        value: 'RESULTS', label: '測驗結果（含 MBTI）',
    },
    {
        value: 'SUMMARIES', label: '簡易 summary',
    },
    {
        value: 'REPORTS', label: '詳細分析報告',
    },
    {
        value: 'HUMAN_DESIGN', label: '人類圖',
    },
];

function formatDate(epochMs: number): string {
    return new Date(epochMs).toLocaleDateString('zh-TW');
}

function notify(text: string, color: string) {
    message.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
}

async function load() {
    loadError.value = null;

    try {
        [
            balance.value,
            attempts.value,
            summaries.value,
            payments.value,
        ] = await Promise.all([
            get<PointBalance>('/api/points'),
            get<TestAttemptItem[]>('/api/test-attempts'),
            get<SummaryItem[]>('/api/summaries'),
            get<PaymentItem[]>('/api/payments'),
        ]);
    } catch (error) {
        console.error('[me] failed to load:', error);
        loadError.value = '無法載入資料，請稍後再試。';
    }
}

async function deleteData() {
    deleting.value = true;

    try {
        await del<DeleteResult>('/api/account/data', { scopes: selectedScopes.value });
        confirmData.value = false;
        selectedScopes.value = [];
        notify('已刪除所選資料', 'success');
        await load();
    } catch (error) {
        console.error('[me] delete data failed:', error);
        notify('刪除失敗，請稍後再試', 'error');
    } finally {
        deleting.value = false;
    }
}

async function deleteAccount() {
    deleting.value = true;

    try {
        await del<DeleteResult>('/api/account');
        confirmAccount.value = false;
        await signOut();
        await navigateTo('/');
    } catch (error) {
        console.error('[me] delete account failed:', error);
        notify('刪除帳號失敗，請稍後再試（資料可能已部分刪除，可再次執行）', 'error');
    } finally {
        deleting.value = false;
    }
}

onMounted(() => {
    initAuthListener();
});

watch(isAuthenticated, (signedIn) => {
    if (signedIn) load();
}, { immediate: true });
</script>
