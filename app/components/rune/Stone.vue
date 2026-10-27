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
                <!-- A neutral mark, the same on every stone: the rune is not told by the back -->
                <span
                    class="stone__mark"
                    aria-hidden="true"
                >{{ compact ? '᛭' : 'ᛟ' }}</span>
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
                    <!-- A reversed rune is the character turned around; the name below stays upright -->
                    <span
                        v-else
                        class="stone__glyph"
                        :class="{ 'stone__glyph--reversed': rune.orientation === 'reversed' }"
                    >{{ rune.glyph }}</span>
                    <span class="stone__name">{{ rune.name }}</span>
                    <span class="stone__meaning">{{ rune.meaning }}</span>
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
    /** A small face-down stone, as in a scatter: no hint text, a smaller mark. Its width is `--stone-width`. */
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
    border-radius: 36% 36% 30% 30% / 26% 26% 22% 22%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
}

.stone__back {
    border: 2px solid #3b4252;
    color: #d8dee9;
    background: #4c566a;
}

button.stone__back {
    cursor: pointer;
    font: inherit;
}

button.stone__back:hover:not(:disabled),
button.stone__back:focus-visible {
    outline: 3px solid rgba(var(--v-theme-primary), 0.35);
    outline-offset: 3px;
}

.stone__mark {
    font-size: 4rem;
    line-height: 1;
    opacity: 0.85;
}

.stone--compact .stone__mark {
    font-size: calc(var(--stone-width) * 0.4);
}

.stone__hint {
    font-size: 0.875rem;
    letter-spacing: 0.1em;
}

.stone__front {
    transform: rotateY(180deg);
    overflow: hidden;
    border: 2px solid #8b8472;
    background: #e9e4d6;
}

.stone__art {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 100%;
    padding: 16px;
    text-align: center;
    color: #2e2a22;
}

.stone__glyph {
    font-size: 5rem;
    line-height: 1;
}

.stone__glyph--reversed,
.stone__image--reversed {
    transform: rotate(180deg);
}

.stone__image {
    width: 70%;
    height: 55%;
    object-fit: contain;
}

.stone__name {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.stone__meaning {
    font-size: 0.8125rem;
    opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
    .stone__inner {
        transition: none;
    }
}
</style>
