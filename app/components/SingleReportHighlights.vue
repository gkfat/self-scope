<template>
    <div>
        <div
            v-for="parent in tree"
            :key="parent.title"
            class="mb-5"
        >
            <!-- A parent that holds several groups shows their headings instead of its own -->
            <div
                v-if="parent.sections.length === 1"
                class="text-subtitle-1 font-weight-medium mb-1"
            >
                {{ parent.title }}
            </div>
            <div
                v-for="section in parent.sections"
                :key="section.title"
                class="mb-3"
            >
                <div
                    v-if="parent.sections.length > 1"
                    class="text-subtitle-1 font-weight-medium mb-1"
                >
                    {{ section.title }}
                </div>
                <v-row dense>
                    <v-col
                        v-for="item in section.items"
                        :key="item.key"
                        cols="12"
                        sm="6"
                        md="4"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text>
                                <div class="d-flex align-center justify-space-between mb-1">
                                    <span class="text-caption text-medium-emphasis">{{ item.name }}</span>
                                    <v-chip
                                        v-if="item.tag"
                                        size="x-small"
                                        variant="tonal"
                                        color="primary"
                                    >
                                        {{ item.tag }}
                                    </v-chip>
                                </div>
                                <div class="text-subtitle-1 font-weight-bold mb-1">
                                    {{ item.title }}
                                </div>
                                <p class="text-body-2 mb-0">
                                    {{ item.text }}
                                </p>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    NATAL_GROUPS, NATAL_LABELS, type NatalKey,
} from '../../shared/constants/natalLabels';

type Block = {
    key: string;
    title: string;
    segments: ReadonlyArray<{ text: string; sources: ReadonlyArray<{ fact?: string | undefined }> }>;
};

const props = defineProps<{ blocks: readonly Block[] }>();

/** The placement a fact label names ("太陽" is the sun), to find the group it belongs to */
const KEY_OF_NAME = new Map<string, NatalKey>(Object.entries(NATAL_LABELS).map(([key, item]) => [item.name, key as NatalKey]));

/** The parents the groups of placements are shown under */
const PARENTS: ReadonlyArray<{ title: string; groups: readonly string[] }> = [
    {
        title: '個人行星', groups: ['三大星座', '思考、愛與行動'],
    },
    {
        title: '社會行星', groups: ['機會與責任'],
    },
    {
        title: '世代行星', groups: ['世代與長期主題'],
    },
];

/** What each placement is about, in a word, shown as a label at the corner of its card: 核心 */
const TAGS: Readonly<Record<NatalKey, string>> = {
    SUN: '核心',
    MOON: '內在',
    ASCENDANT: '外在',
    MERCURY: '思考',
    VENUS: '愛',
    MARS: '行動',
    JUPITER: '機會',
    SATURN: '責任',
    URANUS: '改變',
    NEPTUNE: '理想',
    PLUTO: '轉化',
};

/** "太陽天蠍座：核心是深度與專注…" as the placement (太陽, with 核心 as a label), the sign (天蠍座) and the key words */
function cardOf(segment: Block['segments'][number]) {
    const name = segment.sources.find((source) => source.fact)?.fact ?? '';
    const colon = segment.text.indexOf('：');
    const heading = colon < 0 ? segment.text : segment.text.slice(0, colon);
    const placement = KEY_OF_NAME.get(name);

    return {
        key: name,
        name,
        tag: placement ? TAGS[placement] : '',
        title: heading.startsWith(name) ? heading.slice(name.length) : heading,
        text: (colon < 0 ? '' : segment.text.slice(colon + 1)).replace(/（依據：.*）$/s, ''),
        placement,
    };
}

const tree = computed(() => {
    const cards = props.blocks.flatMap((block) => block.segments.map(cardOf));

    return PARENTS.flatMap((parent) => {
        const sections = NATAL_GROUPS.filter((group) => parent.groups.includes(group.title)).flatMap((group) => {
            const items = cards.filter((card) => card.placement && group.keys.includes(card.placement));

            return items.length ? [{
                title: group.title, subtitle: group.subtitle, items,
            }] : [];
        });

        return sections.length ? [{
            title: parent.title, sections,
        }] : [];
    });
});
</script>
