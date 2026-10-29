<template>
    <div>
        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>星盤</v-card-title>
            <v-card-subtitle class="text-wrap">
                上升在左邊（9 點鐘方向），十二個星座也是十二個宮位，由上升的星座開始逆時針排列；中間的線是星體之間的相位。
            </v-card-subtitle>
            <v-card-text>
                <NatalChartWheel :chart="chart" />
                <div class="d-flex flex-wrap justify-center ga-4 mt-3 text-caption text-medium-emphasis">
                    <span><span class="legend legend--flow" />順暢（三分、六分）</span>
                    <span><span class="legend legend--strain" />帶張力（四分、對分）</span>
                    <span><span class="legend legend--blend" />融合（合相）</span>
                </div>
            </v-card-text>
        </v-card>

        <v-card
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>十二宮位</v-card-title>
            <v-card-subtitle class="text-wrap">
                宮位是生活的十二個領域。有星體落在的宮位，那個領域比較容易成為你的重心；沒有星體的宮位，看它的宮主星落在哪裡。
            </v-card-subtitle>
            <v-card-text>
                <div
                    v-for="group in HOUSE_GROUPS"
                    :key="group.title"
                    class="mb-5"
                >
                    <div class="text-subtitle-1 font-weight-medium">
                        {{ group.title }}
                    </div>
                    <p class="text-caption text-medium-emphasis mb-2">
                        {{ group.subtitle }}
                    </p>
                    <v-row dense>
                        <v-col
                            v-for="house in housesOf(group.houses)"
                            :key="house.house"
                            cols="12"
                            md="4"
                        >
                            <v-card
                                :variant="house.bodies.length ? 'outlined' : 'tonal'"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="d-flex align-center ga-2 mb-1">
                                        <span class="text-subtitle-2 font-weight-bold">第 {{ house.house }} 宮</span>
                                        <span class="text-caption text-medium-emphasis">{{ HOUSE_THEMES[house.house - 1] }}</span>
                                    </div>
                                    <div class="text-body-2 mb-2">
                                        {{ ZODIAC_LABELS[house.sign] }}・宮主星{{ NATAL_LABELS[house.ruler].name }}
                                    </div>
                                    <template v-if="placementsIn(house).length">
                                        <div
                                            v-for="item in placementsIn(house)"
                                            :key="item.key"
                                            class="placement"
                                        >
                                            <div class="text-subtitle-2">
                                                {{ item.name }}・{{ item.where }}
                                            </div>
                                            <p
                                                v-if="item.signReading"
                                                class="text-body-2 mb-1"
                                            >
                                                {{ item.signReading }}
                                            </p>
                                            <p
                                                v-if="item.houseReading"
                                                class="text-body-2 text-medium-emphasis mb-0"
                                            >
                                                {{ item.houseReading }}
                                            </p>
                                        </div>
                                    </template>
                                    <p
                                        v-else
                                        class="text-body-2 text-medium-emphasis mb-0"
                                    >
                                        {{ emptyHouseReading(house) }}
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>
            </v-card-text>
        </v-card>

        <v-card
            v-if="chart.aspects.length"
            variant="outlined"
            class="mb-4"
        >
            <v-card-title>相位</v-card-title>
            <v-card-subtitle class="text-wrap">
                相位是兩顆星體之間的角度，把它們各自代表的部分連起來。相差的度數越小越緊密，影響也越明顯。
            </v-card-subtitle>
            <v-card-text>
                <div
                    v-for="group in aspectGroups"
                    :key="group.flow"
                    class="mb-4"
                >
                    <div class="text-subtitle-1 font-weight-medium mb-1">
                        {{ group.title }}
                    </div>
                    <v-row dense>
                        <v-col
                            v-for="aspect in group.aspects"
                            :key="aspect.label"
                            cols="12"
                            sm="6"
                            md="4"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                            >
                                <v-card-text>
                                    <div class="d-flex align-center justify-space-between ga-2 mb-1">
                                        <span class="text-subtitle-1 font-weight-bold">{{ aspect.names }}</span>
                                        <span class="d-flex align-center ga-1">
                                            <v-chip
                                                v-if="aspect.tight"
                                                size="x-small"
                                                color="primary"
                                                variant="flat"
                                            >
                                                緊密
                                            </v-chip>
                                            <v-chip
                                                size="x-small"
                                                variant="tonal"
                                                :color="CHIP_COLORS[group.flow]"
                                            >
                                                {{ aspect.kind }}
                                            </v-chip>
                                        </span>
                                    </div>
                                    <div class="text-caption text-medium-emphasis mb-2">
                                        相差 {{ aspect.orb }}°
                                    </div>
                                    <p class="text-body-2 mb-0">
                                        {{ readingLines(aspect.label).join(' ') }}
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
import {
    ASPECT_FLOW, HOUSE_AREAS, HOUSE_GROUPS, TIGHT_ORB,
} from '../../shared/constants/natalSynthesis';
import {
    ASPECT_LABELS, HOUSE_THEMES, NATAL_LABELS,
} from '../../shared/constants/natalLabels';
import { ZODIAC_LABELS } from '../../shared/constants/zodiacLabels';
import type { NatalBody, AspectType  } from '../../shared/constants/natal';
import type { NatalChartResponse } from '../../shared/schemas/api/natalChart.schema';
import {
    aspectFactLabel, houseFactLabel,
} from '../../shared/report/adapters/natal';

const props = defineProps<{
    chart: NatalChartResponse;
    /** The reading written for each fact of the report, by the label of that fact */
    readings: Readonly<Record<string, string>>;
}>();

const houseFact = (house: number) => houseFactLabel(house);

/** A house with no body in it is led by its ruler, and where the ruler stands says where that area of life flows to. */
function emptyHouseReading(house: NatalChartResponse['houses'][number]): string {
    const ruler = NATAL_LABELS[house.ruler].name;
    const at = houseOf(house.ruler);

    return `這一宮沒有星體，「${HOUSE_AREAS[house.house - 1]}」由宮主星${ruler}帶領。${ruler}落在第 ${at} 宮，所以這方面的事容易透過「${HOUSE_AREAS[at - 1]}」展現。`;
}

/**
 * What stands in a house, with where each one falls among the signs and what that says, and what it says to stand in
 * this house. The ascendant is in the first house.
 */
function placementsIn(house: NatalChartResponse['houses'][number]) {
    const lines = readingLines(houseFact(house.house));
    // The house readings come in the order of the bodies of the house; if they do not line up, none is guessed at
    const lined = lines.length === house.bodies.length;
    const bodies = house.bodies.map((body, index) => {
        const placement = props.chart.bodies[body];

        return {
            key: body,
            name: NATAL_LABELS[body].name,
            where: `${ZODIAC_LABELS[placement.sign]} ${placement.degree}°`,
            // The reading of the sun's sign is written for the sun sign fact, the others for their own
            signReading: readingLines(body === 'SUN' ? '太陽星座' : NATAL_LABELS[body].name).join(' '),
            houseReading: lined ? (lines[index] ?? '') : '',
        };
    });

    if (house.house !== 1) return bodies;

    const ascendant = props.chart.ascendant;

    return [
        {
            key: 'ASCENDANT',
            name: NATAL_LABELS.ASCENDANT.name,
            where: `${ZODIAC_LABELS[ascendant.sign]} ${ascendant.degree}°`,
            signReading: readingLines(NATAL_LABELS.ASCENDANT.name).join(' '),
            houseReading: '',
        },
        ...bodies,
    ];
}
const housesOf = (numbers: readonly number[]) => props.chart.houses.filter((house) => numbers.includes(house.house));
const houseOf = (body: NatalBody) => props.chart.houses.find((house) => house.bodies.includes(body))?.house ?? 1;
const readingLines = (label: string) => (props.readings[label] ?? '').split('\n').filter((line) => line.trim() !== '');

/** The color of the chip that names the kind of aspect, the same colors the lines of the wheel have */
const CHIP_COLORS = {
    flow: 'success', strain: 'error', blend: 'default',
} as const;

const FLOW_TITLES = {
    flow: '順暢（三分相、六分相）',
    strain: '帶張力（四分相、對分相）',
    blend: '融合（合相）',
} as const;

const aspectGroups = computed(() => (['flow', 'strain', 'blend'] as const).flatMap((flow) => {
    const aspects = props.chart.aspects
        .filter((aspect) => ASPECT_FLOW[aspect.type as AspectType] === flow)
        .toSorted((a, b) => a.orb - b.orb)
        .map((aspect) => {
            const kind = ASPECT_LABELS[aspect.type as keyof typeof ASPECT_LABELS];

            return {
                label: aspectFactLabel(NATAL_LABELS[aspect.body1].name, kind, NATAL_LABELS[aspect.body2].name),
                names: `${NATAL_LABELS[aspect.body1].name}・${NATAL_LABELS[aspect.body2].name}`,
                kind,
                orb: aspect.orb.toFixed(1),
                tight: aspect.orb <= TIGHT_ORB,
            };
        });

    return aspects.length ? [{
        flow, title: FLOW_TITLES[flow], aspects,
    }] : [];
}));
</script>

<style scoped>
.placement + .placement {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.legend {
    display: inline-block;
    width: 18px;
    height: 3px;
    margin-right: 6px;
    vertical-align: middle;
}

.legend--flow {
    background: #2e7d5b;
}

.legend--strain {
    background: #d62f2f;
}

.legend--blend {
    background: #8a8a8a;
}
</style>
