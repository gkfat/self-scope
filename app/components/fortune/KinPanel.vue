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

        <!-- Not unlocked: an invitation and one button, and nothing about today's Kin -->
        <v-card
            v-if="!unlocked && status !== 'loading' && status !== 'failed'"
            variant="outlined"
            class="mb-4 text-center"
        >
            <v-card-text class="py-8">
                <v-icon
                    icon="mdi-calendar-star"
                    size="40"
                    color="primary"
                    class="mb-3"
                />
                <p class="text-body-1 mb-1">
                    今天的 Kin 還沒揭曉
                </p>
                <p class="text-body-2 text-medium-emphasis mb-5">
                    每天可以揭曉一次，看看今天的圖騰與調性
                </p>
                <v-btn
                    color="primary"
                    size="large"
                    prepend-icon="mdi-star-four-points-outline"
                    :loading="unlocking"
                    @click="unlock"
                >
                    揭曉今日 Kin
                </v-btn>
            </v-card-text>
        </v-card>

        <template v-if="unlocked">
            <KinBadge
                :kin="unlocked.kin"
                class="mb-4"
            />

            <!-- The same sections, in the same order, as the report of a tarot card or a rune -->
            <v-card
                v-if="reading"
                variant="outlined"
                class="mb-4"
            >
                <v-card-title>概覽</v-card-title>
                <v-card-text>
                    <blockquote class="quote">
                        <p class="quote__text">
                            {{ reading.lead }}
                        </p>
                    </blockquote>

                    <v-row dense>
                        <v-col
                            v-for="fact in reading.facts"
                            :key="fact.label"
                            cols="12"
                            sm="6"
                            md="4"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ fact.label }}
                                    </div>
                                    <div class="text-body-1 font-weight-medium">
                                        {{ fact.value }}
                                    </div>
                                    <div
                                        v-if="fact.subtitle"
                                        class="text-body-2 text-medium-emphasis"
                                    >
                                        {{ fact.subtitle }}
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>

                    <ReportReadingGroups :groups="reading.groups" />
                </v-card-text>
            </v-card>

            <ReportAdviceCard
                v-if="reading"
                title="給你的建議"
                :advice="reading.advice"
            />

            <p class="text-caption text-medium-emphasis mb-4">
                {{ unlocked.content.disclaimer }}
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { kinTodayReading } from '../../../shared/report/adapters/kinToday';

const {
    today, status, unlocking, load, unlock,
} = useKinToday();

const unlocked = computed(() => (today.value?.unlocked ? today.value : null));

/** Today's Kin as the sections of a draw, the same as a card or a rune */
const reading = computed(() => (unlocked.value ? kinTodayReading({
    kin: unlocked.value.kin, content: unlocked.value.content,
}) : null));

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
