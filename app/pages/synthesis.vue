<template>
    <div>
        <h1 class="text-h5 mb-1">
            合成分析
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-4">
            把星座、MBTI、血型與人類圖合起來看。需要點數，已取得過的結果不會重複扣點。
        </p>

        <v-alert
            v-if="!progress.synthesisUnlocked"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            還差 {{ missing.join('、') }}，完成後才能做合成分析。
            <template #append>
                <v-btn
                    :to="missingTo"
                    size="small"
                    variant="text"
                >
                    去完成
                </v-btn>
            </template>
        </v-alert>

        <v-alert
            v-else-if="!isAuthenticated"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            登入後才能取得合成分析，新帳號送 {{ WELCOME_POINTS }} 點。
            <template #append>
                <v-btn
                    size="small"
                    color="primary"
                    :loading="loading"
                    @click="signIn"
                >
                    登入
                </v-btn>
            </template>
        </v-alert>

        <v-card
            v-for="item in options"
            :key="item.to"
            class="mb-4"
        >
            <v-card-title class="d-flex align-center justify-space-between">
                <span>{{ item.title }}</span>
                <v-chip
                    size="small"
                    color="primary"
                    variant="tonal"
                >
                    {{ item.cost }} 點
                </v-chip>
            </v-card-title>
            <v-card-text>
                {{ item.description }}
            </v-card-text>
            <v-card-actions>
                <v-btn
                    :to="item.to"
                    color="primary"
                    :disabled="!canUse"
                >
                    {{ item.action }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <p
            v-if="isAuthenticated"
            class="text-body-2 text-medium-emphasis"
        >
            目前有 {{ balance ?? '—' }} 點。
            <NuxtLink to="/purchase">
                購買點數
            </NuxtLink>
        </p>
    </div>
</template>

<script lang="ts" setup>
import {
    DETAILED_REPORT_COST_POINTS, SUMMARY_COST_POINTS, WELCOME_POINTS,
} from '../../shared/constants/points';

useHead({ title: '合成分析' });

const {
    isAuthenticated, loading, signInWithGoogle, initAuthListener,
} = useAuth();
const { balance } = usePoints();
const { progress } = useExploration();
const { claim } = useGuestSession();

const canUse = computed(() => progress.value.synthesisUnlocked && isAuthenticated.value);

const options = [
    {
        title: '簡易 summary',
        cost: SUMMARY_COST_POINTS,
        description: '依星座與 MBTI（可加血型）事先寫好的內容，幾秒內看完。',
        action: '取得簡易 summary',
        to: '/summary',
    },
    {
        title: '詳細分析',
        cost: DETAILED_REPORT_COST_POINTS,
        description: 'AI 依你的資料產生八個章節，約 1–2 分鐘，失敗會自動退點。',
        action: '產生詳細分析',
        to: '/report',
    },
];

const missing = computed(() => [
    ...(progress.value.done.ZODIAC ? [] : ['出生日期']),
    ...(progress.value.done.MBTI ? [] : ['MBTI 測驗']),
]);
const missingTo = computed(() => (progress.value.done.ZODIAC ? '/test' : '/profile'));

async function signIn() {
    if (await signInWithGoogle()) await claim();
}

onMounted(() => {
    initAuthListener();
});
</script>
