<template>
    <div class="login">
        <v-card
            class="login__card"
            variant="flat"
        >
            <v-card-text class="pa-6 pa-sm-8">
                <p class="login__eyebrow">
                    登入
                </p>
                <h1 class="login__title">
                    保存你的探索，繼續往下看
                </h1>

                <ul class="login__list">
                    <li>
                        <v-icon
                            icon="mdi-content-save-outline"
                            size="20"
                        />
                        <span>保存你的資料與結果，下次回來不用重填</span>
                    </li>
                    <li>
                        <v-icon
                            icon="mdi-layers-triple-outline"
                            size="20"
                        />
                        <span>綜合不同維度的分析報告，做多維度分析</span>
                    </li>
                    <li>
                        <v-icon
                            icon="mdi-gift-outline"
                            size="20"
                        />
                        <span>第一次登入即贈送 3 點</span>
                    </li>
                </ul>

                <v-alert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="mb-4"
                >
                    {{ error }}
                </v-alert>

                <v-btn
                    block
                    size="large"
                    color="primary"
                    prepend-icon="mdi-google"
                    :loading="signingIn"
                    @click="signIn"
                >
                    以 Google 登入
                </v-btn>
                <p class="login__note">
                    沒有登入也能做單一維度的分析，只是結果不會保留。
                </p>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
useHead({ title: '登入' });

const route = useRoute();
const {
    isAuthenticated, initialized, error, signInWithGoogle, initAuthListener,
} = useAuth();
const { claim } = useGuestSession();
const { refresh: refreshPoints } = usePoints();

const signingIn = ref(false);

/** Back to where the visitor came from; only a path on this site is followed. */
const destination = computed(() => {
    const target = route.query.redirect;

    return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/';
});

/** Signing in keeps what the visitor did as a guest (FR-032), then refreshes everything shown. */
async function signIn() {
    signingIn.value = true;

    try {
        if (!await signInWithGoogle()) return;

        await claim();
        // The welcome grant is created by this very login, so the bar must read the balance again
        await refreshPoints();
        await navigateTo(destination.value);
    } finally {
        signingIn.value = false;
    }
}

// Someone already signed in has nothing to do here
watch([initialized, isAuthenticated], async ([ready, signedIn]) => {
    if (ready && signedIn && !signingIn.value) await navigateTo(destination.value);
}, { immediate: true });

onMounted(() => {
    initAuthListener();
});
</script>

<style scoped>
.login {
    display: flex;
    justify-content: center;
    padding: 24px 0;
}

.login__card {
    width: 100%;
    max-width: 440px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    box-shadow: 0 8px 30px rgba(47, 93, 138, 0.1);
}

.login__eyebrow {
    margin: 0 0 8px;
    font-size: 0.875rem;
    letter-spacing: 0.3em;
    color: rgb(var(--v-theme-primary));
}

.login__title {
    margin: 0 0 20px;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.4;
}

.login__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0 0 24px;
    padding: 0;
    list-style: none;
}

.login__list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: rgba(var(--v-theme-on-surface), 0.8);
}

.login__list .v-icon {
    margin-top: 2px;
    color: rgb(var(--v-theme-primary));
}

.login__note {
    margin: 12px 0 0;
    text-align: center;
    font-size: 0.8rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
