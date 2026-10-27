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
            暫時無法取得今天的符文，請稍後再試。
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

        <template v-if="status !== 'loading' || today">
            <!-- Not drawn yet: all the stones scattered face down to choose from -->
            <template v-if="!drawn && status !== 'failed'">
                <RuneScatter
                    :picked="picked"
                    :busy="drawing"
                    @pick="onPick"
                />
                <p class="text-body-2 text-medium-emphasis text-center mt-2 mb-6">
                    每天可以抽一枚符文。憑直覺點選一顆符石，翻開今天給你的提醒。
                </p>
            </template>

            <RuneStone
                v-if="drawn"
                :rune="drawn.rune"
                :flipped="revealed"
                class="mb-4"
            />
        </template>

        <template v-if="drawn">
            <div class="d-flex flex-wrap justify-center ga-2 mb-4">
                <v-chip
                    size="small"
                    variant="outlined"
                >
                    Elder Futhark
                </v-chip>
                <v-chip
                    size="small"
                    variant="outlined"
                >
                    {{ RUNE_ORIENTATION_LABELS[drawn.rune.orientation] }}
                </v-chip>
                <v-chip
                    size="small"
                    variant="outlined"
                >
                    {{ drawn.date }}
                </v-chip>
            </div>

            <v-card
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <p class="text-subtitle-1 font-weight-medium mb-2">
                        {{ drawn.content.title }}
                    </p>
                    <blockquote class="quote">
                        <p class="quote__text">
                            {{ drawn.content.summary }}
                        </p>
                    </blockquote>

                    <section
                        v-if="drawn.content.strengths.length"
                        class="mb-4"
                    >
                        <div class="text-subtitle-1 font-weight-medium mb-2">
                            關鍵字
                        </div>
                        <v-chip
                            v-for="word in drawn.content.strengths"
                            :key="word"
                            class="mr-2 mb-2"
                            variant="tonal"
                            color="primary"
                        >
                            {{ word }}
                        </v-chip>
                    </section>

                    <section
                        v-if="drawn.content.blindSpots.length"
                        class="mb-4"
                    >
                        <div class="text-subtitle-1 font-weight-medium mb-2">
                            <v-icon
                                color="warning"
                                size="20"
                            >
                                mdi-eye-outline
                            </v-icon>
                            {{ drawn.rune.orientation === 'reversed' ? '需要留意的面向' : '可以留意的地方' }}
                        </div>
                        <ul class="pl-5">
                            <li
                                v-for="item in drawn.content.blindSpots"
                                :key="item"
                                class="mb-1"
                            >
                                {{ item }}
                            </li>
                        </ul>
                    </section>

                    <section v-if="drawn.content.growthAdvice.trim()">
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
                                {{ drawn.content.growthAdvice }}
                            </p>
                        </blockquote>
                    </section>
                </v-card-text>
            </v-card>

            <p class="text-caption text-medium-emphasis mb-4">
                {{ drawn.content.disclaimer }}
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { RUNE_ORIENTATION_LABELS } from '../../../shared/constants/runes';

const {
    today, status, drawing, load, draw,
} = useDailyRune();

const drawn = computed(() => (today.value?.drawn ? today.value : null));

/** Whether the drawn stone is turned face up: one drawn just now turns over, one drawn earlier is shown at once. */
const revealed = ref(false);
/** Position of the stone the member chose; null until they choose, and again if the draw does not work out. */
const picked = ref<number | null>(null);

watch(drawn, (value) => {
    if (!value) {
        revealed.value = false;

        return;
    }

    if (picked.value === null) {
        revealed.value = true;

        return;
    }

    // Let the stone appear face down first, then turn it over
    revealed.value = false;
    setTimeout(() => {
        revealed.value = true;
    }, 80);
}, { immediate: true });

async function onPick(index: number) {
    if (drawing.value || drawn.value) return;

    picked.value = index;
    await draw();

    // A draw that did not work out (no content yet, or a failure) leaves the stones to choose again
    if (!drawn.value) picked.value = null;
}

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
