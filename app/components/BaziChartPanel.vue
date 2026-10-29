<template>
    <div>
        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>四柱</v-card-title>
            <v-card-subtitle class="text-wrap">
                年、月、日、時各一柱，每柱有天干與地支。框起來的是日主。
            </v-card-subtitle>
            <v-card-text>
                <BaziPillarsTable :result="result" />
            </v-card-text>
        </v-card>

        <v-row class="mb-1">
            <v-col
                cols="12"
                md="6"
            >
                <v-card
                    variant="outlined"
                    height="100%"
                >
                    <v-card-title>五行分布</v-card-title>
                    <v-card-text>
                        <BaziElementBars :counts="result.elementCounts" />
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col
                cols="12"
                md="6"
            >
                <v-card
                    variant="outlined"
                    height="100%"
                >
                    <v-card-title>十神彙整</v-card-title>
                    <v-card-text>
                        <BaziTenGodBars
                            :group-counts="result.groupCounts"
                            :ten-god-counts="result.tenGodCounts"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>日主強弱、命格與喜用神</v-card-title>
            <v-card-text>
                <BaziStrengthMeter :strength="result.strength" />
            </v-card-text>
        </v-card>

        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>大運與流年</v-card-title>
            <v-card-text>
                <BaziLuckTimeline
                    v-if="result.luck && result.flowYears"
                    :luck="result.luck"
                    :flow-years="result.flowYears"
                />
                <template v-else>
                    <p class="text-body-2 mb-3">
                        {{ luckHint }}
                    </p>
                    <v-btn
                        v-if="result.luckStatus === 'NEEDS_GENDER'"
                        to="/profile"
                        size="small"
                        color="primary"
                        variant="tonal"
                    >
                        到「我的資料」提供性別
                    </v-btn>
                    <div v-if="result.flowYears">
                        <div class="text-subtitle-2 mb-1">
                            今年與接下來的流年
                        </div>
                        <BaziYearRow
                            v-for="(year, index) in result.flowYears"
                            :key="year.year"
                            :year="year"
                            :current="index === 0"
                        />
                    </div>
                </template>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
import type { BaziResponse } from '../../shared/schemas/api/bazi.schema';

const props = defineProps<{ result: BaziResponse }>();

const luckHint = computed(() => (props.result.luckStatus === 'NEEDS_GENDER'
    ? '提供性別後可看大運。性別只用來決定大運的排法（男命與女命的順逆不同），不會用在其他地方，也可以選擇不提供。'
    : '大運的起運要用到精確的出生時刻，所以需要出生時間。'));
</script>
