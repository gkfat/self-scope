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

        <!-- The report of today, with everything the draw page used to show, right under the draw -->
        <template v-if="drawn">
            <SingleReportView
                v-if="report"
                :report="report"
            />
            <v-card
                v-else-if="reportStatus === 'loading'"
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <v-skeleton-loader type="paragraph, paragraph" />
                </v-card-text>
            </v-card>
        </template>
    </div>
</template>

<script lang="ts" setup>
const {
    today, status, drawing, load, draw,
} = useDailyTarot();
const {
    report, status: reportStatus, reload: reloadReport,
} = useSingleReport('TAROT');

const drawn = computed(() => (today.value?.drawn ? today.value : null));

// The report is made from today's draw, so it is asked for again as soon as there is one
watch(() => drawn.value?.card.index, (index) => {
    if (index !== undefined) void reloadReport();
});

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
