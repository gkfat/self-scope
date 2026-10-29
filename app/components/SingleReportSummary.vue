<template>
    <div>
        <!-- One small card for each trait the facts point at: the trait, what it is, and what it looks like when overdone -->
        <v-row
            v-if="facetCards.length"
            dense
            class="mb-2"
        >
            <v-col
                v-for="(facet, index) in facetCards"
                :key="facet.name"
                cols="12"
                sm="6"
                md="4"
            >
                <v-card
                    variant="outlined"
                    height="100%"
                    :class="['facet', `facet--${index % 3}`]"
                >
                    <v-card-text>
                        <div class="text-subtitle-1 font-weight-bold mb-1">
                            {{ facet.name }}
                        </div>
                        <p class="text-body-2 mb-3">
                            {{ facet.description }}
                        </p>
                        <div
                            v-if="facet.overuse"
                            class="facet__overuse"
                        >
                            <div class="text-caption text-medium-emphasis">
                                過頭時
                            </div>
                            <p class="text-body-2 mb-0">
                                {{ facet.overuse }}
                            </p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- What else the facts say together, in a few words each (where the bodies gather, the mix of elements…) -->
        <div
            v-if="otherSummary.length"
            :class="{ 'mt-5': facetCards.length }"
        >
            <v-row dense>
                <v-col
                    v-for="(item, index) in otherSummary"
                    :key="`summary-${index}`"
                    cols="12"
                    md="6"
                >
                    <v-card
                        variant="outlined"
                        height="100%"
                    >
                        <v-card-text>
                            <p class="text-body-2 mb-0">
                                {{ withoutBasis(item) }}
                            </p>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </div>

        <!-- Conclusions that have a heading of their own: each a title and what it can mean -->
        <div
            v-for="group in groups"
            :key="group.key"
            class="mt-5"
        >
            <div class="text-subtitle-1 font-weight-medium mb-2">
                {{ group.title }}
            </div>
            <v-row dense>
                <v-col
                    v-for="(item, index) in group.items"
                    :key="`${group.key}-${index}`"
                    cols="12"
                    md="6"
                >
                    <v-card
                        variant="outlined"
                        height="100%"
                    >
                        <v-card-text>
                            <div class="text-subtitle-1 font-weight-bold mb-1">
                                {{ titled(item).title }}
                            </div>
                            <p class="text-body-2 mb-0 lines">
                                {{ titled(item).text }}
                            </p>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </div>
    </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
    /** One small card for each trait the facts point at */
    facetCards: ReadonlyArray<{ name: string; description: string; overuse: string }>;
    /** What else the facts say together, as it was written */
    otherSummary: readonly string[];
    /** Conclusions that have a heading of their own, with their sentences as they were written */
    groups?: ReadonlyArray<{ key: string; title: string; items: readonly string[] }>;
}>(), { groups: () => [] });

/** The basis a sentence was written with is kept in the report, and not shown on the card */
const withoutBasis = (text: string) => text.replace(/（依據：.*）$/s, '');

/** "土星、天王星、海王星集中在第 3 宮：「…」可能是…" as its title and its text */
function titled(text: string): { title: string; text: string } {
    const plain = withoutBasis(text);
    const colon = plain.indexOf('：');

    return colon < 0
        ? {
            title: '', text: plain,
        }
        : {
            title: plain.slice(0, colon), text: plain.slice(colon + 1),
        };
}
</script>

<style scoped>
.facet {
    border-top-width: 4px;
    border-top-color: rgb(var(--facet-accent));
    background: rgba(var(--facet-accent), 0.07);
}

/* A soft color for each of the three, taken from the colors the banners use */
.facet--0 {
    --facet-accent: 46, 125, 91;
}

.facet--1 {
    --facet-accent: 183, 121, 31;
}

.facet--2 {
    --facet-accent: 47, 93, 138;
}

.lines {
    white-space: pre-line;
}

.facet__overuse {
    padding-top: 10px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>
