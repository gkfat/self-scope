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

            <template v-if="isAuthenticated && !mobile">
                <v-btn
                    v-for="item in navItems"
                    :key="item.to"
                    :to="item.to"
                    :prepend-icon="item.icon"
                    variant="text"
                    :active="isActive(item)"
                >
                    {{ item.label }}
                </v-btn>
            </template>

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
            <template v-else-if="initialized">
                <span class="login-promo mr-3">現在登入即贈送免費 3 點！</span>
                <v-btn
                    size="small"
                    variant="outlined"
                    color="primary"
                    prepend-icon="mdi-google"
                    class="mr-2"
                    :loading="loading"
                    @click="signIn"
                >
                    登入
                </v-btn>
            </template>
        </v-app-bar>

        <v-main class="layout-main">
            <v-container :class="['page', { 'page--with-nav': isAuthenticated && mobile }]">
                <slot />
            </v-container>
        </v-main>

        <v-bottom-navigation
            v-if="isAuthenticated && mobile"
            grow
            color="primary"
        >
            <v-btn
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :active="isActive(item)"
            >
                <v-icon>{{ item.icon }}</v-icon>
                <span>{{ item.label }}</span>
            </v-btn>
        </v-bottom-navigation>
    </div>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';

type NavItem = {
    to: string;
    label: string;
    icon: string;
    /** Other routes that belong under this tab */
    also: string[];
};

const navItems: NavItem[] = [
    {
        to: '/',
        label: '探索',
        icon: 'mdi-compass-outline',
        also: ['/profile', '/human-design'],
    },
    {
        to: '/test',
        label: '測驗',
        icon: 'mdi-clipboard-text-outline',
        also: [],
    },
    {
        to: '/synthesis',
        label: '合成',
        icon: 'mdi-layers-outline',
        also: ['/summary', '/report'],
    },
    {
        to: '/me',
        label: '我的',
        icon: 'mdi-account-outline',
        also: ['/points', '/purchase'],
    },
];

const { mobile } = useDisplay();
const route = useRoute();
const {
    isAuthenticated, initialized, loading, initAuthListener, signInWithGoogle,
} = useAuth();
const {
    balance, refresh: refreshPoints, clear: clearPoints,
} = usePoints();
const { load: loadExploration } = useExploration();
const { claim } = useGuestSession();

function isActive(item: NavItem): boolean {
    if (item.to === '/') return route.path === '/' || item.also.includes(route.path);

    return route.path === item.to || item.also.includes(route.path);
}

/** Signing in keeps what the visitor did as a guest (FR-032), then refreshes everything shown. */
async function signIn() {
    if (await signInWithGoogle()) await claim();
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

.page--with-nav {
    padding-bottom: 88px;
}
</style>
