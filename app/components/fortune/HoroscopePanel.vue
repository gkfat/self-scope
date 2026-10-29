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

        <!-- The report of today, with everything this page used to show -->
        <template v-if="today">
            <!-- The sign the reading is for, ahead of the report: it is the first house of everything below -->
            <v-card
                variant="outlined"
                class="mb-4"
            >
                <v-card-text class="text-center">
                    <div class="text-caption text-medium-emphasis">
                        你的星座
                    </div>
                    <div class="text-h5 font-weight-bold">
                        {{ ZODIAC_LABELS[today.sign] }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                        以{{ ZODIAC_LABELS[today.sign] }}為第 1 宮，讀今天月亮、太陽、水星、金星與火星的位置
                    </div>
                </v-card-text>
            </v-card>
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
import { ZODIAC_LABELS } from '../../../shared/constants/zodiacLabels';

const {
    today, status, load,
} = useDailyHoroscope();
const {
    report, status: reportStatus,
} = useSingleReport('HOROSCOPE');

onMounted(() => {
    void load();
});
</script>
