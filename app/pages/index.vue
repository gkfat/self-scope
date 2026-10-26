<template>
    <div class="home">
        <section class="hero">
            <div
                class="hero__bg"
                aria-hidden="true"
            />
            <p class="hero__eyebrow">
                自我分析 · 自我覺察 · 自我了解
            </p>
            <h1 class="hero__title">
                一個你，四種看見的方式
            </h1>
            <p class="hero__lead">
                星座、血型、人類圖、MBTI，每個角度都照見你的一部分。把它們放在一起，從自我覺察開始，慢慢拼出對自己的了解。
            </p>
            <p class="hero__badge">
                <v-icon size="18">
                    mdi-lock-open-variant-outline
                </v-icon>
                不用登入，就能做單一維度的簡易分析
            </p>
        </section>

        <v-row class="mb-2" dense>
            <v-col
                v-for="layer in layers"
                :key="layer.key"
                cols="12"
                sm="6"
                md="3"
            >
                <v-card
                    :to="layer.to"
                    height="100%"
                    variant="outlined"
                    class="dimension"
                    :style="{ '--tone': layer.tone }"
                >
                    <v-card-text class="d-flex flex-column ga-2 h-100">
                        <div class="d-flex align-center justify-space-between">
                            <span class="dimension__icon">
                                <v-icon size="28">{{ layer.icon }}</v-icon>
                            </span>
                            <v-chip
                                v-if="layer.done"
                                size="small"
                                color="success"
                                variant="tonal"
                                prepend-icon="mdi-check"
                            >
                                {{ layer.result }}
                            </v-chip>
                        </div>

                        <div class="text-h6 mt-1">
                            {{ layer.title }}
                        </div>
                        <p class="text-body-2 mb-0">
                            {{ layer.description }}
                        </p>
                        <p class="dimension__need text-body-2 mb-0">
                            <v-icon size="16">
                                mdi-pencil-outline
                            </v-icon>
                            {{ layer.need }}
                        </p>

                        <v-spacer />
                        <div class="dimension__action text-body-2 font-weight-medium">
                            {{ layer.action }}
                            <v-icon size="16">
                                mdi-arrow-right
                            </v-icon>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-card
            id="fill"
            class="fill mb-6"
            variant="outlined"
        >
            <v-card-title>現在就填寫，馬上看分析</v-card-title>
            <v-card-subtitle class="text-wrap">
                填好一項，就能立刻看那一項的分析，不用登入。
            </v-card-subtitle>
            <v-card-text>
                <v-row>
                    <v-col
                        cols="12"
                        md="7"
                    >
                        <div class="text-subtitle-2 mb-2">
                            出生日期
                        </div>
                        <ProfileBirthDateSelect v-model="birthDateInput" />
                        <div class="mt-3">
                            <v-btn
                                v-if="zodiacSign"
                                :to="`/analysis/zodiac/${zodiacSign}`"
                                color="primary"
                                prepend-icon="mdi-star-four-points-outline"
                            >
                                看星座分析（{{ ZODIAC_LABELS[zodiacSign] }}）
                            </v-btn>
                            <p
                                v-else
                                class="text-body-2 text-medium-emphasis mb-0"
                            >
                                選好年、月、日，這裡會出現「看星座分析」。
                            </p>
                        </div>
                    </v-col>
                    <v-col
                        cols="12"
                        md="5"
                    >
                        <div class="text-subtitle-2 mb-2">
                            血型
                        </div>
                        <v-select
                            v-model="bloodTypeInput"
                            :items="bloodTypeItems"
                            label="選擇血型"
                            hide-details
                        />
                        <div class="mt-3">
                            <v-btn
                                v-if="analysableBloodType"
                                :to="`/analysis/blood/${analysableBloodType}`"
                                color="primary"
                                prepend-icon="mdi-water-outline"
                            >
                                看血型分析（{{ BLOOD_TYPE_LABELS[analysableBloodType] }}）
                            </v-btn>
                            <p
                                v-else
                                class="text-body-2 text-medium-emphasis mb-0"
                            >
                                選好血型，這裡會出現「看血型分析」。
                            </p>
                        </div>
                    </v-col>
                </v-row>
                <v-divider class="my-5" />

                <div class="text-subtitle-2 mb-1">
                    進階資料（選填）
                </div>
                <p class="text-body-2 text-medium-emphasis mb-3">
                    再填出生時間與出生城市，可以解鎖進階星座分析，也能計算人類圖。
                </p>
                <v-row>
                    <v-col
                        cols="12"
                        md="7"
                    >
                        <ProfileBirthTimeSelect
                            v-model="birthTimeInput"
                            label="上午／下午"
                        />
                    </v-col>
                    <v-col
                        cols="12"
                        md="5"
                    >
                        <ProfileCitySelect
                            v-model="birthPlaceInput"
                            label="出生城市"
                            hint="輸入中文或英文即可搜尋"
                        />
                    </v-col>
                </v-row>

                <v-divider class="my-5" />

                <div class="text-subtitle-2 mb-1">
                    分析得更深入一點
                </div>
                <p class="text-body-2 text-medium-emphasis mb-3">
                    一個生日，就能看見你的星座特質。再多告訴我們出生的時間和城市，會多出一層只屬於你的細節。想知道最近的你正在經歷什麼，還有跟著現在時間變化的即時分析。
                </p>
                <v-row>
                    <v-col
                        v-for="tier in tiers"
                        :key="tier.key"
                        cols="12"
                        md="6"
                    >
                        <v-card
                            variant="outlined"
                            height="100%"
                        >
                            <v-card-text class="d-flex flex-column ga-2 h-100">
                                <div class="d-flex align-center ga-2">
                                    <v-icon :color="tier.unlocked ? 'primary' : 'grey'">
                                        {{ tier.unlocked ? tier.icon : 'mdi-lock-outline' }}
                                    </v-icon>
                                    <span class="text-subtitle-1 font-weight-medium">{{ tier.title }}</span>
                                    <v-chip
                                        v-if="tier.paid"
                                        size="x-small"
                                        color="warning"
                                        variant="tonal"
                                    >
                                        點數
                                    </v-chip>
                                </div>
                                <p class="text-body-2 mb-0">
                                    {{ tier.description }}
                                </p>
                                <v-spacer />
                                <v-btn
                                    :color="tier.unlocked ? 'primary' : undefined"
                                    :variant="tier.unlocked ? 'flat' : 'tonal'"
                                    :disabled="!tier.unlocked"
                                    :prepend-icon="tier.paid ? 'mdi-circle-multiple-outline' : tier.icon"
                                    :to="tier.unlocked ? tier.to : undefined"
                                    class="align-self-start"
                                    @click="openTier(tier)"
                                >
                                    {{ tier.unlocked ? tier.action : tier.lockedHint }}
                                </v-btn>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <p
                    v-if="savedNote"
                    class="text-caption text-medium-emphasis mt-4 mb-0"
                >
                    {{ savedNote }}
                </p>
            </v-card-text>
        </v-card>

        <v-dialog
            :model-value="comingSoon !== null"
            max-width="420"
            @update:model-value="comingSoon = null"
        >
            <v-card>
                <v-card-title>{{ comingSoon }}</v-card-title>
                <v-card-text>這項分析正在準備中，很快就會開放，敬請期待。</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="comingSoon = null">
                        知道了
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts" setup>
import {
    BLOOD_TYPE_LABELS, ZODIAC_LABELS,
} from '../../shared/constants/zodiacLabels';
import { BLOOD_TYPES } from '../../shared/schemas/common';
import type {
    BloodType, Zodiac,
} from '../../shared/schemas/common';
import type { ExplorationLayer } from '../../shared/utils/explorationProgress';
import { zodiacFromIsoDate } from '../../shared/utils/zodiac';

useHead({ title: '多維度自我分析' });

type LayerCard = {
    key: ExplorationLayer;
    title: string;
    icon: string;
    /** The accent of this dimension: its icon tile and top edge */
    tone: string;
    /** Which side of yourself this dimension looks at */
    description: string;
    /** What the visitor has to provide */
    need: string;
    done: boolean;
    /** What the finished dimension shows, e.g. the sign or the type */
    result: string;
    to: string;
    action: string;
};

const { isAuthenticated } = useAuth();
const {
    state, progress, save,
} = useExploration();

const birthDate = computed(() => state.value.birthData?.birthDate ?? null);

// What the visitor is typing right now; saved a moment after they stop, once there is a full date.
const birthDateInput = ref('');
const bloodTypeInput = ref<BloodType | null>(null);
const birthTimeInput = ref('');
const birthPlaceInput = ref<string | null>(null);
const comingSoon = ref<string | null>(null);
const savedNote = ref('');
const AUTOSAVE_DELAY_MS = 800;
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

const bloodTypeItems = BLOOD_TYPES.map((value) => ({
    title: BLOOD_TYPE_LABELS[value], value,
}));

const zodiacSign = computed<Zodiac | null>(() => (birthDateInput.value ? zodiacFromIsoDate(birthDateInput.value) : null));
/** An unknown blood type has nothing to analyse (RULE-002). */
const analysableBloodType = computed(() => (bloodTypeInput.value && bloodTypeInput.value !== 'UNKNOWN' ? bloodTypeInput.value : null));

/** Unlocked once the birth date, time and city are all there: what a birth chart needs. */
const advancedUnlocked = computed(() => Boolean(zodiacSign.value && birthTimeInput.value && birthPlaceInput.value));

type Tier = {
    key: string;
    title: string;
    icon: string;
    description: string;
    action: string;
    lockedHint: string;
    unlocked: boolean;
    paid: boolean;
    /** Where an unlocked tier leads; without one the content is still being planned. */
    to?: string;
};

// The real-time tier is a placeholder for now: the button exists, the content is still to be planned.
const tiers = computed<Tier[]>(() => [
    {
        key: 'humanDesign',
        title: '人類圖分析',
        icon: 'mdi-vector-triangle',
        description: '依出生當下的星體位置，看你的能量怎麼運作、怎樣做決定最順。',
        action: '看人類圖分析',
        lockedHint: '填寫出生時間與城市，解鎖這一層',
        unlocked: advancedUnlocked.value,
        paid: false,
        to: '/human-design',
    },
    {
        key: 'advanced',
        title: '進階星座分析',
        icon: 'mdi-star-circle-outline',
        description: '同樣是這個星座，你和別人還是不一樣。多給出生時間與城市，看見更貼近你自己的那一層。',
        action: zodiacSign.value ? `看星座進階分析（${ZODIAC_LABELS[zodiacSign.value]}）` : '看星座進階分析',
        lockedHint: '填寫出生時間與城市，解鎖這一層',
        unlocked: advancedUnlocked.value,
        paid: false,
        // The same report as the button under the birth date: its advanced part is what the time and city unlock.
        to: zodiacSign.value ? `/analysis/zodiac/${zodiacSign.value}` : undefined,
    },
    {
        key: 'realtime',
        title: '即時星象分析',
        icon: 'mdi-clock-outline',
        description: '你現在正走在什麼樣的節奏？看看此刻的星象，怎麼和你的出生資料互相呼應。',
        action: '用點數解鎖',
        lockedHint: '填寫出生時間與城市，解鎖這一層',
        unlocked: advancedUnlocked.value,
        paid: true,
    },
]);

function openTier(tier: Tier) {
    // A tier with a destination is a plain link; the others only announce that they are coming.
    if (!tier.to) comingSoon.value = tier.title;
}

async function saveEntered() {
    if (!birthDateInput.value) return;

    try {
        await save({
            birthDate: birthDateInput.value,
            birthTime: birthTimeInput.value,
            birthPlace: birthPlaceInput.value,
            bloodType: bloodTypeInput.value ?? 'UNKNOWN',
        });
        savedNote.value = isAuthenticated.value ? '已存到你的帳號。' : '已暫存 1 天，登入後可以長期保存。';
    } catch (error) {
        console.error('[home] autosave failed:', error);
        savedNote.value = '這次沒有存起來，分析仍可查看。';
    }
}

// Filling the inputs from what was saved earlier is not an edit and must not be saved back.
let hydrating = false;

watch([birthDateInput, bloodTypeInput, birthTimeInput, birthPlaceInput], () => {
    if (hydrating) return;

    if (autosaveTimer) clearTimeout(autosaveTimer);

    autosaveTimer = setTimeout(saveEntered, AUTOSAVE_DELAY_MS);
});

onBeforeUnmount(() => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
});

// Show what was saved earlier (this runs once the saved data has arrived).
watch(() => state.value.loaded, async (loaded) => {
    if (!loaded) return;

    hydrating = true;
    birthDateInput.value = state.value.birthData?.birthDate ?? '';
    bloodTypeInput.value = state.value.bloodType === 'UNKNOWN' ? null : state.value.bloodType;
    birthTimeInput.value = state.value.birthData?.birthTime ?? '';
    birthPlaceInput.value = state.value.birthData?.birthPlace ?? null;
    await nextTick();
    hydrating = false;
}, { immediate: true });

const layers = computed<LayerCard[]>(() => [
    {
        key: 'ZODIAC',
        title: '星座',
        icon: 'mdi-star-four-points-outline',
        tone: '#b7791f',
        description: '從出生時太陽所在的位置，看你天生的性格傾向與行事風格。',
        need: '需要：出生日期',
        done: progress.value.done.ZODIAC,
        result: birthDate.value ? ZODIAC_LABELS[zodiacFromIsoDate(birthDate.value)] : '',
        to: '/#fill',
        action: birthDate.value ? '修改出生日期' : '填寫出生日期',
    },
    {
        key: 'BLOOD',
        title: '血型',
        icon: 'mdi-water-outline',
        tone: '#c94f4f',
        description: '用常見的血型性格說法，看你與人相處和面對事情的習慣。',
        need: '需要：血型',
        done: progress.value.done.BLOOD,
        result: BLOOD_TYPE_LABELS[state.value.bloodType],
        to: '/#fill',
        action: progress.value.done.BLOOD ? '修改血型' : '選擇血型',
    },
    {
        key: 'HUMAN_DESIGN',
        title: '人類圖',
        icon: 'mdi-vector-triangle',
        tone: '#2e7d5b',
        description: '依出生當下的星體位置，看你的能量如何運作、怎樣做決定最順。',
        need: '需要：出生日期、時間與地點',
        done: progress.value.done.HUMAN_DESIGN,
        result: '已計算',
        to: '/#fill',
        action: progress.value.done.HUMAN_DESIGN ? '查看人類圖' : '計算人類圖',
    },
    {
        key: 'MBTI',
        title: 'MBTI',
        icon: 'mdi-head-cog-outline',
        tone: '#2f5d8a',
        description: '從回答問題的方式，看你如何獲取能量、接收資訊與做決定。',
        need: '需要：回答 32 題，約 8 分鐘',
        done: progress.value.done.MBTI,
        result: state.value.mbti ?? '',
        to: state.value.mbti ? `/analysis/mbti/${state.value.mbti}` : '/test',
        action: state.value.mbti ? '查看 MBTI 分析' : '開始測驗',
    },
]);
</script>

<style scoped>
/* Everything inside the page stays in the container; only the background runs edge to edge. */
.home {
    position: relative;
    isolation: isolate;
}

.hero {
    position: relative;
    margin-bottom: 24px;
    padding: 28px 0 0;
}

/*
 * Full-width backdrop: from under the app bar down past the hero text, ending partway into the
 * dimension cards so they sit on its lower edge.
 */
.hero__bg {
    position: absolute;
    top: -16px;
    bottom: -100px;
    left: 50%;
    z-index: -1;
    width: 100vw;
    transform: translateX(-50%);
    overflow: hidden;
    background:
        radial-gradient(circle at 88% 0%, rgba(47, 93, 138, 0.16) 0, rgba(47, 93, 138, 0) 40%),
        radial-gradient(circle at 6% 100%, rgba(183, 121, 31, 0.16) 0, rgba(183, 121, 31, 0) 36%),
        linear-gradient(180deg, #eef2f7 0%, #f4f6f9 100%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* Soft rings in the corner as a quiet decoration. */
.hero__bg::after {
    content: '';
    position: absolute;
    top: -90px;
    right: 6%;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    border: 1px solid rgba(47, 93, 138, 0.18);
    box-shadow:
        0 0 0 26px rgba(47, 93, 138, 0.05),
        0 0 0 52px rgba(47, 93, 138, 0.04),
        0 0 0 78px rgba(47, 93, 138, 0.03);
}

.hero__eyebrow {
    margin: 0 0 8px;
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: rgb(var(--v-theme-primary));
}

.hero__title {
    margin: 0 0 12px;
    font-size: clamp(1.625rem, 4.5vw, 2.25rem);
    font-weight: 700;
    line-height: 1.25;
}

.hero__lead {
    max-width: 36em;
    margin: 0 0 18px;
    font-size: 1rem;
    line-height: 1.75;
    color: rgba(0, 0, 0, 0.7);
}

.hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.875rem;
    color: rgb(var(--v-theme-success));
    background: rgba(46, 125, 91, 0.1);
}

.fill {
    scroll-margin-top: 80px;
    border-color: rgba(0, 0, 0, 0.12);
    background: rgb(var(--v-theme-surface));
}

.dimension {
    position: relative;
    overflow: hidden;
    border-color: rgba(0, 0, 0, 0.12);
    background: rgb(var(--v-theme-surface));
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* The accent along the top edge belongs to this dimension. */
.dimension::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: var(--tone);
}

/* A large, faint ring of the same accent behind the content. */
.dimension::after {
    content: '';
    position: absolute;
    right: -34px;
    bottom: -34px;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    border: 14px solid var(--tone);
    opacity: 0.07;
    pointer-events: none;
}

.dimension__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 12%, white);
}

.dimension__need {
    display: flex;
    align-items: center;
    gap: 4px;
    color: rgba(0, 0, 0, 0.6);
}

.dimension__action {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--tone);
}

@media (hover: hover) {
    .dimension:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(20, 38, 58, 0.1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .dimension {
        transition: none;
    }

    .dimension:hover {
        transform: none;
    }
}
</style>
