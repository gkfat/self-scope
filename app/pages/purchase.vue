<template>
    <div>
        <h1 class="text-h5 mb-4">
            購買點數
        </h1>

        <v-alert
            v-if="!isAuthenticated"
            type="info"
            variant="tonal"
        >
            購買點數需先登入。
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

            <p
                v-else-if="!packages.length && !loading"
                class="mb-4"
            >
                目前沒有可購買的方案。
            </p>

            <v-radio-group
                v-model="selected"
                hide-details
                class="mb-4"
            >
                <v-radio
                    v-for="item in packages"
                    :key="item.packageId"
                    :value="item.packageId"
                    :label="`${item.points} 點 · ${item.price.amount} ${item.price.currency}`"
                />
            </v-radio-group>

            <v-alert
                type="warning"
                variant="tonal"
                class="mb-2"
            >
                點數為數位內容，購買後立即提供，恕不退款。購買的點數沒有使用期限。
            </v-alert>
            <v-checkbox
                v-model="agreed"
                label="我了解並同意：立即提供數位內容，並放棄解約（恕不退款）"
                hide-details
            />

            <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="my-3"
            >
                {{ error }}
            </v-alert>

            <v-btn
                class="mt-3"
                color="primary"
                :disabled="!selected || !agreed"
                :loading="submitting"
                @click="pay"
            >
                前往付款
            </v-btn>
        </template>
    </div>
</template>

<script lang="ts" setup>
import type {
    CheckoutSessionResponse, PointPackageItem,
} from '../../shared/schemas/api/payment.schema';
import { DIGITAL_CONTENT_TERMS_VERSION } from '../../shared/constants/terms';

useHead({ title: '購買點數' });

const {
    isAuthenticated, signInWithGoogle, initAuthListener,
} = useAuth();
const { post } = useApi();

const packages = ref<PointPackageItem[]>([]);
const selected = ref<string | null>(null);
const agreed = ref(false);
const loading = ref(true);
const loadError = ref<string | null>(null);
const submitting = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
    initAuthListener();

    try {
        packages.value = await $fetch<PointPackageItem[]>('/api/point-packages');
    } catch (err) {
        console.error('[purchase] failed to load packages:', err);
        loadError.value = '無法載入方案，請稍後再試。';
    } finally {
        loading.value = false;
    }
});

async function pay() {
    if (!selected.value || !agreed.value) return;

    submitting.value = true;
    error.value = null;

    try {
        const session = await post<CheckoutSessionResponse>('/api/payments', {
            packageId: selected.value,
            acceptDigitalContentTerms: true,
            termsVersion: DIGITAL_CONTENT_TERMS_VERSION,
        });

        await navigateTo(session.checkoutUrl, { external: /^https?:/.test(session.checkoutUrl) });
    } catch (err) {
        console.error('[purchase] failed to start payment:', err);

        const message = (err as { data?: { message?: string } }).data?.message;

        error.value = message ?? '無法建立付款，請稍後再試。';
    } finally {
        submitting.value = false;
    }
}
</script>
