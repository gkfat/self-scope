<template>
    <svg
        :viewBox="`0 0 ${SIZE} ${SIZE}`"
        class="wheel"
        role="img"
        aria-label="星盤圖"
    >
        <circle
            :cx="C"
            :cy="C"
            :r="OUTER"
            class="wheel__ring"
        />
        <circle
            :cx="C"
            :cy="C"
            :r="SIGN_INNER"
            class="wheel__ring"
        />
        <circle
            :cx="C"
            :cy="C"
            :r="HOUSE_INNER"
            class="wheel__ring"
        />

        <!-- The twelve signs, which are also the twelve houses: the first house begins at the ascendant -->
        <g
            v-for="index in 12"
            :key="`sign-${index}`"
        >
            <line
                :x1="edge(index - 1, SIGN_INNER).x"
                :y1="edge(index - 1, SIGN_INNER).y"
                :x2="edge(index - 1, OUTER).x"
                :y2="edge(index - 1, OUTER).y"
                class="wheel__edge"
            />
            <text
                :x="mid(index - 1, (OUTER + SIGN_INNER) / 2).x"
                :y="mid(index - 1, (OUTER + SIGN_INNER) / 2).y"
                class="wheel__sign"
                text-anchor="middle"
                dominant-baseline="central"
            >{{ signGlyph(index - 1) }}</text>
            <text
                :x="mid(index - 1, (HOUSE_INNER + 18)).x"
                :y="mid(index - 1, (HOUSE_INNER + 18)).y"
                class="wheel__house"
                text-anchor="middle"
                dominant-baseline="central"
            >{{ index }}</text>
        </g>

        <!-- Aspects join the bodies they are between -->
        <line
            v-for="aspect in lines"
            :key="aspect.key"
            :x1="aspect.from.x"
            :y1="aspect.from.y"
            :x2="aspect.to.x"
            :y2="aspect.to.y"
            :class="['wheel__aspect', `wheel__aspect--${aspect.flow}`]"
        />

        <g
            v-for="item in bodies"
            :key="item.body"
        >
            <line
                :x1="point(item.degrees, SIGN_INNER).x"
                :y1="point(item.degrees, SIGN_INNER).y"
                :x2="point(item.degrees, SIGN_INNER - 7).x"
                :y2="point(item.degrees, SIGN_INNER - 7).y"
                class="wheel__tick"
            />
            <text
                :x="point(item.degrees, item.radius).x"
                :y="point(item.degrees, item.radius).y"
                class="wheel__body"
                text-anchor="middle"
                dominant-baseline="central"
            >{{ BODY_GLYPHS[item.body] }}</text>
        </g>

        <text
            :x="6"
            :y="C - 8"
            class="wheel__asc"
        >ASC</text>
    </svg>
</template>

<script lang="ts" setup>
import type { NatalChartResponse } from '../../shared/schemas/api/natalChart.schema';
import { ASPECT_FLOW } from '../../shared/constants/natalSynthesis';
import type { AspectType } from '../../shared/constants/natal';
import {
    spreadBodies, wheelDegrees, wheelPoint,
} from '../../shared/utils/natalWheel';

const props = defineProps<{ chart: NatalChartResponse }>();

const SIZE = 420;
const C = SIZE / 2;
const OUTER = 200;
const SIGN_INNER = 168;
const HOUSE_INNER = 104;
/** The rings the bodies are drawn on, from the outer to the inner, so that close ones can be moved apart */
const BODY_RADII = [146, 128, 164 - 62, 112] as const;

const BODY_GLYPHS = {
    SUN: '☉︎',
    MOON: '☽︎',
    MERCURY: '☿︎',
    VENUS: '♀︎',
    MARS: '♂︎',
    JUPITER: '♃︎',
    SATURN: '♄︎',
    URANUS: '♅︎',
    NEPTUNE: '♆︎',
    PLUTO: '♇︎',
} as const;

// The signs in order, starting from the sign of the ascendant, as the houses run
const SIGN_GLYPHS = [
    '♈',
    '♉',
    '♊',
    '♋',
    '♌',
    '♍',
    '♎',
    '♏',
    '♐',
    '♑',
    '♒',
    '♓',
];
const ORDER = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces',
];

const point = (degrees: number, radius: number) => wheelPoint(degrees, radius, C);
const edge = (house: number, radius: number) => point(house * 30, radius);
const mid = (house: number, radius: number) => point((house * 30) + 15, radius);
const signGlyph = (house: number) => `${SIGN_GLYPHS[(ORDER.indexOf(props.chart.ascendant.sign) + house) % 12] ?? ''}︎`;

const bodies = computed(() => spreadBodies(props.chart, BODY_RADII, 9));

const lines = computed(() => props.chart.aspects.map((aspect, index) => ({
    key: `${aspect.body1}-${aspect.body2}-${index}`,
    from: point(wheelDegrees(props.chart, aspect.body1), HOUSE_INNER - 6),
    to: point(wheelDegrees(props.chart, aspect.body2), HOUSE_INNER - 6),
    flow: ASPECT_FLOW[aspect.type as AspectType],
})));
</script>

<style scoped>
.wheel {
    display: block;
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
}

.wheel__ring {
    fill: none;
    stroke: #9a9a9a;
    stroke-width: 1;
}

.wheel__edge {
    stroke: #c9c9c9;
    stroke-width: 1;
}

.wheel__sign {
    font-size: 17px;
    fill: #555;
}

.wheel__house {
    font-size: 11px;
    fill: #9a9a9a;
}

.wheel__body {
    font-size: 19px;
    fill: #222;
}

.wheel__tick {
    stroke: #222;
    stroke-width: 1.5;
}

.wheel__asc {
    font-size: 11px;
    fill: #8a8a8a;
}

.wheel__aspect {
    stroke-width: 1.2;
    opacity: 0.75;
}

.wheel__aspect--flow {
    stroke: #2e7d5b;
}

.wheel__aspect--strain {
    stroke: #d62f2f;
}

.wheel__aspect--blend {
    stroke: #8a8a8a;
}
</style>
