<template>
    <div
        class="fan"
        :class="{ 'fan--spread': spread, 'fan--busy': busy }"
        role="group"
        aria-label="選一張牌"
    >
        <div
            v-for="(slot, index) in SLOTS"
            :key="index"
            class="fan__slot"
            :class="{ 'fan__slot--picked': picked === index, 'fan__slot--other': picked !== null && picked !== index }"
            :style="{ '--offset': MIDDLE - index, '--y': `${slot.y}px`, '--r': `${slot.r}deg`, '--z': index + 1 }"
        >
            <TarotCard
                :card="null"
                :flipped="false"
                :interactive="spread && !busy"
                :busy="busy && picked === index"
                compact
                @reveal="emit('pick', index)"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
/**
 * A deck of five face-down cards that opens into a row, each one a little higher or lower than its neighbours
 * and tilted a little its own way, with room between them so none touches another. Choosing one feels like
 * drawing it; which one is picked makes no difference to the result, since the day's card is fixed by the
 * account and the date.
 */
const MIDDLE = 2;

/** How far each card sits below the row's top line (px, negative is higher) and how much it leans (deg). */
const SLOTS = [
    {
        y: 16, r: -5,
    },
    {
        y: -8, r: 3,
    },
    {
        y: 24, r: -2,
    },
    {
        y: -2, r: 6,
    },
    {
        y: 12, r: -4,
    },
];

defineProps<{
    /** Position of the card the member chose, while the draw is under way */
    picked: number | null;
    busy: boolean;
}>();

const emit = defineEmits<{ pick: [index: number] }>();

// Start as one stack, then open once the page is up, so the spreading is seen.
const spread = ref(false);

onMounted(() => {
    setTimeout(() => {
        spread.value = true;
    }, 250);
});
</script>

<style scoped>
.fan {
    /* Five cards and four gaps have to fit the width, also on a phone */
    --tarot-width: clamp(48px, 15.5vw, 98px);
    --gap: calc(var(--tarot-width) * 0.18);

    display: flex;
    justify-content: center;
    gap: var(--gap);
    width: 100%;
    /* The tallest card plus the stagger and the lift on hover */
    height: calc(var(--tarot-width) * 12 / 7 + 72px);
    padding-top: 28px;
}

.fan__slot {
    position: relative;
    z-index: var(--z);
    width: var(--tarot-width);
    /* Stacked: every card moves to the middle of the row */
    transform: translateX(calc(var(--offset) * (var(--tarot-width) + var(--gap)))) rotate(0deg);
    transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
}

.fan--spread .fan__slot {
    transform: translateX(0) translateY(var(--y)) rotate(var(--r));
}

.fan--spread:not(.fan--busy) .fan__slot:hover,
.fan--spread:not(.fan--busy) .fan__slot:focus-within {
    transform: translateX(0) translateY(calc(var(--y) - 12px)) rotate(var(--r));
}

.fan__slot--picked {
    z-index: 10;
}

.fan__slot--other {
    opacity: 0.25;
}

@media (prefers-reduced-motion: reduce) {
    .fan__slot {
        transition: none;
    }
}
</style>
