<template>
    <div>
        <v-app-bar
            flat
            border="b"
        >
            <v-app-bar-title>
                <NuxtLink
                    to="/"
                    class="brand"
                >
                    多維度自我分析
                </NuxtLink>
            </v-app-bar-title>

            <v-spacer />

            <v-btn
                v-if="isAuthenticated"
                to="/points"
                variant="tonal"
                size="small"
                prepend-icon="mdi-circle-multiple-outline"
                class="mr-2"
            >
                {{ balance ?? '—' }} 點
            </v-btn>
            <v-btn
                v-if="isAuthenticated"
                icon="mdi-menu"
                variant="text"
                aria-label="開啟選單"
                @click="drawer = true"
            />
            <template v-else-if="initialized">
                <span class="login-promo mr-3">現在登入即贈送 3 點！</span>
                <v-btn
                    size="small"
                    variant="outlined"
                    color="primary"
                    prepend-icon="mdi-login"
                    class="mr-2"
                    to="/login"
                >
                    登入
                </v-btn>
            </template>
        </v-app-bar>

        <v-main class="layout-main">
            <v-container class="page">
                <slot />
            </v-container>
        </v-main>

        <v-dialog
            :model-value="welcomePoints > 0"
            max-width="400"
            @update:model-value="dismissWelcome"
        >
            <v-card>
                <v-card-title>歡迎加入！</v-card-title>
                <v-card-text>
                    你收到系統贈送的 {{ welcomePoints }} 點，可用在多維度分析。贈送的點數自發放日起 {{ WELCOME_BATCH_VALID_DAYS }} 天內有效。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        color="primary"
                        @click="dismissWelcome"
                    >
                        知道了
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-navigation-drawer
            v-if="isAuthenticated"
            v-model="drawer"
            location="right"
            temporary
        >
            <v-list
                nav
                density="comfortable"
            >
                <v-list-item
                    v-for="item in menuItems"
                    :key="item.to"
                    :to="item.to"
                    :prepend-icon="item.icon"
                    :title="item.label"
                    @click="drawer = false"
                />
            </v-list>
            <template #append>
                <v-divider />
                <v-list
                    nav
                    density="comfortable"
                >
                    <v-list-item
                        v-for="item in accountItems"
                        :key="item.to"
                        :to="item.to"
                        :prepend-icon="item.icon"
                        :title="item.label"
                        @click="drawer = false"
                    />
                    <v-list-item
                        prepend-icon="mdi-logout"
                        title="登出"
                        @click="logout"
                    />
                </v-list>
            </template>
        </v-navigation-drawer>
    </div>
</template>

<script lang="ts" setup>
import { WELCOME_BATCH_VALID_DAYS } from '../../shared/constants/points';

type MenuItem = {
    to: string;
    label: string;
    icon: string;
};

/** What the member does: their data and their reports */
const menuItems: MenuItem[] = [
    {
        to: '/profile', label: '個人資料', icon: 'mdi-account-outline',
    },
    {
        to: '/self-reports', label: '自我分析報告', icon: 'mdi-file-document-outline',
    },
    {
        to: '/report', label: '多維度分析', icon: 'mdi-layers-outline',
    },
];

/** The account itself: points, payments and settings, kept at the bottom */
const accountItems: MenuItem[] = [
    {
        to: '/points', label: '點數紀錄', icon: 'mdi-circle-multiple-outline',
    },
    {
        to: '/payments', label: '付款紀錄', icon: 'mdi-receipt-text-outline',
    },
    {
        to: '/me', label: '帳號管理', icon: 'mdi-cog-outline',
    },
];

const drawer = ref(false);
const {
    isAuthenticated, initialized, initAuthListener, signOut, welcomePoints, dismissWelcome,
} = useAuth();
const {
    balance, refresh: refreshPoints, clear: clearPoints,
} = usePoints();
const { load: loadExploration } = useExploration();

async function logout() {
    drawer.value = false;
    await signOut();
    // Pages for members only have nothing left to show
    await navigateTo('/');
}

// Whoever is looking changes when the sign-in state does: reload what belongs to them.
watch(isAuthenticated, async (signedIn) => {
    if (signedIn) {
        await Promise.all([refreshPoints(), loadExploration()]);

        return;
    }

    clearPoints();
    await loadExploration();
});

onMounted(() => {
    initAuthListener();
});

watch(initialized, async (ready) => {
    if (ready && !isAuthenticated.value) await loadExploration();
}, { immediate: true });
</script>

<style scoped>
.brand {
    color: inherit;
    text-decoration: none;
    font-weight: 700;
    letter-spacing: 0.02em;
}

/* A full-width backdrop on a page must not add a horizontal scrollbar. */
.layout-main {
    overflow-x: clip;
}

.login-promo {
    font-size: 0.8125rem;
    color: rgb(var(--v-theme-primary));
    white-space: nowrap;
}

/* Very narrow phones: the button alone, so the title and the button both fit. */
@media (max-width: 420px) {
    .login-promo {
        display: none;
    }
}

.page {
    max-width: 960px;
}
</style>
