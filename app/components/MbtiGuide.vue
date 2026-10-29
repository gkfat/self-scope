<template>
    <section class="guide">
        <h2 class="guide__title">
            16 型人格怎麼分
        </h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
            每一型由四組偏好組成，沒有好壞之分，只是你比較自然的做法。
        </p>

        <v-row dense>
            <v-col
                v-for="axis in MBTI_AXES"
                :key="axis.key"
                cols="12"
                sm="6"
            >
                <v-card
                    variant="outlined"
                    height="100%"
                >
                    <v-card-text>
                        <div class="text-subtitle-2 mb-2">
                            {{ axis.title }}
                        </div>
                        <div
                            v-for="side in [axis.first, axis.second]"
                            :key="side.letter"
                            class="guide__side"
                            :class="{ 'guide__side--mine': mine(side.letter) }"
                        >
                            <span class="guide__letter">{{ side.letter }}</span>
                            <span>
                                <strong>{{ side.label }}</strong>：{{ side.text }}
                            </span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <h3 class="guide__subtitle">
            四大類型群
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-3">
            依「看事情的方式」與「做決定的方式」，16 型分成四個群，同一群的人關注的重點相近。
        </p>

        <v-row dense>
            <v-col
                v-for="group in MBTI_GROUPS"
                :key="group.key"
                cols="12"
                sm="6"
            >
                <v-card
                    class="group"
                    :class="{ 'group--mine': inGroup(group) }"
                    :style="{ '--tone': group.tone }"
                    variant="outlined"
                    height="100%"
                >
                    <v-card-text>
                        <div class="d-flex align-baseline ga-2 mb-1">
                            <span class="group__title">{{ group.title }}</span>
                            <span class="group__letters">{{ group.letters }}</span>
                        </div>
                        <p class="text-body-2 mb-3">
                            {{ group.description }}
                        </p>
                        <div class="d-flex flex-wrap ga-2">
                            <v-chip
                                v-for="item in group.types"
                                :key="item.type"
                                size="small"
                                :variant="item.type === current ? 'flat' : 'tonal'"
                                :style="{ '--chip-tone': group.tone }"
                                class="group__chip"
                                :class="{ 'group__chip--current': item.type === current }"
                            >
                                {{ item.type }}・{{ item.name }}
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </section>
</template>

<script lang="ts" setup>
import {
    MBTI_AXES, MBTI_GROUPS,
} from '../../shared/constants/mbtiGuide';

const props = defineProps<{
    /** The type being viewed, so its letters and group stand out */
    current?: string;
}>();

function mine(letter: string): boolean {
    return props.current?.includes(letter) ?? false;
}

function inGroup(group: typeof MBTI_GROUPS[number]): boolean {
    return group.types.some((item) => item.type === props.current);
}
</script>

<style scoped>
.guide {
    margin: 8px 0 24px;
}

.guide__title {
    margin: 0 0 4px;
    font-size: 1.25rem;
    font-weight: 700;
}

.guide__subtitle {
    margin: 28px 0 4px;
    font-size: 1.0625rem;
    font-weight: 700;
}

.guide__side {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 6px;
    padding: 6px 8px;
    border-radius: 8px;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.75);
}

.guide__side--mine {
    background: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-on-surface));
}

.guide__letter {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(var(--v-theme-on-surface), 0.08);
    font-size: 0.8125rem;
    font-weight: 700;
}

.guide__side--mine .guide__letter {
    background: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
}

.group {
    border-top: 3px solid var(--tone);
}

.group--mine {
    background: color-mix(in srgb, var(--tone) 7%, rgb(var(--v-theme-surface)));
    box-shadow: 0 2px 10px color-mix(in srgb, var(--tone) 22%, transparent);
}

.group__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--tone);
}

.group__letters {
    font-size: 0.8125rem;
    letter-spacing: 0.15em;
    color: rgba(var(--v-theme-on-surface), 0.55);
}

.group__chip {
    color: var(--chip-tone);
}

.group__chip--current {
    background: var(--chip-tone);
    color: #fff;
}
</style>
