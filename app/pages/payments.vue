<template>
    <div>
        <h1 class="text-h5 mb-4">
            付款紀錄
        </h1>

        <template v-if="isAuthenticated">
            <v-alert
                v-if="loadError"
                type="error"
                variant="tonal"
                class="mb-4"
            >
                {{ loadError }}
            </v-alert>

            <v-card variant="outlined">
                <v-card-text>
                    <v-progress-circular
                        v-if="loading"
                        indeterminate
                    />
                    <p v-else-if="!payments.length">
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
        </template>
    </div>
</template>

<script lang="ts" setup>
import type { PaymentItem } from '../../shared/schemas/api/payment.schema';

definePageMeta({ middleware: 'member' });

useHead({ title: '付款紀錄' });

const {
    isAuthenticated,
} = useAuth();
const { get } = useApi();

const payments = ref<PaymentItem[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);

const statusLabel = {
    PENDING: '處理中',
    COMPLETED: '已完成',
    FAILED: '失敗',
} as const;

function formatDate(epochMs: number): string {
    return new Date(epochMs).toLocaleDateString('zh-TW');
}

async function load() {
    loading.value = true;
    loadError.value = null;

    try {
        payments.value = await get<PaymentItem[]>('/api/payments');
    } catch (error) {
        console.error('[payments] failed to load:', error);
        loadError.value = '無法載入付款紀錄，請稍後再試。';
    } finally {
        loading.value = false;
    }
}

// The sign-in state settles after mount, so load whenever it becomes true
watch(isAuthenticated, (signedIn) => {
    if (signedIn) void load();
}, { immediate: true });
</script>
