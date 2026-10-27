<template>
    <div>
        <v-progress-linear
            v-if="status === 'loading'"
            indeterminate
            class="mb-4"
        />

        <v-alert
            v-if="status === 'failed'"
            type="error"
            variant="tonal"
            class="mb-4"
        >
            暫時無法取得今天的 Kin，請稍後再試。
            <template #append>
                <v-btn
                    size="small"
                    @click="load"
                >
                    重試
                </v-btn>
            </template>
        </v-alert>

        <v-alert
            v-else-if="status === 'missing'"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            今天的內容還在準備中，晚一點再回來看看。
        </v-alert>

        <!-- Not unlocked: one button, and nothing about today's Kin -->
        <v-card
            v-if="!unlocked && status !== 'loading' && status !== 'failed'"
            variant="outlined"
            class="mb-4 text-center"
        >
            <v-card-text>
                <v-btn
                    color="primary"
                    size="large"
                    :loading="unlocking"
                    @click="unlock"
                >
                    計算今日 Kin
                </v-btn>
            </v-card-text>
        </v-card>

        <template v-if="unlocked">
            <p class="text-caption text-medium-emphasis text-center mb-2">
                {{ unlocked.date }}
            </p>
            <KinBadge
                :kin="unlocked.kin"
                class="mb-4"
            />

            <v-card
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <p class="text-subtitle-1 font-weight-medium mb-2">
                        {{ unlocked.content.title }}
                    </p>
                    <blockquote class="quote">
                        <p class="quote__text">
                            {{ unlocked.content.summary }}
                        </p>
                    </blockquote>

                    <section
                        v-if="unlocked.content.strengths.length"
                        class="mb-4"
                    >
                        <div class="text-subtitle-1 font-weight-medium mb-2">
                            今日關鍵字
                        </div>
                        <v-chip
                            v-for="word in unlocked.content.strengths"
                            :key="word"
                            class="mr-2 mb-2"
                            variant="tonal"
                            color="primary"
                        >
                            {{ word }}
                        </v-chip>
                    </section>

                    <section
                        v-if="unlocked.content.blindSpots.length"
                        class="mb-4"
                    >
                        <div class="text-subtitle-1 font-weight-medium mb-2">
                            <v-icon
                                color="warning"
                                size="20"
                            >
                                mdi-eye-outline
                            </v-icon>
                            今天可以留意的事
                        </div>
                        <ul class="pl-5">
                            <li
                                v-for="item in unlocked.content.blindSpots"
                                :key="item"
                                class="mb-1"
                            >
                                {{ item }}
                            </li>
                        </ul>
                    </section>

                    <section v-if="unlocked.content.growthAdvice.trim()">
                        <div class="text-subtitle-1 font-weight-medium mb-2">
                            <v-icon
                                color="success"
                                size="20"
                            >
                                mdi-check-circle-outline
                            </v-icon>
                            今天可以試試
                        </div>
                        <blockquote class="quote mb-0">
                            <p class="quote__text">
                                {{ unlocked.content.growthAdvice }}
                            </p>
                        </blockquote>
                    </section>
                </v-card-text>
            </v-card>

            <p class="text-caption text-medium-emphasis mb-4">
                {{ unlocked.content.disclaimer }}
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
const {
    today, status, unlocking, load, unlock,
} = useKinToday();

const unlocked = computed(() => (today.value?.unlocked ? today.value : null));

// The page may stay open past Taipei midnight: asking again when it is looked at again gives the new day.
function onVisible() {
    if (document.visibilityState === 'visible') void load();
}

onMounted(() => {
    void load();
    document.addEventListener('visibilitychange', onVisible);
});

onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible));
</script>

<style scoped>
.quote {
    margin: 0 0 20px;
    padding: 16px 20px;
    border-left: 4px solid rgb(var(--v-theme-primary));
    border-radius: 0 8px 8px 0;
    background: rgba(var(--v-theme-primary), 0.06);
}

.quote__text {
    margin: 0;
    font-size: 1rem;
    line-height: 1.8;
}
</style>
