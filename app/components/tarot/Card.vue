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
                :style="spriteStyle(TAROT_SPRITE.back)"
                @click="interactive && emit('reveal')"
            >
                <span
                    v-if="interactive && !compact"
                    class="tarot__hint"
                >
                    {{ busy ? '翻牌中…' : '點一下翻牌' }}
                </span>
            </component>

            <!-- Front: the picture of the card, a cell of the sheet that holds them all -->
            <div
                class="tarot__face tarot__front"
                :aria-hidden="!flipped"
            >
                <div
                    v-if="card"
                    class="tarot__art"
                    :class="{ 'tarot__art--reversed': card.orientation === 'reversed' }"
                >
                    <div
                        class="tarot__image"
                        role="img"
                        :aria-label="`${card.name}（${card.englishName}）`"
                        :style="spriteStyle(card.index)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    TAROT_SPRITE, tarotSpriteCell,
} from '../../../shared/constants/tarotSprite';
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

/** Shows one cell of the sheet of pictures on the element it is set on */
function spriteStyle(cell: number) {
    const {
        size, position,
    } = tarotSpriteCell(cell);

    return {
        backgroundImage: `url(${TAROT_SPRITE.url})`, backgroundSize: size, backgroundPosition: position,
    };
}
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
    border: 0;
    background-color: transparent;
    background-repeat: no-repeat;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    /* The corners of a card are round in the picture, so the shadow follows the picture */
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
}

.tarot__back {
    color: #deb978;
}

button.tarot__back {
    cursor: pointer;
    font: inherit;
}

/* No frame on hover; the keyboard focus is a soft glow that follows the shape of the card */
button.tarot__back:focus-visible {
    outline: none;
    filter: drop-shadow(0 0 6px rgba(var(--v-theme-primary), 0.7));
}

.tarot__hint {
    font-size: 0.875rem;
    letter-spacing: 0.1em;
}

.tarot__front {
    transform: rotateY(180deg);
}

/* A reversed card is the picture turned around; the text around the card stays upright. */
.tarot__art {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.tarot__art--reversed {
    transform: rotate(180deg);
}

.tarot__image {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
}

@media (prefers-reduced-motion: reduce) {
    .tarot__inner {
        transition: none;
    }
}
</style>
