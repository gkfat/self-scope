<template>
    <div>
        <h1 class="text-h5 mb-4">
            帳號管理
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
                <v-card-title>刪除帳號</v-card-title>
                <v-card-text>
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
import type { PointBalance } from '../../shared/schemas/api/points.schema';
import type { DeleteResult } from '../../shared/schemas/api/account.schema';

definePageMeta({ middleware: 'member' });

useHead({ title: '帳號管理' });

const {
    isAuthenticated, signOut, initAuthListener,
} = useAuth();
const {
    get, del,
} = useApi();

const balance = ref<PointBalance | null>(null);
const loadError = ref<string | null>(null);

const confirmAccount = ref(false);
const deleting = ref(false);

const snackbar = ref(false);
const snackbarColor = ref('success');
const message = ref('');

function notify(text: string, color: string) {
    message.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
}

async function load() {
    loadError.value = null;

    try {
        balance.value = await get<PointBalance>('/api/points');
    } catch (error) {
        console.error('[me] failed to load:', error);
        loadError.value = '無法載入資料，請稍後再試。';
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
