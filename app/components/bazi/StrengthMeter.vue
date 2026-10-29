<template>
    <div class="strength">
        <div class="d-flex align-baseline flex-wrap ga-2 mb-3">
            <span class="strength__level">{{ STRENGTH_LEVEL_LABELS[strength.level] }}</span>
            <span class="text-body-2 text-medium-emphasis">幫扶分 {{ strength.score }} / 100</span>
        </div>

        <div
            class="strength__track"
            role="img"
            :aria-label="`日主強弱：${STRENGTH_LEVEL_LABELS[strength.level]}，幫扶分 ${strength.score}`"
        >
            <div
                v-for="segment in segments"
                :key="segment.level"
                class="strength__segment"
                :class="{ 'strength__segment--active': segment.level === strength.level }"
                :style="{ flexBasis: `${segment.width}%` }"
            >
                {{ segment.label }}
            </div>
            <div
                class="strength__marker"
                :style="{ left: `${strength.score}%` }"
                aria-hidden="true"
            />
        </div>
        <p class="text-body-2 mt-2">
            {{ BAZI_STRENGTH_NOTES[strength.level] }}。
        </p>

        <div class="strength__row">
            <div class="strength__row-label">
                命格
            </div>
            <v-chip
                size="small"
                color="primary"
                variant="tonal"
            >
                {{ strength.pattern.key }}格
            </v-chip>
            <span class="text-caption text-medium-emphasis">
                月令的主氣是「{{ strength.pattern.tenGod }}」
            </span>
        </div>

        <div class="strength__row">
            <div class="strength__row-label">
                較順手的方向
            </div>
            <template v-if="strength.useful">
                <v-chip
                    size="small"
                    color="success"
                    variant="tonal"
                >
                    用神：{{ TEN_GOD_GROUP_LABELS[strength.useful.useful] }}
                </v-chip>
                <v-chip
                    size="small"
                    color="success"
                    variant="outlined"
                >
                    喜神：{{ TEN_GOD_GROUP_LABELS[strength.useful.favorable] }}
                </v-chip>
                <v-chip
                    size="small"
                    color="warning"
                    variant="tonal"
                >
                    忌神：{{ strength.useful.avoid.map((group) => TEN_GOD_GROUP_LABELS[group]).join('、') }}
                </v-chip>
            </template>
            <span
                v-else
                class="text-body-2"
            >各方向相對平衡，不列喜神、用神與忌神。</span>
        </div>
        <p
            v-if="strength.useful"
            class="text-caption text-medium-emphasis ml-1 mb-2"
        >
            用神、喜神是比較順手的方向，忌神是比較吃力的方向；用十神的類別表示，不代表吉凶。
        </p>

        <div class="strength__row strength__row--phases">
            <div class="strength__row-label">
                五行旺衰
            </div>
            <span
                v-for="element in ELEMENTS"
                :key="element"
                class="strength__phase"
                :style="{
                    backgroundColor: ELEMENT_COLORS[element].fill,
                    color: ELEMENT_COLORS[element].text,
                    borderColor: ELEMENT_COLORS[element].border,
                }"
                :title="`${ELEMENT_LABELS[element]}：${BAZI_PHASE_NOTES[strength.phases[element]]}`"
            >{{ ELEMENT_LABELS[element] }}{{ strength.phases[element] }}</span>
        </div>

        <v-expansion-panels
            variant="accordion"
            class="mt-3"
        >
            <v-expansion-panel title="採用的判定方法">
                <v-expansion-panel-text class="text-body-2">
                    <p>
                        「幫扶」是和日主同五行的比劫，以及生日主的印星。依每個字所在的位置加權計分，滿分 100：
                        月支 {{ STRENGTH_WEIGHTS.monthBranch }}、日支 {{ STRENGTH_WEIGHTS.dayBranch }}、
                        月干 {{ STRENGTH_WEIGHTS.monthStem }}、時干 {{ STRENGTH_WEIGHTS.hourStem }}、
                        年干 {{ STRENGTH_WEIGHTS.yearStem }}、年支 {{ STRENGTH_WEIGHTS.yearBranch }}、
                        時支 {{ STRENGTH_WEIGHTS.hourBranch }}。地支依藏干的本氣、中氣、餘氣按 6：3：1 計算比例。
                        沒有出生時間時，只計算已知的位置並換算成 100 分。
                    </p>
                    <p>
                        75 分以上為太旺，55 到 74 為身強，45 到 54 為中和，30 到 44 為身弱，低於 30 為太弱。
                        命格看月令主氣對日主的十神，喜神、用神、忌神由強弱和命格查固定的表。
                    </p>
                    <p class="mb-0">
                        強弱、命格與喜用神沒有統一標準，不同流派、不同網站可能得到不同結果；這裡採用的是公開、固定的一套規則。
                    </p>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>

<script lang="ts" setup>
import {
    ELEMENTS,
    ELEMENT_COLORS,
    ELEMENT_LABELS,
    STRENGTH_BOUNDS,
    STRENGTH_LEVEL_LABELS,
    STRENGTH_WEIGHTS,
    TEN_GOD_GROUP_LABELS,
    type StrengthLevel,
} from '../../../shared/constants/bazi';
import {
    BAZI_PHASE_NOTES, BAZI_STRENGTH_NOTES,
} from '../../../shared/constants/baziLabels';
import type { BaziResponse } from '../../../shared/schemas/api/bazi.schema';

defineProps<{
    strength: BaziResponse['strength'];
}>();

/** The five bands of the 0–100 track, lightest first; the widths come from the level bounds. */
const segments = computed(() => {
    const levels: Array<{ level: StrengthLevel; from: number; to: number }> = [];
    let upper = 100;

    for (const [bound, level] of STRENGTH_BOUNDS) {
        levels.unshift({
            level, from: bound, to: upper,
        });
        upper = bound;
    }

    levels.unshift({
        level: 'taiwei', from: 0, to: upper,
    });

    return levels.map((item) => ({
        level: item.level,
        label: STRENGTH_LEVEL_LABELS[item.level],
        width: item.to - item.from,
    }));
});
</script>

<style scoped>
.strength__level {
    font-size: 1.5rem;
    font-weight: 700;
}

.strength__track {
    position: relative;
    display: flex;
    overflow: hidden;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 8px;
}

.strength__segment {
    min-width: 0;
    padding: 8px 2px;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
    background: rgba(var(--v-theme-on-surface), 0.04);
}

.strength__segment + .strength__segment {
    border-left: 1px solid rgba(var(--v-theme-on-surface), 0.15);
}

.strength__segment--active {
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.16);
}

.strength__marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    margin-left: -1px;
    background: rgb(var(--v-theme-primary));
}

.strength__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 10px 0 4px;
}

.strength__row-label {
    min-width: 6.5em;
    font-size: 0.85rem;
    font-weight: 600;
}

.strength__phase {
    padding: 2px 8px;
    border: 1px solid;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
}
</style>
