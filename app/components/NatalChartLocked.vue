<template>
    <v-card
        variant="outlined"
        class="mb-4 locked"
    >
        <v-card-title>星盤</v-card-title>
        <v-card-text class="locked__body">
            <!-- A made-up chart, blurred: it shows what the card will hold, and is nobody's own -->
            <div
                class="locked__preview"
                aria-hidden="true"
            >
                <NatalChartWheel :chart="SAMPLE_NATAL_CHART" />
            </div>
            <div class="locked__invite">
                <p class="text-body-1 font-weight-medium mb-1">
                    填寫出生時間與出生城市
                </p>
                <p class="text-body-2 text-medium-emphasis mb-4">
                    就能看到你的星盤圖、十二宮位與相位的完整分析。
                </p>
                <v-btn
                    to="/#fill"
                    color="primary"
                    size="large"
                    variant="flat"
                    prepend-icon="mdi-pencil-outline"
                >
                    去填寫出生資料
                </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
import { SAMPLE_NATAL_CHART } from '../../shared/constants/natalSample';
</script>

<style scoped>
.locked {
    overflow: hidden;
}

.locked__body {
    position: relative;
    min-height: 320px;
}

.locked__preview {
    filter: blur(5px);
    opacity: 0.85;
    pointer-events: none;
    user-select: none;
}

.locked__invite {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    text-align: center;
    background: rgba(var(--v-theme-surface), 0.35);
}
</style>
