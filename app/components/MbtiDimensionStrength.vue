<template>
    <section
        v-if="rows.length"
        class="mb-6"
    >
        <h2 class="strength__title">
            你在四組偏好上的傾向
        </h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
            每一組的兩端是兩種偏好，中線是兩邊一樣多；圓點越靠近哪一端，就越偏向那一邊。這是自製問卷的結果，不是官方量表。
        </p>

        <v-row dense>
            <v-col
                v-for="row in rows"
                :key="row.key"
                cols="12"
                sm="6"
            >
                <v-card
                    variant="outlined"
                    height="100%"
                >
                    <v-card-text>
                        <div class="text-subtitle-2 mb-3">
                            {{ row.title }}
                        </div>

                        <div class="pole-row">
                            <div
                                v-for="(side, index) in row.sides"
                                :key="side.letter"
                                class="pole"
                                :class="[
                                    index === 0 ? 'pole--start' : 'pole--end',
                                    { 'pole--mine': side.letter === row.leaning },
                                ]"
                            >
                                <span class="pole__letter">{{ side.letter }}</span>
                                <span class="pole__label">{{ side.label }}</span>
                            </div>
                        </div>

                        <div
                            class="scale"
                            role="img"
                            :aria-label="row.summary"
                        >
                            <span class="scale__center" />
                            <span
                                class="scale__fill"
                                :style="{ left: `${row.fillStart}%`, width: `${row.fillWidth}%` }"
                            />
                            <span
                                class="scale__dot"
                                :style="{ left: `${row.position}%` }"
                            />
                        </div>

                        <div class="scale__legend text-caption text-medium-emphasis">
                            <span>{{ row.sides[0].label }}</span>
                            <span>中間</span>
                            <span>{{ row.sides[1].label }}</span>
                        </div>

                        <p class="text-body-2 mt-3 mb-0">
                            {{ row.summary }}
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </section>
</template>

<script lang="ts" setup>
import { MBTI_AXES } from '../../shared/constants/mbtiGuide';
import type { DimensionScore } from '../../shared/utils/personalityScoring';

const props = defineProps<{
    dimensions: Record<string, DimensionScore>;
}>();

/** How clear-cut a leaning is, as a share of the most the dimension could lean */
function strengthOf(ratio: number): string {
    if (ratio < 0.34) return '稍微偏向';
    if (ratio < 0.67) return '偏向';

    return '明顯偏向';
}

const rows = computed(() => MBTI_AXES.flatMap((axis) => {
    const score = props.dimensions[axis.key];

    if (!score || score.maxScore <= 0) return [];

    // Positive scores lean to the first letter, which sits on the left; the dot moves right for the second
    const signed = Math.max(-1, Math.min(1, score.score / score.maxScore));
    const ratio = Math.abs(signed);
    const position = 50 - signed * 50;
    const side = score.leaning === axis.first.letter ? axis.first : axis.second;

    return [{
        key: axis.key,
        title: axis.title,
        sides: [axis.first, axis.second],
        leaning: score.leaning,
        position,
        fillStart: Math.min(50, position),
        fillWidth: ratio * 50,
        summary: ratio === 0
            ? '兩邊一樣多，沒有明顯偏向哪一邊'
            : `${strengthOf(ratio)}${side.label}（${side.letter}）`,
    }];
}));
</script>

<style scoped>
.strength__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 4px;
}

.pole-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.pole {
    display: flex;
    align-items: baseline;
    gap: 6px;
    opacity: 0.5;
}

.pole--end {
    flex-direction: row-reverse;
}

.pole--mine {
    opacity: 1;
}

.pole__letter {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
}

.pole__label {
    font-size: 0.875rem;
    font-weight: 600;
}

/* The track runs from one pole to the other; the centre line is where both sides are equal */
.scale {
    position: relative;
    height: 12px;
    border-radius: 6px;
    background: rgba(var(--v-theme-on-surface), 0.12);
}

.scale__center {
    position: absolute;
    left: 50%;
    top: -4px;
    bottom: -4px;
    width: 2px;
    margin-left: -1px;
    background: rgba(var(--v-theme-on-surface), 0.5);
}

.scale__fill {
    position: absolute;
    top: 0;
    bottom: 0;
    background: rgba(var(--v-theme-on-surface), 0.55);
}

.scale__dot {
    position: absolute;
    top: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border-radius: 50%;
    background: rgb(var(--v-theme-on-surface));
    border: 3px solid rgb(var(--v-theme-surface));
    box-shadow: 0 0 0 1px rgba(var(--v-theme-on-surface), 0.4);
}

.scale__legend {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
}
</style>
