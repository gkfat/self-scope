<template>
    <div class="bars">
        <div
            v-for="row in rows"
            :key="row.element"
            class="bars__row"
        >
            <span
                class="bars__name"
                :style="{
                    backgroundColor: row.colors.fill,
                    color: row.colors.text,
                    borderColor: row.colors.border,
                }"
            >{{ row.label }}</span>
            <div
                class="bars__track"
                :class="{ 'bars__track--empty': row.count === 0 }"
            >
                <div
                    v-if="row.count > 0"
                    class="bars__fill"
                    :style="{
                        width: ready ? `${row.percent}%` : '0%',
                        backgroundColor: row.colors.fill,
                        borderColor: row.colors.border,
                    }"
                />
            </div>
            <span class="bars__value">{{ row.count === 0 ? '缺' : row.count }}</span>
            <span
                v-if="row.dominant"
                class="bars__tag"
            >偏旺</span>
        </div>
        <p class="text-caption text-medium-emphasis mt-2 mb-0">
            共 {{ total }} 個字，天干與地支（以主氣計）各算一個，沒有加權。虛線表示八字中沒有這個五行。
        </p>
    </div>
</template>

<script lang="ts" setup>
import {
    ELEMENTS,
    ELEMENT_COLORS,
    ELEMENT_LABELS,
    type Element,
} from '../../../shared/constants/bazi';
import { dominantElement } from '../../../shared/utils/bazi/analysis';

const props = defineProps<{
    counts: Record<Element, number>;
}>();

const total = computed(() => ELEMENTS.reduce((sum, element) => sum + props.counts[element], 0));
const top = computed(() => dominantElement(props.counts));
const max = computed(() => Math.max(...ELEMENTS.map((element) => props.counts[element]), 1));

const rows = computed(() => ELEMENTS.map((element) => ({
    element,
    label: ELEMENT_LABELS[element],
    colors: ELEMENT_COLORS[element],
    count: props.counts[element],
    percent: (props.counts[element] / max.value) * 100,
    dominant: top.value === element,
})));

// The bars grow in once; a reduced-motion preference removes the transition in the styles below
const ready = ref(false);

onMounted(() => {
    requestAnimationFrame(() => {
        ready.value = true;
    });
});
</script>

<style scoped>
.bars__row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.bars__name {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid;
    border-radius: 8px;
    font-weight: 700;
}

.bars__track {
    flex: 1;
    min-width: 0;
    height: 18px;
    border-radius: 6px;
    background: rgba(var(--v-theme-on-surface), 0.06);
}

.bars__track--empty {
    border: 2px dashed rgba(var(--v-theme-on-surface), 0.35);
    background: transparent;
}

.bars__fill {
    height: 100%;
    border: 1px solid;
    border-radius: 6px;
    transition: width 0.6s ease-out;
}

.bars__value {
    min-width: 1.6em;
    text-align: right;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.bars__tag {
    padding: 0 6px;
    border-radius: 999px;
    font-size: 0.72rem;
    color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.12);
}

@media (prefers-reduced-motion: reduce) {
    .bars__fill {
        transition: none;
    }
}
</style>
