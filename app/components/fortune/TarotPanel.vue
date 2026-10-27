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
            暫時無法取得今天的牌，請稍後再試。
            <template #append>
                <v-btn
                    size="small"
                    @click="retry"
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
            <!-- Not drawn yet: a deck that opens into five cards to choose from -->
            <template v-if="!drawn && status !== 'failed'">
                <TarotFan
                    :picked="picked"
                    :busy="drawing"
                    @pick="onPick"
                />
                <p class="text-body-2 text-medium-emphasis text-center mb-6">
                    每天可以抽一張牌。憑直覺點選一張，翻開今天給你的提醒。
                </p>
            </template>

            <TarotCard
                v-if="drawn"
                :card="drawn.card"
                :flipped="revealed"
                class="mb-6"
            />
        </template>

        <template v-if="drawn">
            <!-- 1. Card name and orientation: the identity of what was drawn -->
            <div class="d-flex flex-wrap justify-center ga-2 mb-4">
                <v-chip
                    size="small"
                    variant="outlined"
                >
                    大阿爾克那
                </v-chip>
                <v-chip
                    size="small"
                    variant="outlined"
                >
                    {{ TAROT_ORIENTATION_LABELS[drawn.card.orientation] }}
                </v-chip>
                <v-chip
                    size="small"
                    variant="outlined"
                >
                    {{ drawn.card.englishName }}
                </v-chip>
                <v-chip
                    size="small"
                    variant="outlined"
                >
                    {{ drawn.date }}
                </v-chip>
            </div>

            <p
                v-if="meaning"
                class="text-body-2 text-medium-emphasis text-center mb-4"
            >
                核心主題：{{ meaning.themes.join('、') }}
            </p>

            <v-card
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <!-- 2. Theme of the day: one message that is easy to take in -->
                    <section class="mb-6">
                        <div class="text-subtitle-1 font-weight-medium mb-2">
                            <v-icon
                                color="primary"
                                size="20"
                            >
                                mdi-book-open-variant-outline
                            </v-icon>
                            今日主題
                        </div>
                        <blockquote class="quote mb-0">
                            <p class="quote__summary">
                                {{ drawn.content.summary }}
                            </p>
                        </blockquote>
                    </section>

                    <!-- 3. Keywords: 3 to 5 tags -->
                    <section
                        v-if="drawn.content.strengths.length"
                        class="mb-6"
                    >
                        <div class="text-subtitle-1 font-weight-medium mb-2">
                            <v-icon
                                color="primary"
                                size="20"
                            >
                                mdi-tag-outline
                            </v-icon>
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

                    <!-- 4. Things to watch: a blind spot, then what it can look like in love and at work -->
                    <section
                        v-if="drawn.content.blindSpots.length || hints.length"
                        class="mb-6"
                    >
                        <div class="text-subtitle-1 font-weight-medium mb-2">
                            <v-icon
                                color="warning"
                                size="20"
                            >
                                mdi-eye-outline
                            </v-icon>
                            可以留意的地方
                        </div>
                        <ul
                            v-if="drawn.content.blindSpots.length"
                            class="pl-5 mb-3"
                        >
                            <li
                                v-for="item in drawn.content.blindSpots"
                                :key="item"
                                class="mb-1"
                            >
                                {{ item }}
                            </li>
                        </ul>
                        <v-row dense>
                            <v-col
                                v-for="row in hints"
                                :key="row.label"
                                cols="12"
                                sm="6"
                            >
                                <v-card
                                    variant="outlined"
                                    height="100%"
                                >
                                    <v-card-text>
                                        <div class="text-subtitle-2 mb-1">
                                            <v-icon
                                                :icon="row.icon"
                                                size="18"
                                                class="mr-1"
                                            />
                                            {{ row.label }}
                                        </div>
                                        <p class="mb-0">
                                            {{ row.text }}
                                        </p>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </section>

                    <!-- 5. Something to try today -->
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

            <!-- The longer reading: opposites, light and shadow, growth, questions, the picture, the history -->
            <div class="text-subtitle-1 font-weight-medium mb-2">
                進一步閱讀
            </div>
            <TarotDetails
                :card-index="drawn.card.index"
                :orientation="drawn.card.orientation"
                class="mb-4"
            />

            <p class="text-caption text-medium-emphasis mb-4">
                {{ drawn.content.disclaimer }}
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { TAROT_ORIENTATION_LABELS } from '../../../shared/constants/tarot';
import { TAROT_CARD_MEANINGS } from '../../../shared/constants/tarotMeanings';

const {
    today, status, drawing, load, draw,
} = useDailyTarot();

const drawn = computed(() => (today.value?.drawn ? today.value : null));

const meaning = computed(() => (drawn.value ? TAROT_CARD_MEANINGS[drawn.value.card.index] ?? null : null));
const reading = computed(() => (drawn.value ? meaning.value?.[drawn.value.card.orientation] ?? null : null));

/** Life areas: love and work from the card's content, self and people from the longer reading. */
const hints = computed(() => [
    {
        label: '感情', icon: 'mdi-heart-outline', text: drawn.value?.content.loveStyle.trim() ?? '',
    },
    {
        label: '工作', icon: 'mdi-briefcase-outline', text: drawn.value?.content.workStyle.trim() ?? '',
    },
    {
        label: '自我', icon: 'mdi-account-outline', text: reading.value?.self ?? '',
    },
    {
        label: '人際', icon: 'mdi-account-group-outline', text: reading.value?.relationship ?? '',
    },
].filter((row) => row.text !== ''));

const retry = () => load();

/** Position of the card the member chose; null until they choose, and again if the draw does not work out. */
const picked = ref<number | null>(null);
/** Whether the drawn card is turned face up: a card drawn just now turns over, one drawn earlier is shown at once. */
const revealed = ref(false);

watch(drawn, (value) => {
    if (!value) {
        revealed.value = false;

        return;
    }

    if (picked.value === null) {
        revealed.value = true;

        return;
    }

    // Let the card appear face down first, then turn it
    revealed.value = false;
    setTimeout(() => {
        revealed.value = true;
    }, 80);
}, { immediate: true });

async function onPick(index: number) {
    if (drawing.value || drawn.value) return;

    picked.value = index;
    await draw();

    // A draw that did not work out (no content yet, or a failure) leaves the fan open to try again
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

.quote__headline {
    margin: 0 0 8px;
    font-size: clamp(1.25rem, 3.4vw, 1.625rem);
    font-weight: 700;
    line-height: 1.4;
}

.quote__summary,
.quote__text {
    margin: 0;
    font-size: 1rem;
    line-height: 1.8;
}
</style>
