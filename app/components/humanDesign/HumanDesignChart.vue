<template>
    <figure class="bodygraph">
        <svg
            :viewBox="`${CHART_VIEWBOX.x} ${CHART_VIEWBOX.y} ${CHART_VIEWBOX.width} ${CHART_VIEWBOX.height}`"
            role="img"
            aria-label="人類圖（Bodygraph）：九個能量中心、通道與閘門"
        >
            <!-- Channels: a grey track, then each half in the color of its own gate once the channel is complete -->
            <g
                v-for="channel in model.channels"
                :key="channel.key"
                fill="none"
                stroke-linecap="butt"
            >
                <path
                    :d="channel.d"
                    :stroke="COLORS.track"
                    stroke-width="4"
                />
                <template v-if="channel.defined">
                    <template
                        v-for="(half, index) in channel.halves"
                        :key="index"
                    >
                        <path
                            :d="half.d"
                            :stroke="half.state === 'DESIGN' ? COLORS.design : COLORS.personality"
                            stroke-width="6"
                        />
                        <path
                            v-if="half.state === 'BOTH'"
                            :d="half.d"
                            :stroke="COLORS.design"
                            stroke-width="6"
                            stroke-dasharray="4 4"
                        />
                    </template>
                </template>
            </g>

            <polygon
                v-for="item in model.centers"
                :key="item.center"
                :points="item.points"
                :fill="item.defined ? CENTER_COLORS[item.center] : COLORS.open"
                :stroke="item.defined ? CENTER_COLORS[item.center] : COLORS.outline"
                stroke-width="1.5"
                stroke-linejoin="round"
            >
                <title>{{ centerLabels[item.center] }}{{ item.defined ? '（有定義）' : '（開放）' }}</title>
            </polygon>

            <g
                v-for="item in model.gates"
                :key="item.gate"
            >
                <circle
                    :cx="item.x"
                    :cy="item.y"
                    r="6.5"
                    :fill="gateFill(item.state)"
                    :stroke="gateStroke(item.state)"
                    :stroke-width="item.state === 'BOTH' ? 2.5 : 1"
                />
                <text
                    :x="item.x"
                    :y="item.y"
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size="7.5"
                    :fill="item.state === 'NONE' ? COLORS.muted : '#fff'"
                >
                    {{ item.gate }}
                </text>
            </g>
        </svg>

        <figcaption class="bodygraph__legend">
            <span><i :style="{ background: COLORS.personality }" />人格（意識）</span>
            <span><i :style="{ background: COLORS.design }" />設計（潛意識）</span>
            <span><i :style="{ background: COLORS.design, boxShadow: `0 0 0 2px ${COLORS.personality}` }" />兩者皆有</span>
            <span><i :style="{ background: '#fff', boxShadow: `0 0 0 1px ${COLORS.outline}` }" />開放中心</span>
        </figcaption>
    </figure>
</template>

<script lang="ts" setup>
import {
    CENTER_COLORS, CHART_VIEWBOX,
} from '../../../shared/constants/humanDesignLayout';
import { HUMAN_DESIGN_CENTER_LABELS as centerLabels } from '../../../shared/constants/humanDesignLabels';
import type { HumanDesignResult } from '../../../shared/schemas/firestore/humanDesign.schema';
import {
    buildChartModel, type GateState,
} from '../../../shared/utils/humanDesignChartModel';

const props = defineProps<{ chart: HumanDesignResult }>();

// The chart is a drawing on its own white sheet, so these do not follow the page theme.
const COLORS = {
    personality: '#222222',
    design: '#d62f2f',
    track: '#e4e4e4',
    open: '#ffffff',
    outline: '#9a9a9a',
    muted: '#8a8a8a',
};

const model = computed(() => buildChartModel(props.chart));

function gateFill(state: GateState): string {
    if (state === 'PERSONALITY') return COLORS.personality;
    if (state === 'NONE') return '#ffffff';

    return COLORS.design;
}

function gateStroke(state: GateState): string {
    if (state === 'BOTH') return COLORS.personality;
    if (state === 'NONE') return '#bdbdbd';

    return gateFill(state);
}
</script>

<style scoped>
.bodygraph {
    margin: 0;
    padding: 12px;
    background: #fff;
    border-radius: 8px;
    max-width: 460px;
    margin-inline: auto;
}

.bodygraph svg {
    display: block;
    width: 100%;
    height: auto;
}

.bodygraph__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    justify-content: center;
    margin-top: 8px;
    font-size: 12px;
    color: #555;
}

.bodygraph__legend i {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 5px;
    border-radius: 50%;
    vertical-align: middle;
}
</style>
