<template>
    <div class="luck">
        <p class="text-body-2 mb-3">
            {{ BAZI_LUCK_DIRECTION_LABELS[luck.direction] }}・約 {{ startAgeText }}起運（{{ startYear }} 年）。
            每一步大運管十年，以日主為準標出十神的主題。
        </p>

        <div class="luck__scroll-wrap">
            <div
                class="luck__scroll"
                role="list"
                aria-label="八步大運，可左右滑動"
            >
                <button
                    v-for="step in luck.steps"
                    :key="step.order"
                    type="button"
                    class="luck__step"
                    :class="{
                        'luck__step--current': step.order === luck.currentOrder,
                        'luck__step--open': step.order === openOrder,
                    }"
                    :aria-pressed="step.order === openOrder"
                    role="listitem"
                    @click="toggle(step.order)"
                >
                    <span
                        v-if="step.order === luck.currentOrder"
                        class="luck__now"
                    >目前</span>
                    <BaziGanzhi
                        :pillar="step.pillar"
                        size="md"
                    />
                    <span class="luck__god">{{ step.tenGod }}</span>
                    <span class="luck__age">{{ step.startAge }}–{{ step.endAge }} 虛歲</span>
                    <span class="luck__years">{{ step.startYear }}–{{ step.endYear }}</span>
                </button>
            </div>
            <div
                class="luck__fade"
                aria-hidden="true"
            />
        </div>
        <p class="text-caption text-medium-emphasis mt-1 mb-0">
            點選任一步可展開那十年的流年。
        </p>

        <div
            v-if="openStep"
            class="luck__years-list"
        >
            <div class="text-subtitle-2 mb-1">
                第 {{ openStep.order }} 步・{{ openStep.pillar.stem }}{{ openStep.pillar.branch }}（{{ openStep.startYear }}–{{ openStep.endYear }}）的流年
            </div>
            <BaziYearRow
                v-for="year in openYears"
                :key="year.year"
                :year="year"
                :current="year.year === currentYear"
            />
        </div>

        <div class="mt-4">
            <div class="text-subtitle-2 mb-1">
                今年與接下來的流年
            </div>
            <BaziYearRow
                v-for="(year, index) in flowYears"
                :key="year.year"
                :year="year"
                :current="index === 0"
            />
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
                流年以立春換年。這裡只列出干支與十神，不預測事件，也不評斷好壞。
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { BAZI_LUCK_DIRECTION_LABELS } from '../../../shared/constants/baziLabels';
import type { BaziResponse } from '../../../shared/schemas/api/bazi.schema';

type Luck = NonNullable<BaziResponse['luck']>;
type FlowYears = NonNullable<BaziResponse['flowYears']>;

const props = defineProps<{
    luck: Luck;
    flowYears: FlowYears;
}>();

/** The step whose ten years are unfolded; the current step starts open. */
const openOrder = ref<number | null>(props.luck.currentOrder);

const toggle = (order: number) => {
    openOrder.value = openOrder.value === order ? null : order;
};

const openStep = computed(() => props.luck.steps.find((step) => step.order === openOrder.value) ?? null);
const openYears = computed(() => (openOrder.value === null ? [] : props.luck.stepYears[String(openOrder.value)] ?? []));
const currentYear = computed(() => props.flowYears[0]?.year ?? null);

const startAgeText = computed(() => {
    const {
        years, months, days,
    } = props.luck.startAge;
    const parts = [`${years} 歲`];

    if (months) parts.push(`${months} 個月`);
    if (days) parts.push(`${days} 天`);

    return parts.join(' ');
});

const startYear = computed(() => props.luck.steps[0]?.startYear);
</script>

<style scoped>
.luck__scroll-wrap {
    position: relative;
}

/* The only part of the page that may scroll sideways on a narrow screen */
.luck__scroll {
    display: flex;
    gap: 8px;
    padding: 4px 2px 8px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
}

.luck__step {
    position: relative;
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 104px;
    padding: 18px 6px 8px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 12px;
    background: rgb(var(--v-theme-surface));
    scroll-snap-align: start;
    cursor: pointer;
}

.luck__step:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
}

.luck__step--open {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}

/* The step in force today is filled in, not only outlined */
.luck__step--current {
    background: rgba(var(--v-theme-primary), 0.14);
    border-color: rgb(var(--v-theme-primary));
}

.luck__now {
    position: absolute;
    top: -1px;
    left: 50%;
    padding: 0 8px;
    border-radius: 0 0 8px 8px;
    transform: translateX(-50%);
    font-size: 0.7rem;
    color: #fff;
    background: rgb(var(--v-theme-primary));
}

.luck__god {
    font-size: 0.85rem;
    font-weight: 700;
}

.luck__age,
.luck__years {
    font-size: 0.72rem;
    color: rgba(var(--v-theme-on-surface), 0.65);
    font-variant-numeric: tabular-nums;
}

/* A soft edge on the right shows that there is more to scroll to */
.luck__fade {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 8px;
    width: 28px;
    pointer-events: none;
    background: linear-gradient(to right, transparent, rgb(var(--v-theme-surface)));
}

.luck__years-list {
    margin-top: 12px;
    padding: 10px 8px;
    border-radius: 10px;
    background: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
