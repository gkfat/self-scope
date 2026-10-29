<template>
    <div>
        <h1 class="text-h5 mb-4">
            我的點數
        </h1>

        <v-alert
            v-if="loadError"
            type="error"
            variant="tonal"
        >
            {{ loadError }}
        </v-alert>

        <template v-else-if="balance">
            <v-card class="mb-4">
                <v-card-title>可用點數：{{ balance.availableBalance }}</v-card-title>
                <v-card-text>
                    <v-table
                        v-if="balance.batches.length"
                        density="compact"
                    >
                        <thead>
                            <tr>
                                <th>來源</th>
                                <th>剩餘</th>
                                <th>效期</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="batch in balance.batches"
                                :key="batch.batchId"
                            >
                                <td>{{ sourceLabel[batch.source] }}</td>
                                <td>{{ batch.remaining }} / {{ batch.granted }}</td>
                                <td>{{ batch.expiresAt ? formatDate(batch.expiresAt) : '無期限' }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                    <p v-else>
                        目前沒有可用的點數。
                    </p>
                </v-card-text>
            </v-card>

            <v-card>
                <v-card-title>異動紀錄</v-card-title>
                <v-card-text>
                    <p v-if="!transactions.length">
                        尚無異動紀錄。
                    </p>
                    <v-list v-else>
                        <v-list-item
                            v-for="item in transactions"
                            :key="item.transactionId"
                            :title="`${typeLabel[item.type]} ${item.amount} 點 · ${reasonLabel[item.reason]}`"
                            :subtitle="formatDate(item.createdAt)"
                        />
                    </v-list>
                    <v-btn
                        v-if="nextCursor"
                        :loading="loadingMore"
                        @click="loadMore"
                    >
                        載入更多
                    </v-btn>
                </v-card-text>
            </v-card>
        </template>
    </div>
</template>

<script lang="ts" setup>
import type {
    PointBalance, PointTransactionList,
} from '../../shared/schemas/api/points.schema';

definePageMeta({ middleware: 'member' });

useHead({ title: '我的點數' });

const {
    isAuthenticated,
} = useAuth();
const { get } = useApi();

const balance = ref<PointBalance | null>(null);
const transactions = ref<PointTransactionList['items']>([]);
const nextCursor = ref<string | null>(null);
const loadError = ref<string | null>(null);
const loadingMore = ref(false);

const sourceLabel = {
    WELCOME: '註冊贈點',
    PURCHASE: '購買',
    REFUND: '返還',
} as const;

const typeLabel = {
    GRANT: '獲得',
    PURCHASE: '購買',
    DEDUCT: '扣除',
    REFUND: '返還',
} as const;

const reasonLabel = {
    WELCOME: '註冊贈點',
    SINGLE_AI_ANALYSIS: 'AI 進階分析',
    MULTI_REPORT: '多維度報告',
    PURCHASE: '購買點數',
} as const;

const PAGE_SIZE = 20;

function formatDate(epochMs: number): string {
    return new Date(epochMs).toLocaleDateString('zh-TW');
}

async function loadFirstPage() {
    loadError.value = null;

    try {
        balance.value = await get<PointBalance>('/api/points');

        const page = await get<PointTransactionList>('/api/points/transactions', { query: { limit: PAGE_SIZE } });

        transactions.value = page.items;
        nextCursor.value = page.nextCursor;
    } catch (error) {
        console.error('[points] failed to load:', error);
        loadError.value = '無法載入點數資料，請稍後再試。';
    }
}

async function loadMore() {
    if (!nextCursor.value) return;

    loadingMore.value = true;

    try {
        const page = await get<PointTransactionList>('/api/points/transactions', {
            query: {
                limit: PAGE_SIZE, cursor: nextCursor.value,
            },
        });

        transactions.value = [...transactions.value, ...page.items];
        nextCursor.value = page.nextCursor;
    } catch (error) {
        console.error('[points] failed to load more:', error);
        loadError.value = '無法載入更多紀錄，請稍後再試。';
    } finally {
        loadingMore.value = false;
    }
}

const { initAuthListener } = useAuth();

onMounted(() => {
    initAuthListener();
});

watch(isAuthenticated, (signedIn) => {
    if (signedIn) loadFirstPage();
}, { immediate: true });
</script>
