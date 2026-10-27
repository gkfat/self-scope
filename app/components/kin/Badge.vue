<template>
    <v-card
        variant="outlined"
        class="badge"
        :style="{ '--seal': accent }"
    >
        <v-card-text class="text-center">
            <div class="text-caption text-medium-emphasis">
                Kin
            </div>
            <div class="badge__number">
                {{ kin.kinNumber }}
            </div>
            <div class="badge__name">
                {{ name }}
            </div>
            <v-row
                dense
                class="mt-3"
            >
                <v-col
                    cols="6"
                    class="badge__part"
                >
                    <div class="text-caption text-medium-emphasis">
                        圖騰
                    </div>
                    <div class="text-subtitle-1 font-weight-medium">
                        {{ seal }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        第 {{ kin.solarSeal }} 個
                    </div>
                </v-col>
                <v-col
                    cols="6"
                    class="badge__part"
                >
                    <div class="text-caption text-medium-emphasis">
                        調性
                    </div>
                    <div class="text-subtitle-1 font-weight-medium">
                        {{ tone }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        第 {{ kin.galacticTone }} 個
                    </div>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
import {
    SOLAR_SEALS, type SolarSealColor,
} from '../../../shared/constants/mayaKin';
import type { Kin } from '../../../shared/schemas/api/mayaKin.schema';
import {
    kinName, sealName, toneName,
} from '../../../shared/utils/mayaKin';

const props = defineProps<{ kin: Kin }>();

const ACCENTS: Record<SolarSealColor, string> = {
    red: '#c94f4f',
    white: '#8a94a6',
    blue: '#2f5d8a',
    yellow: '#b7791f',
};

const name = computed(() => kinName(props.kin));
const seal = computed(() => sealName(props.kin.solarSeal));
const tone = computed(() => toneName(props.kin.galacticTone));
const accent = computed(() => ACCENTS[SOLAR_SEALS[props.kin.solarSeal - 1]?.color ?? 'red']);
</script>

<style scoped>
.badge {
    border-color: var(--seal);
    border-width: 2px;
}

.badge__number {
    font-size: clamp(2.5rem, 9vw, 3.5rem);
    font-weight: 700;
    line-height: 1.1;
    color: var(--seal);
}

.badge__name {
    font-size: 1.25rem;
    font-weight: 500;
}

.badge__part {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    padding-top: 10px;
}
</style>
