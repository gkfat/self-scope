<template>
    <div
        class="year-row"
        :class="{ 'year-row--current': current }"
    >
        <span class="year-row__year">{{ year.year }}</span>
        <BaziGanzhi
            :pillar="year.pillar"
            size="sm"
        />
        <span class="year-row__god">{{ year.tenGod }}</span>
        <v-chip
            v-if="current"
            size="x-small"
            color="primary"
            variant="flat"
        >
            今年
        </v-chip>
    </div>
</template>

<script lang="ts" setup>
import type { BaziResponse } from '../../../shared/schemas/api/bazi.schema';

defineProps<{
    year: NonNullable<BaziResponse['flowYears']>[number];
    /** Highlight as the current year */
    current?: boolean;
}>();
</script>

<style scoped>
.year-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: 8px;
}

.year-row--current {
    background: rgba(var(--v-theme-primary), 0.1);
}

.year-row__year {
    min-width: 3.2em;
    font-variant-numeric: tabular-nums;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.year-row__god {
    font-size: 0.9rem;
}
</style>
