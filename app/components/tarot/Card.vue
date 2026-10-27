<template>
    <div
        class="tarot"
        :class="{ 'tarot--flipped': flipped, 'tarot--compact': compact }"
    >
        <div class="tarot__inner">
            <!-- Back: the face-down card, the way in when it has not been drawn -->
            <component
                :is="interactive ? 'button' : 'div'"
                class="tarot__face tarot__back"
                :type="interactive ? 'button' : undefined"
                :aria-label="interactive ? '翻開今天的牌' : undefined"
                :disabled="interactive && busy ? true : undefined"
                :tabindex="flipped ? -1 : undefined"
                @click="interactive && emit('reveal')"
            >
                <span
                    class="tarot__sigil"
                    aria-hidden="true"
                >
                    <v-icon
                        icon="mdi-star-four-points-outline"
                        size="44"
                    />
                </span>
                <span
                    v-if="interactive && !compact"
                    class="tarot__hint"
                >
                    {{ busy ? '翻牌中…' : '點一下翻牌' }}
                </span>
            </component>

            <!-- Front: the picture when there is one, otherwise the numeral and the name -->
            <div
                class="tarot__face tarot__front"
                :aria-hidden="!flipped"
            >
                <div
                    v-if="card"
                    class="tarot__art"
                    :class="{ 'tarot__art--reversed': card.orientation === 'reversed' }"
                >
                    <img
                        v-if="card.illustration"
                        :src="card.illustration"
                        :alt="`${card.name}（${card.englishName}）`"
                        class="tarot__image"
                    >
                    <template v-else>
                        <span class="tarot__roman">{{ card.roman }}</span>
                        <span class="tarot__name">{{ card.name }}</span>
                        <span class="tarot__english">{{ card.englishName }}</span>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { TarotCardResponse } from '../../../shared/schemas/api/tarot.schema';

withDefaults(defineProps<{
    /** The drawn card; null while the card is still face down */
    card: TarotCardResponse | null;
    flipped: boolean;
    /** The back can be clicked to draw */
    interactive?: boolean;
    /** A draw is in progress */
    busy?: boolean;
    /** A small face-down card, as in a spread: no hint text and a smaller sigil. Its width is `--tarot-width`. */
    compact?: boolean;
}>(), {
    interactive: false,
    busy: false,
    compact: false,
});

const emit = defineEmits<{ reveal: [] }>();
</script>

<style scoped>
.tarot {
    width: var(--tarot-width, min(220px, 60vw));
    aspect-ratio: 7 / 12;
    margin: 0 auto;
    perspective: 1000px;
}

.tarot__inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.7s ease;
}

.tarot--flipped .tarot__inner {
    transform: rotateY(180deg);
}

.tarot__face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0;
    border: 2px solid rgb(var(--v-theme-primary));
    border-radius: 14px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
}

.tarot__back {
    color: #fff;
    background:
        repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.07) 0 8px, rgba(255, 255, 255, 0) 8px 16px),
        linear-gradient(160deg, #2f5d8a 0%, #1f3f5f 100%);
}

button.tarot__back {
    cursor: pointer;
    font: inherit;
}

button.tarot__back:hover:not(:disabled),
button.tarot__back:focus-visible {
    outline: 3px solid rgba(var(--v-theme-primary), 0.35);
    outline-offset: 3px;
}

.tarot__sigil {
    display: grid;
    place-items: center;
    width: 84px;
    height: 84px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
}

.tarot--compact .tarot__sigil {
    width: 55%;
    height: auto;
    aspect-ratio: 1 / 1;
}

/* The icon's size is set inline, so the scaled size has to override it */
.tarot--compact .tarot__sigil .v-icon {
    font-size: calc(var(--tarot-width) * 0.28) !important;
}

.tarot__hint {
    font-size: 0.875rem;
    letter-spacing: 0.1em;
}

.tarot__front {
    transform: rotateY(180deg);
    overflow: hidden;
    background: linear-gradient(180deg, #fffdf7 0%, #f3ead7 100%);
}

/* A reversed card is the picture turned around; the text around the card stays upright. */
.tarot__art {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    padding: 16px;
    text-align: center;
    color: #3b2f1c;
}

.tarot__art--reversed {
    transform: rotate(180deg);
}

.tarot__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.tarot__roman {
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: 0.08em;
}

.tarot__name {
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
}

.tarot__english {
    font-size: 0.8125rem;
    letter-spacing: 0.06em;
    opacity: 0.7;
}

@media (prefers-reduced-motion: reduce) {
    .tarot__inner {
        transition: none;
    }
}
</style>
