<template>
    <v-card class="master">
        <v-card-text class="master__body">
            <div
                class="master__tile"
                :style="{
                    backgroundColor: colors.fill,
                    color: colors.text,
                    borderColor: colors.border,
                }"
                :aria-label="`日主 ${dayMaster.stem}`"
            >
                {{ dayMaster.stem }}
            </div>
            <div class="master__text">
                <div class="text-caption text-medium-emphasis">
                    日主
                </div>
                <div class="master__name">
                    {{ BAZI_POLARITY_LABELS[dayMaster.polarity] }}{{ ELEMENT_LABELS[dayMaster.element] }}・{{ dayMaster.stem }}{{ ELEMENT_LABELS[dayMaster.element] }}日主
                </div>
                <div class="master__meta">
                    <v-chip
                        size="small"
                        variant="tonal"
                    >
                        五行 {{ ELEMENT_LABELS[dayMaster.element] }}
                    </v-chip>
                    <v-chip
                        size="small"
                        variant="tonal"
                    >
                        出生在{{ season }}季・{{ solarTerm }}
                    </v-chip>
                    <v-chip
                        size="small"
                        variant="tonal"
                    >
                        生肖 {{ zodiac }}
                    </v-chip>
                </div>
                <p class="text-body-2 text-medium-emphasis mt-2 mb-0">
                    八字以「日柱的天干」代表你自己，其他的字都是用它來看關係，所以它叫日主。
                </p>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
import {
    ELEMENT_COLORS, ELEMENT_LABELS,
} from '../../../shared/constants/bazi';
import { BAZI_POLARITY_LABELS } from '../../../shared/constants/baziLabels';
import type { BaziResponse } from '../../../shared/schemas/api/bazi.schema';

const props = defineProps<{
    dayMaster: BaziResponse['dayMaster'];
    season: string;
    solarTerm: string;
    zodiac: string;
}>();

const colors = computed(() => ELEMENT_COLORS[props.dayMaster.element]);
</script>

<style scoped>
.master__body {
    display: flex;
    align-items: center;
    gap: 20px;
}

.master__tile {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 84px;
    height: 84px;
    border: 2px solid;
    border-radius: 16px;
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
}

.master__name {
    font-size: 1.25rem;
    font-weight: 700;
}

.master__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

@media (max-width: 599px) {
    .master__body {
        gap: 14px;
    }

    .master__tile {
        width: 64px;
        height: 64px;
        font-size: 2.2rem;
    }
}
</style>
