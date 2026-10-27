<template>
    <div class="home">
        <section class="hero">
            <div
                class="hero__bg"
                aria-hidden="true"
            />
            <p class="hero__eyebrow">
                自我探索 · 自我覺察 · 更了解自己
            </p>
            <h1 class="hero__title">
                我是誰？
            </h1>
            <p class="hero__lead">
                這個問題沒有單一答案。這裡提供星座、血型、人類圖、MBTI、生命靈數等不同角度，每一個都照見你的一部分；從你好奇的那個開始，慢慢拼出一個更完整、更了解的自己。
            </p>
            <p class="hero__badge">
                <v-icon size="18">
                    mdi-lock-open-variant-outline
                </v-icon>
                不用登入，就能做單一維度的簡易分析
            </p>
            <div
                v-if="initialized && !isAuthenticated"
                class="pass"
            >
                <v-btn
                    to="/login"
                    color="primary"
                    size="large"
                    rounded="lg"
                    class="pass__btn"
                >
                    立即登入
                    <v-icon
                        icon="mdi-arrow-right"
                        end
                        class="pass__arrow"
                    />
                </v-btn>
                <ul class="pass__perks">
                    <li>
                        <v-icon
                            icon="mdi-check-circle-outline"
                            size="18"
                        />
                        保存你的資料與結果
                    </li>
                    <li>
                        <v-icon
                            icon="mdi-check-circle-outline"
                            size="18"
                        />
                        解鎖多維度分析
                    </li>
                </ul>
                <span class="pass__coin">
                    <span
                        class="pass__coin-mark"
                        aria-hidden="true"
                    >3</span>
                    首次登入贈 3 點
                </span>
            </div>
        </section>

        <v-card
            class="angles mb-6"
            variant="outlined"
        >
            <v-card-title>從不同的角度，認識自己</v-card-title>
            <v-card-subtitle class="text-wrap">
                一個人很難用單一說法說完。這裡把可以用來認識自己的方法分成兩類，每一類都從不同的方向照見你的一部分。
            </v-card-subtitle>
            <v-card-text>
                <section
                    v-for="system in systems"
                    :key="system.key"
                    class="system"
                >
                    <div class="system__head">
                        <v-icon
                            :icon="system.icon"
                            color="primary"
                        />
                        <h3 class="system__title">
                            {{ system.title }}
                        </h3>
                    </div>
                    <p class="system__purpose">
                        目的：{{ system.purpose }}
                    </p>
                    <div class="system__grid">
                        <div
                            v-for="item in system.items"
                            :key="item.title"
                            class="angle"
                            :style="{ '--tone': item.tone }"
                        >
                            <span class="angle__title">{{ item.title }}</span>
                            <span class="angle__text">{{ item.text }}</span>
                        </div>
                    </div>
                </section>
            </v-card-text>
        </v-card>

        <v-card
            v-if="tarotEntryEnabled"
            class="tarot-block mb-6"
            variant="outlined"
        >
            <v-card-text class="d-flex flex-wrap align-center ga-4">
                <v-avatar
                    color="primary"
                    variant="tonal"
                    size="48"
                >
                    <v-icon icon="mdi-cards-playing-outline" />
                </v-avatar>
                <div class="flex-grow-1">
                    <div class="text-subtitle-1 font-weight-medium">
                        每日塔羅
                    </div>
                    <p
                        v-if="!initialized || !isAuthenticated"
                        class="text-body-2 text-medium-emphasis mb-0"
                    >
                        每天翻一張牌，看看今天給你的提醒。登入後就能翻牌。
                    </p>
                    <p
                        v-else-if="tarotDrawn"
                        class="text-body-2 mb-0"
                    >
                        今天的牌：{{ tarotDrawn.card.name }}（{{ TAROT_ORIENTATION_LABELS[tarotDrawn.card.orientation] }}）
                    </p>
                    <p
                        v-else
                        class="text-body-2 text-medium-emphasis mb-0"
                    >
                        今天還沒翻牌，每天可以翻一張。
                    </p>
                </div>
                <v-btn
                    v-if="initialized && !isAuthenticated"
                    to="/login"
                    color="primary"
                >
                    立即登入
                </v-btn>
                <v-btn
                    v-else-if="initialized"
                    to="/tarot"
                    :color="tarotDrawn ? undefined : 'primary'"
                    :variant="tarotDrawn ? 'tonal' : 'flat'"
                    :loading="tarotStatus === 'loading' && !tarotToday"
                >
                    {{ tarotDrawn ? '看今天的牌' : '翻今天的牌' }}
                </v-btn>
            </v-card-text>
        </v-card>

        <v-card
            id="fill"
            class="fill mb-6"
            variant="outlined"
        >
            <v-card-title>現在就填寫，馬上看分析</v-card-title>
            <v-card-subtitle class="text-wrap">
                填好資料，就能到下方「可做的分析」查看，不用登入。
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
                    </v-col>
                </v-row>
                <v-divider class="my-5" />

                <div class="text-subtitle-2 mb-1">
                    進階資料（選填）
                </div>
                <p class="text-body-2 text-medium-emphasis mb-3">
                    再填出生時間與出生城市，可以計算人類圖，星座分析也會多一層進階內容。
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
                <v-row>
                    <v-col
                        cols="12"
                        md="7"
                    >
                        <v-select
                            v-model="genderInput"
                            :items="genderItems"
                            label="性別（選填）"
                            hint="只用來決定八字大運的排法"
                            persistent-hint
                        />
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

        <v-card
            class="mb-6"
            variant="outlined"
        >
            <v-card-title>可做的分析</v-card-title>
            <v-card-subtitle class="text-wrap">
                依你填好的資料，這裡列出所有提供的分析。
            </v-card-subtitle>
            <v-card-text>
                <section
                    v-for="system in systems"
                    :key="system.key"
                    class="mb-5"
                >
                    <div class="d-flex align-center ga-2 mb-3">
                        <v-icon
                            :icon="system.icon"
                            color="primary"
                            size="20"
                        />
                        <h3 class="system__title">
                            {{ system.title }}
                        </h3>
                    </div>
                    <v-row>
                        <v-col
                            v-for="analysis in analysesOf(system.key)"
                            :key="analysis.key"
                            cols="12"
                            md="6"
                        >
                            <v-card
                                variant="outlined"
                                height="100%"
                                class="analysis"
                                :class="{ 'analysis--off': !analysis.ready }"
                                :style="{ '--tone': analysis.tone }"
                            >
                                <v-card-text class="d-flex flex-column ga-2 h-100">
                                    <div class="d-flex align-center ga-2">
                                        <span class="analysis__icon">
                                            <v-icon :icon="analysis.ready ? analysis.icon : 'mdi-lock-outline'" />
                                        </span>
                                        <span class="text-subtitle-1 font-weight-medium">{{ analysis.title }}</span>
                                    </div>
                                    <p class="text-body-2 mb-0">
                                        {{ analysis.description }}
                                    </p>
                                    <p class="analysis__need">
                                        <v-icon
                                            icon="mdi-pencil-outline"
                                            size="16"
                                        />
                                        {{ analysis.need }}
                                    </p>
                                    <v-spacer />
                                    <v-btn
                                        :color="analysis.ready ? 'primary' : undefined"
                                        :variant="analysis.ready ? 'flat' : 'tonal'"
                                        :disabled="!analysis.ready"
                                        :prepend-icon="analysis.icon"
                                        :to="analysis.ready ? analysis.to : undefined"
                                        class="align-self-start"
                                    >
                                        {{ analysis.ready ? analysis.action : analysis.lockedHint }}
                                    </v-btn>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </section>
            </v-card-text>
        </v-card>

        <div class="locked mb-6">
            <v-card
                variant="outlined"
                :class="{ 'locked__content': gated }"
                :aria-hidden="gated"
                :inert="gated"
            >
                <v-card-title>從多個角度綜觀自己</v-card-title>
                <v-card-subtitle class="text-wrap">
                    單一角度看到的是一部分。挑選兩個以上的維度放在一起，由 AI 比對它們互相呼應、彼此拉扯的地方，寫成一份只屬於你的完整報告。
                </v-card-subtitle>
                <v-card-text class="d-flex flex-column flex-sm-row align-sm-center ga-3">
                    <div class="d-flex align-center ga-2 flex-grow-1">
                        <v-icon :color="progress.multiDimensionUnlocked ? 'primary' : 'grey'">
                            {{ progress.multiDimensionUnlocked ? 'mdi-layers-outline' : 'mdi-lock-outline' }}
                        </v-icon>
                        <div>
                            <div class="d-flex align-center ga-2">
                                <span class="text-subtitle-1 font-weight-medium">多維度分析</span>
                                <v-chip
                                    size="x-small"
                                    color="warning"
                                    variant="tonal"
                                >
                                    點數
                                </v-chip>
                            </div>
                            <p class="text-body-2 mb-0">
                                自選至少 2 個維度來產生多維度交叉比較分析報告。
                            </p>
                        </div>
                    </div>
                    <v-btn
                        :color="progress.multiDimensionUnlocked ? 'primary' : undefined"
                        :variant="progress.multiDimensionUnlocked ? 'flat' : 'tonal'"
                        :disabled="!progress.multiDimensionUnlocked"
                        :to="progress.multiDimensionUnlocked ? '/report' : undefined"
                        prepend-icon="mdi-circle-multiple-outline"
                        class="align-self-start align-self-sm-center"
                    >
                        {{ progress.multiDimensionUnlocked ? '開始多維度分析' : '先完成 2 個維度' }}
                    </v-btn>
                </v-card-text>
            </v-card>

            <div
                v-if="gated"
                class="locked__cta"
            >
                <v-icon
                    icon="mdi-lock-outline"
                    size="28"
                />
                <p class="locked__title">
                    登入即可解鎖多維度分析
                </p>
                <p class="locked__note">
                    把幾個維度放在一起看，首次登入贈 3 點。
                </p>
                <v-btn
                    to="/login"
                    color="primary"
                    prepend-icon="mdi-login"
                >
                    立即登入
                </v-btn>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    BAZI_ENTRY_ENABLED, ELEMENT_LABELS,
} from '../../shared/constants/bazi';
import {
    TAROT_ENTRY_ENABLED, TAROT_ORIENTATION_LABELS,
} from '../../shared/constants/tarot';
import {
    BLOOD_TYPE_LABELS, GENDER_LABELS, ZODIAC_LABELS,
} from '../../shared/constants/zodiacLabels';
import {
    BLOOD_TYPES, GENDERS,
} from '../../shared/schemas/common';
import type { Zodiac } from '../../shared/schemas/common';
import { HUMAN_DESIGN_TYPE_LABELS } from '../../shared/constants/humanDesignLabels';
import type { HumanDesignResponse } from '../../shared/schemas/api/humanDesign.schema';
import { dayPillarOf } from '../../shared/utils/bazi/dayPillar';
import { stemElement } from '../../shared/utils/bazi/ganzhi';
import { lifePathNumber } from '../../shared/utils/numerology';
import { zodiacFromIsoDate } from '../../shared/utils/zodiac';

useHead({ title: '多維度自我分析' });

const { isAuthenticated, initialized } = useAuth();
const { get } = useApi();
const {
    today: tarotToday, status: tarotStatus, load: loadTarot,
} = useDailyTarot();
const tarotEntryEnabled = TAROT_ENTRY_ENABLED;
const tarotDrawn = computed(() => (tarotToday.value?.drawn ? tarotToday.value : null));

// Only a member's card is asked for; a visitor sees the invitation and no card content.
watch(() => TAROT_ENTRY_ENABLED && initialized.value && isAuthenticated.value, (member) => {
    if (member) void loadTarot();
}, { immediate: true });
/** Multi-dimension analysis is for members: a visitor sees it blurred with a way to sign in */
const gated = computed(() => initialized.value && !isAuthenticated.value);
const {
    state, progress,
} = useExploration();

// What the visitor has entered: the member's saved profile when signed in, otherwise the guest session's.
// Saved a moment after they stop typing, once there is a full date.
const {
    birthDate: birthDateInput,
    bloodType: bloodTypeInput,
    gender: genderInput,
    birthTime: birthTimeInput,
    birthPlace: birthPlaceInput,
    savedNote,
} = useProfile();

const bloodTypeItems = BLOOD_TYPES.map((value) => ({
    title: BLOOD_TYPE_LABELS[value], value,
}));

const genderItems = [
    {
        title: '不提供', value: null,
    },
    ...GENDERS.map((value) => ({
        title: GENDER_LABELS[value], value,
    })),
];

const zodiacSign = computed<Zodiac | null>(() => (birthDateInput.value ? zodiacFromIsoDate(birthDateInput.value) : null));
/** An unknown blood type has nothing to analyse (RULE-002). */
const analysableBloodType = computed(() => (bloodTypeInput.value && bloodTypeInput.value !== 'UNKNOWN' ? bloodTypeInput.value : null));

/** Unlocked once the birth date, time and city are all there: what a birth chart needs. */
const advancedUnlocked = computed(() => Boolean(zodiacSign.value && birthTimeInput.value && birthPlaceInput.value));

type SystemKey = 'symbolic' | 'personality';

type Analysis = {
    key: string;
    system: SystemKey;
    title: string;
    icon: string;
    /** The accent of this analysis */
    tone: string;
    description: string;
    /** What the visitor has to provide */
    need: string;
    action: string;
    /** Shown on the disabled button */
    lockedHint: string;
    /** Whether the data it needs is there */
    ready: boolean;
    /** Where it leads; without one the content is still being planned. */
    to?: string;
};

/** The two ways of getting to know yourself that the app offers, with what each one is for. */
const systems = [
    {
        key: 'symbolic' as const,
        title: '命理與象徵系統',
        icon: 'mdi-star-four-points-outline',
        purpose: '娛樂、文化探索、象徵性解讀',
        items: [
            {
                title: '星座', tone: '#b7791f', text: '出生時太陽所在的位置，看天生的性格傾向與行事風格',
            },
            {
                title: '血型', tone: '#c94f4f', text: '常見的血型性格說法，看與人相處和面對事情的習慣',
            },
            {
                title: '生命靈數', tone: '#7a5aa6', text: '把出生日期化成數字，看天賦傾向與今年的節奏',
            },
            {
                title: '人類圖', tone: '#2e7d5b', text: '依出生當下的星體位置，看能量如何運作、怎樣做決定最順',
            },
            ...(BAZI_ENTRY_ENABLED
                ? [{
                    title: '八字', tone: '#8c5e34', text: '由出生的年、月、日、時排出四柱，看五行的分布與日主的特質',
                }]
                : []),
        ],
    },
    {
        key: 'personality' as const,
        title: '人格與心理特質',
        icon: 'mdi-head-cog-outline',
        purpose: '了解特質傾向與個人差異',
        items: [
            {
                title: 'MBTI', tone: '#2f5d8a', text: '16 型人格，從回答問題的方式看如何獲取能量、接收資訊與做決定',
            },
        ],
    },
];

/** The human design type a member's saved chart has, for the button; guests only know that a chart exists */
const humanDesignType = ref<string | null>(null);

watch(() => [state.value.hasHumanDesign, isAuthenticated.value], async ([has, signedIn]) => {
    humanDesignType.value = null;

    if (!has || !signedIn) return;

    try {
        const chart = await get<HumanDesignResponse>('/api/human-design');

        humanDesignType.value = HUMAN_DESIGN_TYPE_LABELS[chart.type];
    } catch (error) {
        console.error('[home] human design type failed:', error);
    }
}, { immediate: true });

function dayMasterLabel(isoDate: string): string {
    const { stem } = dayPillarOf(isoDate);

    return `${stem}${ELEMENT_LABELS[stemElement(stem)]}日主`;
}

// Every analysis the app offers; the ones whose data is missing stay disabled.
const analyses = computed<Analysis[]>(() => {
    const baziReady = Boolean(zodiacSign.value && birthTimeInput.value);
    // The day stem only needs the date, so the label can be worked out here without calling the server
    const baziDayMaster = baziReady && birthDateInput.value ? dayMasterLabel(birthDateInput.value) : '';
    const sign = zodiacSign.value;
    const bloodType = analysableBloodType.value;
    const mbti = state.value.mbti;

    return [
        {
            key: 'zodiac',
            system: 'symbolic',
            title: '星座分析',
            icon: 'mdi-star-four-points-outline',
            tone: '#b7791f',
            description: '從出生時太陽所在的位置，看你天生的性格傾向與行事風格。',
            need: '需要：出生日期',
            action: sign ? `看星座分析（${ZODIAC_LABELS[sign]}）` : '看星座分析',
            lockedHint: '先填寫出生日期',
            ready: sign !== null,
            to: sign ? `/analysis/zodiac/${sign}` : undefined,
        },
        {
            key: 'blood',
            system: 'symbolic',
            title: '血型分析',
            icon: 'mdi-water-outline',
            tone: '#c94f4f',
            description: '用常見的血型性格說法，看你與人相處和面對事情的習慣。',
            need: '需要：血型',
            action: bloodType ? `看血型分析（${BLOOD_TYPE_LABELS[bloodType]}）` : '看血型分析',
            lockedHint: '先選擇血型',
            ready: bloodType !== null,
            to: bloodType ? `/analysis/blood/${bloodType}` : undefined,
        },
        {
            key: 'numerology',
            system: 'symbolic',
            title: '生命靈數',
            icon: 'mdi-numeric',
            tone: '#7a5aa6',
            description: '把出生日期化成數字，看你的天賦傾向與今年的節奏。',
            need: '需要：出生日期',
            action: birthDateInput.value && sign ? `看生命靈數（數字 ${lifePathNumber(birthDateInput.value)}）` : '看生命靈數',
            lockedHint: '先填寫出生日期',
            ready: sign !== null,
            to: '/analysis/numerology',
        },
        {
            key: 'humanDesign',
            system: 'symbolic',
            title: '人類圖分析',
            icon: 'mdi-vector-triangle',
            tone: '#2e7d5b',
            description: '依出生當下的星體位置，看你的能量怎麼運作、怎樣做決定最順。',
            need: '需要：出生日期、時間與城市',
            action: state.value.hasHumanDesign ? `看人類圖分析（${humanDesignType.value ?? '已計算'}）` : '看人類圖分析',
            lockedHint: '先填寫出生時間與城市',
            ready: advancedUnlocked.value,
            to: '/human-design',
        },
        ...(BAZI_ENTRY_ENABLED
            ? [{
                key: 'bazi',
                system: 'symbolic' as const,
                title: '八字命盤',
                icon: 'mdi-yin-yang',
                tone: '#8c5e34',
                description: '由出生的年、月、日、時排出四柱，看五行的分布、日主的強弱與每十年的節奏。',
                need: '需要：出生日期與時間',
                action: baziReady ? `看八字命盤（${baziDayMaster}）` : '看八字命盤',
                lockedHint: '先填寫出生日期與時間',
                ready: baziReady,
                to: '/bazi',
            }]
            : []),
        {
            key: 'mbti',
            system: 'personality',
            title: 'MBTI 人格分析',
            icon: 'mdi-head-cog-outline',
            tone: '#2f5d8a',
            description: '從回答問題的方式，看你如何獲取能量、接收資訊與做決定。',
            need: mbti ? '需要：16 型人格測驗（已完成）' : '需要：回答 48 題，約 10 分鐘',
            action: mbti ? `看 MBTI 分析（${mbti}）` : '開始測驗',
            lockedHint: '開始測驗',
            // The test is the way in, so it is always open
            ready: true,
            to: mbti ? `/analysis/mbti/${mbti}` : '/test',
        },
    ];
});

function analysesOf(system: SystemKey): Analysis[] {
    return analyses.value.filter((analysis) => analysis.system === system);
}
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

/*
 * The sign-in call to action reads like a ticket: the button is the stub, a dashed
 * perforation separates it from what signing in gives you, and the welcome points sit on the end.
 */
.locked {
    position: relative;
}

/* Room for the sign-in prompt over the blurred card */
.locked:has(.locked__cta) {
    min-height: 240px;
}

.locked:has(.locked__cta) > .v-card {
    height: 100%;
    min-height: 240px;
}

.locked__content {
    filter: blur(5px);
    opacity: 0.7;
    pointer-events: none;
    user-select: none;
}

.locked__cta {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 16px;
    border-radius: 4px;
    text-align: center;
    background: rgba(244, 246, 249, 0.45);
}

.locked__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
}

.locked__note {
    max-width: 28em;
    margin: 0 0 8px;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
}

.pass {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    width: fit-content;
    max-width: 100%;
    margin-top: 18px;
    border: 1px solid rgba(47, 93, 138, 0.18);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 6px 22px rgba(47, 93, 138, 0.12);
    backdrop-filter: blur(6px);
}

.pass__btn {
    margin: 8px;
    letter-spacing: 0.12em;
    box-shadow: 0 4px 12px rgba(47, 93, 138, 0.35);
}

.pass__arrow {
    transition: transform 0.2s;
}

.pass__btn:hover .pass__arrow,
.pass__btn:focus-visible .pass__arrow {
    transform: translateX(4px);
}

.pass__perks {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    margin: 8px 0;
    padding: 0 20px;
    border-left: 2px dashed rgba(47, 93, 138, 0.25);
    list-style: none;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.78);
}

.pass__perks li {
    display: flex;
    align-items: center;
    gap: 6px;
}

.pass__perks .v-icon {
    color: rgb(var(--v-theme-success));
}

.pass__coin {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 18px 0 4px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #8a5a12;
}

.pass__coin-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #f6d98a, #d9a441);
    box-shadow: inset 0 0 0 2px rgba(138, 90, 18, 0.35);
    font-size: 0.8125rem;
    font-weight: 700;
    color: #6b4509;
}

/* On a narrow screen the pieces stack, so the perforation turns horizontal */
@media (max-width: 599px) {
    .pass {
        width: 100%;
        flex-direction: column;
    }

    .pass__btn {
        margin: 8px 8px 0;
    }

    .pass__perks {
        margin: 8px 8px 0;
        padding: 12px 8px 0;
        border-top: 2px dashed rgba(47, 93, 138, 0.25);
        border-left: 0;
    }

    .pass__coin {
        padding: 8px 12px 12px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .pass__arrow {
        transition: none;
    }
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

.angles {
    border-color: rgba(0, 0, 0, 0.12);
}

.system + .system {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.system__title {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
}

.system__head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.system__purpose {
    margin: 2px 0 12px 32px;
    font-size: 0.875rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

/* One row per system, at most five small cards across */
.system__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

@media (min-width: 600px) {
    .system__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 960px) {
    .system__grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }
}

.angle {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    border-top: 3px solid var(--tone);
    border-radius: 8px;
    background: color-mix(in srgb, var(--tone) 7%, rgb(var(--v-theme-surface)));
}

.angle__title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--tone);
}

.angle__text {
    font-size: 0.8125rem;
    line-height: 1.6;
    color: rgba(var(--v-theme-on-surface), 0.75);
}

/* An analysis card: lit in its own color when its data is there, quiet when it is not. */
.analysis {
    border-color: rgba(0, 0, 0, 0.12);
    border-left: 4px solid var(--tone);
}

.analysis--off {
    border-left-color: rgba(var(--v-theme-on-surface), 0.15);
    opacity: 0.75;
}

.analysis__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 12%, white);
}

.analysis--off .analysis__icon {
    color: rgba(var(--v-theme-on-surface), 0.5);
    background: rgba(var(--v-theme-on-surface), 0.06);
}

.analysis__need {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.6);
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
