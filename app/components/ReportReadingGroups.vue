<template>
    <!-- Readings that belong together, each group under a heading of its own -->
    <div
        v-for="group in groups"
        :key="group.title"
        class="mt-6"
    >
        <div class="text-subtitle-1 font-weight-medium mb-2">
            {{ group.title }}
        </div>
        <!-- The keywords of a draw are chips, not cards -->
        <template v-if="group.title === KEYWORD_GROUP">
            <v-chip
                v-for="word in group.readings.flatMap((reading) => reading.text.split('、'))"
                :key="word"
                class="mr-2 mb-2"
                variant="tonal"
                color="primary"
            >
                {{ word }}
            </v-chip>
        </template>
        <v-row
            v-else
            dense
        >
            <v-col
                v-for="(reading, index) in group.readings"
                :key="`${group.title}-${index}`"
                cols="12"
                :md="group.readings.length === 3 ? 4 : 6"
            >
                <v-card
                    variant="outlined"
                    height="100%"
                >
                    <v-card-text>
                        <div class="text-subtitle-1 font-weight-bold mb-1">
                            {{ reading.title }}
                        </div>
                        <p class="text-body-2 mb-0 lines">
                            {{ reading.text }}
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts" setup>
defineProps<{
    groups: Array<{
        title: string;
        readings: Array<{ title: string; text: string }>;
    }>;
}>();

/** The group of keywords of a draw, shown as chips (the adapters of the draws title the group the same) */
const KEYWORD_GROUP = '關鍵字';
</script>

<style scoped>
.lines {
    white-space: pre-line;
}
</style>
