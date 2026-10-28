<template>
    <div>
        <v-progress-linear
            v-if="status === 'loading'"
            indeterminate
            class="mb-4"
        />

        <v-alert
            v-if="status === 'needsProfile'"
            type="info"
            variant="tonal"
            class="mb-4"
        >
            星座運勢需要出生日期，先填寫就能看到你的星座運勢。
            <template #append>
                <v-btn
                    to="/#fill"
                    size="small"
                    variant="text"
                >
                    去填寫
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

        <v-alert
            v-else-if="status === 'failed'"
            type="error"
            variant="tonal"
            class="mb-4"
        >
            暫時無法取得今天的星座運勢，請稍後再試。
            <template #append>
                <v-btn
                    size="small"
                    @click="load"
                >
                    重試
                </v-btn>
            </template>
        </v-alert>

        <template v-if="today">
            <v-card
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <div class="text-subtitle-1 font-weight-medium mb-1">
                        你是{{ ZODIAC_LABELS[today.sign] }}
                    </div>
                    <p class="text-body-2 mb-0">
                        以你的星座當第 1 宮，看今天的星空落在你生活的哪一塊。同一個星座的人，看到的內容相同。
                    </p>
                </v-card-text>
            </v-card>

            <v-card
                v-for="entry in today.bodies"
                :key="entry.body"
                variant="outlined"
                class="mb-4"
            >
                <v-card-text>
                    <div class="d-flex flex-wrap align-baseline ga-2 mb-1">
                        <span class="text-overline">{{ entry.area }}</span>
                    </div>
                    <div class="text-subtitle-1 font-weight-medium mb-1">
                        今天{{ entry.name }}在{{ ZODIAC_LABELS[entry.transitSign] }}，落在你的第 {{ entry.house }} 宮
                    </div>
                    <p class="text-body-1 mb-3">
                        {{ entry.content.summary }}
                    </p>

                    <div
                        v-if="entry.content.strengths.length"
                        class="mb-3"
                    >
                        <v-chip
                            v-for="word in entry.content.strengths"
                            :key="word"
                            class="mr-2 mb-1"
                            size="small"
                            variant="tonal"
                            color="primary"
                        >
                            {{ word }}
                        </v-chip>
                    </div>

                    <ul
                        v-if="entry.content.blindSpots.length"
                        class="pl-5 mb-3"
                    >
                        <li
                            v-for="item in entry.content.blindSpots"
                            :key="item"
                            class="mb-1"
                        >
                            <span class="text-medium-emphasis">可以留意：</span>{{ item }}
                        </li>
                    </ul>

                    <p
                        v-if="entry.content.growthAdvice.trim()"
                        class="mb-0"
                    >
                        <v-icon
                            color="success"
                            size="18"
                            class="mr-1"
                        >
                            mdi-check-circle-outline
                        </v-icon>
                        <span class="font-weight-medium">今天可以試試：</span>{{ entry.content.growthAdvice }}
                    </p>
                </v-card-text>
            </v-card>

            <p class="text-caption text-medium-emphasis mb-1">
                天體位置以 {{ today.date }} 00:00（台北時間）為準；月亮一天走約 13 度，傍晚的位置會和這裡不同。
            </p>
            <p class="text-caption text-medium-emphasis mb-4">
                {{ disclaimer }}
            </p>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { ZODIAC_LABELS } from '../../../shared/constants/zodiacLabels';

const {
    today, status, load,
} = useDailyHoroscope();

// Every piece carries the same disclaimer; the page shows it once, at the end.
const disclaimer = computed(() => today.value?.bodies[0]?.content.disclaimer ?? '');

onMounted(() => {
    void load();
});
</script>
