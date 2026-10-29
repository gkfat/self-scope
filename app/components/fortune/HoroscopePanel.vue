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
    today, status, load,
} = useDailyHoroscope();
const {
    report, status: reportStatus,
} = useSingleReport('HOROSCOPE');

onMounted(() => {
    void load();
});
</script>
