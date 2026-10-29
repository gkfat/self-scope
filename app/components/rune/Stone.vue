<template>
    <div
        class="stone"
        :class="{ 'stone--flipped': flipped, 'stone--compact': compact }"
    >
        <div class="stone__inner">
            <!-- Back: the face-down stone, the way in when it has not been drawn -->
            <component
                :is="interactive ? 'button' : 'div'"
                class="stone__face stone__back"
                :type="interactive ? 'button' : undefined"
                :aria-label="interactive ? '抽出今天的符文' : undefined"
                :disabled="interactive && busy ? true : undefined"
                :tabindex="flipped ? -1 : undefined"
                @click="interactive && emit('reveal')"
            >
                <!-- The back has no mark, the same on every stone: the rune is not told by the back -->
                <span
                    v-if="interactive && !compact"
                    class="stone__hint"
                >
                    {{ busy ? '抽取中…' : '點一下抽符' }}
                </span>
            </component>

            <!-- Front: the picture when there is one, otherwise the rune's own character -->
            <div
                class="stone__face stone__front"
                :aria-hidden="!flipped"
            >
                <div
                    v-if="rune"
                    class="stone__art"
                >
                    <img
                        v-if="rune.illustration"
                        :src="rune.illustration"
                        :alt="rune.name"
                        class="stone__image"
                        :class="{ 'stone__image--reversed': rune.orientation === 'reversed' }"
                    >
                    <!-- Only the rune is on the stone; a reversed rune is the character turned around -->
                    <span
                        v-else
                        class="stone__glyph"
                        role="img"
                        :aria-label="`${rune.name}（${rune.meaning}）`"
                        :class="{ 'stone__glyph--reversed': rune.orientation === 'reversed' }"
                    >{{ rune.glyph }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { RuneResponse } from '../../../shared/schemas/api/rune.schema';

withDefaults(defineProps<{
    /** The drawn rune; null while the stone is still face down */
    rune: RuneResponse | null;
    flipped: boolean;
    /** The back can be clicked to draw */
    interactive?: boolean;
    /** A draw is in progress */
    busy?: boolean;
    /** A small face-down stone, as in a scatter: no hint text. Its width is `--stone-width`. */
    compact?: boolean;
}>(), {
    interactive: false,
    busy: false,
    compact: false,
});

const emit = defineEmits<{ reveal: [] }>();
</script>

<style scoped>
.stone {
    width: var(--stone-width, min(200px, 56vw));
    aspect-ratio: 4 / 5;
    margin: 0 auto;
    perspective: 1000px;
}

.stone__inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.7s ease;
}

.stone--flipped .stone__inner {
    transform: rotateY(180deg);
}

.stone__face {
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
    background-position: center;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}

/* The stone is drawn flat in a picture of its own; the shadow is part of it */
.stone__back {
    color: #d8dee9;
    background-image: url('/rune/stone-back.png');
}

button.stone__back {
    cursor: pointer;
    font: inherit;
}

/* No frame on hover; the keyboard focus is shown as a soft glow that follows the shape of the stone */
button.stone__back:focus-visible {
    outline: none;
    filter: drop-shadow(0 0 6px rgba(var(--v-theme-primary), 0.6));
}

.stone__hint {
    font-size: 0.875rem;
    letter-spacing: 0.1em;
}

.stone__front {
    transform: rotateY(180deg);
    background-image: url('/rune/stone-front.png');
}

.stone__art {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 100%;
    /* Inside the gold line of the picture */
    padding: 0;
    text-align: center;
    color: #deb978;
}

.stone__glyph {
    font-size: calc(var(--stone-width, min(200px, 56vw)) * 0.85);
    line-height: 1;
    /* The glyph sits a little high in its line box; this puts it in the middle of the stone */
    color: #d4af60;
}

/* Turned around, the glyph sits as low as it sat high, so it is moved the other way */
.stone__glyph--reversed {
    transform: rotate(180deg);
}

.stone__image--reversed {
    transform: rotate(180deg);
}

.stone__image {
    width: 70%;
    height: 55%;
    object-fit: contain;
}

@media (prefers-reduced-motion: reduce) {
    .stone__inner {
        transition: none;
    }
}
</style>
