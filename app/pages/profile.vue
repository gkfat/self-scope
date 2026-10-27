<template>
    <div>
        <h1 class="text-h5 mb-4">
            我的資料
        </h1>

        <v-card class="mb-4">
            <v-card-title>出生日期</v-card-title>
            <v-card-text>
                <ProfileBirthDateSelect v-model="form.birthDate" />
                <p class="mt-3 text-body-2">
                    星座：<strong>{{ zodiacText }}</strong>
                </p>
            </v-card-text>
        </v-card>

        <v-card class="mb-4">
            <v-card-title>血型與性別</v-card-title>
            <v-card-text>
                <v-row>
                    <v-col
                        cols="12"
                        md="6"
                    >
                        <v-select
                            v-model="form.bloodType"
                            :items="bloodTypeItems"
                            label="血型"
                            persistent-hint
                        />
                    </v-col>
                    <v-col
                        cols="12"
                        md="6"
                    >
                        <v-select
                            v-model="form.gender"
                            :items="genderItems"
                            label="性別（選填）"
                            hint="只用來決定八字大運的排法"
                            persistent-hint
                        />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-card class="mb-4">
            <v-card-title>人類圖用的資料</v-card-title>
            <v-card-text>
                <v-switch
                    v-model="withTimeAndPlace"
                    label="我知道出生時間與地點"
                    color="primary"
                    hide-details
                    class="mb-2"
                />
                <p
                    v-if="!withTimeAndPlace"
                    class="text-body-2 text-medium-emphasis"
                >
                    沒有出生時間與地點時，仍可使用星座、血型、MBTI 與合成分析，只是無法計算人類圖。
                </p>
                <template v-else>
                    <ProfileBirthTimeSelect
                        v-model="form.birthTime"
                        hint="請填醫院或戶政紀錄上的當地時間，差幾分鐘也可能改變結果"
                        class="mb-4"
                    />
                    <ProfileCitySelect
                        v-model="form.birthPlace"
                        label="出生地點"
                        hint="輸入中文或英文即可搜尋；找不到時請選同時區的鄰近城市"
                    />
                </template>
            </v-card-text>
        </v-card>

        <v-alert
            v-if="problem"
            type="error"
            variant="tonal"
            class="mb-4"
        >
            {{ problem }}
        </v-alert>

        <div class="d-flex align-center ga-3">
            <v-btn
                color="primary"
                size="large"
                :loading="saving"
                :disabled="!canSave"
                @click="save"
            >
                儲存資料
            </v-btn>
        </div>

        <v-snackbar
            v-model="saved"
            color="success"
        >
            已儲存。{{ isAuthenticated ? '資料保存在你的帳號。' : '登入後才會長期保存。' }}
        </v-snackbar>
    </div>
</template>

<script lang="ts" setup>
import {
    BLOOD_TYPE_LABELS, GENDER_LABELS, ZODIAC_LABELS,
} from '../../shared/constants/zodiacLabels';
import {
    BLOOD_TYPES, GENDERS, type Gender,
} from '../../shared/schemas/common';
import { zodiacFromIsoDate } from '../../shared/utils/zodiac';

useHead({ title: '我的資料' });

// The same starting point as the human design screen, so a first visit is never an empty form.
const DEFAULT_BIRTH_DATE = '1990-01-01';
const DEFAULT_BIRTH_TIME = '12:00';
const DEFAULT_BIRTH_PLACE = 'tw-taipei';

const {
    isAuthenticated, initAuthListener,
} = useAuth();
const {
    state, revision, save: saveProfile,
} = useExploration();

const form = reactive({
    birthDate: DEFAULT_BIRTH_DATE,
    birthTime: DEFAULT_BIRTH_TIME,
    birthPlace: DEFAULT_BIRTH_PLACE as string | null,
    bloodType: 'UNKNOWN' as (typeof BLOOD_TYPES)[number],
    gender: null as Gender | null,
});
const withTimeAndPlace = ref(false);
const saving = ref(false);
const saved = ref(false);
const problem = ref<string | null>(null);

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

const zodiacText = computed(() => (form.birthDate ? ZODIAC_LABELS[zodiacFromIsoDate(form.birthDate)] : '請選擇出生日期'));
const canSave = computed(() => form.birthDate !== '' && (!withTimeAndPlace.value || (form.birthTime !== '' && form.birthPlace !== null)));

/** Fill the form from what is already saved; stay on the defaults when nothing is. */
function fillFromSaved() {
    const birth = state.value.birthData;

    form.bloodType = state.value.bloodType;
    form.gender = state.value.gender;

    if (!birth) return;

    form.birthDate = birth.birthDate;
    withTimeAndPlace.value = Boolean(birth.birthTime && birth.birthPlace);
    form.birthTime = birth.birthTime ?? DEFAULT_BIRTH_TIME;
    form.birthPlace = birth.birthPlace ?? DEFAULT_BIRTH_PLACE;
}

async function save() {
    saving.value = true;
    problem.value = null;

    try {
        await saveProfile({
            birthDate: form.birthDate,
            birthTime: withTimeAndPlace.value ? form.birthTime : '',
            birthPlace: withTimeAndPlace.value ? form.birthPlace : null,
            bloodType: form.bloodType,
            gender: form.gender,
        });
        saved.value = true;
    } catch (error) {
        console.error('[profile] save failed:', error);
        problem.value = '儲存失敗，請檢查出生日期與地點後再試一次。';
    } finally {
        saving.value = false;
    }
}

onMounted(() => {
    initAuthListener();
});

// The saved data may arrive after the page opens (sign-in state and the request resolve asynchronously), and
// `loaded` is already true once the visitor's data has come in, so refill each time a load lands instead.
watch(revision, () => {
    if (state.value.loaded) fillFromSaved();
}, { immediate: true });
</script>
