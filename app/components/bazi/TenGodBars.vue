<template>
    <div class="bars">
        <div
            v-for="row in rows"
            :key="row.group"
            class="bars__block"
        >
            <div class="bars__row">
                <span
                    class="bars__name"
                    :style="{ borderColor: row.color }"
                >{{ row.label }}</span>
                <div class="bars__track">
                    <div
                        v-if="row.count > 0"
                        class="bars__fill"
                        :style="{
                            width: ready ? `${row.percent}%` : '0%',
                            backgroundColor: row.color,
                        }"
                    />
                </div>
                <span class="bars__value">{{ row.count }}</span>
                <span
                    v-if="row.dominant"
                    class="bars__tag"
                >偏多</span>
            </div>
            <div class="bars__hint">
                {{ row.hint }}
                <template v-if="row.gods.length">
                    ・{{ row.gods.join('、') }}
                </template>
            </div>
        </div>
        <p class="text-caption text-medium-emphasis mt-2 mb-0">
            以日主為「我」，其他 {{ total }} 個字（天干與地支主氣）對日主的關係，分成五組。
        </p>
    </div>
</template>

<script lang="ts" setup>
import {
    TEN_GODS,
    TEN_GOD_GROUPS,
    TEN_GOD_GROUP_COLORS,
    TEN_GOD_GROUP_HINTS,
    TEN_GOD_GROUP_LABELS,
    TEN_GOD_GROUP_OF,
    type TenGod,
    type TenGodGroup,
} from '../../../shared/constants/bazi';
import { dominantGroup } from '../../../shared/utils/bazi/analysis';

const props = defineProps<{
    groupCounts: Record<TenGodGroup, number>;
    tenGodCounts: Record<TenGod, number>;
}>();

const total = computed(() => TEN_GOD_GROUPS.reduce((sum, group) => sum + props.groupCounts[group], 0));
const top = computed(() => dominantGroup(props.groupCounts));
const max = computed(() => Math.max(...TEN_GOD_GROUPS.map((group) => props.groupCounts[group]), 1));

const rows = computed(() => TEN_GOD_GROUPS.map((group) => ({
    group,
    label: TEN_GOD_GROUP_LABELS[group],
    color: TEN_GOD_GROUP_COLORS[group],
    hint: TEN_GOD_GROUP_HINTS[group],
    count: props.groupCounts[group],
    percent: (props.groupCounts[group] / max.value) * 100,
    dominant: top.value === group,
    gods: TEN_GODS
        .filter((god) => TEN_GOD_GROUP_OF[god] === group && props.tenGodCounts[god] > 0)
        .map((god) => `${god}×${props.tenGodCounts[god]}`),
})));

const ready = ref(false);

onMounted(() => {
    requestAnimationFrame(() => {
        ready.value = true;
    });
});
</script>

<style scoped>
.bars__block {
    margin-bottom: 10px;
}

.bars__row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.bars__name {
    flex: none;
    min-width: 3.4em;
    padding: 2px 6px;
    border: 2px solid;
    border-radius: 8px;
    text-align: center;
    font-weight: 700;
    font-size: 0.9rem;
}

.bars__track {
    flex: 1;
    min-width: 0;
    height: 18px;
    border-radius: 6px;
    background: rgba(var(--v-theme-on-surface), 0.06);
}

.bars__fill {
    height: 100%;
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

.bars__hint {
    margin: 2px 0 0 calc(3.4em + 20px);
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

@media (prefers-reduced-motion: reduce) {
    .bars__fill {
        transition: none;
    }
}
</style>
