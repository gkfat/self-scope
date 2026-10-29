<template>
    <span
        class="ganzhi"
        :class="`ganzhi--${size}`"
    >
        <span
            class="ganzhi__char"
            :style="styleOf(stemElement)"
            :title="`${pillar.stem}（${ELEMENT_LABELS[stemElement]}）`"
        >{{ pillar.stem }}</span>
        <span
            class="ganzhi__char"
            :style="styleOf(branchElement)"
            :title="`${pillar.branch}（${ELEMENT_LABELS[branchElement]}）`"
        >{{ pillar.branch }}</span>
    </span>
</template>

<script lang="ts" setup>
import {
    ELEMENT_COLORS, ELEMENT_LABELS, type Element,
} from '../../../shared/constants/bazi';
import type { Ganzhi } from '../../../shared/utils/bazi/ganzhi';
import {
    branchElement as branchElementOf, stemElement as stemElementOf,
} from '../../../shared/utils/bazi/ganzhi';

const props = withDefaults(defineProps<{
    pillar: Ganzhi;
    size?: 'sm' | 'md' | 'lg';
}>(), { size: 'md' });

const stemElement = computed(() => stemElementOf(props.pillar.stem));
const branchElement = computed(() => branchElementOf(props.pillar.branch));

/** The element colour as a tile; the element name is in the tooltip and printed elsewhere in the chart. */
function styleOf(element: Element) {
    const colors = ELEMENT_COLORS[element];

    return {
        backgroundColor: colors.fill,
        color: colors.text,
        borderColor: colors.border,
    };
}
</script>

<style scoped>
.ganzhi {
    display: inline-flex;
    gap: 3px;
}

.ganzhi__char {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid;
    border-radius: 6px;
    font-weight: 700;
    line-height: 1;
}

.ganzhi--sm .ganzhi__char {
    width: 22px;
    height: 22px;
    font-size: 0.8rem;
}

.ganzhi--md .ganzhi__char {
    width: 30px;
    height: 30px;
    font-size: 1.05rem;
}

.ganzhi--lg .ganzhi__char {
    width: 40px;
    height: 40px;
    font-size: 1.4rem;
}
</style>
