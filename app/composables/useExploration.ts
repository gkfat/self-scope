import type {
    BirthData, ProfileInput, ProfileResponse,
} from '../../shared/schemas/api/profile.schema';
import type { GuestProfileResponse } from '../../shared/schemas/api/guest.schema';
import type {
    BloodType, Gender,
} from '../../shared/schemas/common';
import {
    explorationProgress, type ExplorationFacts,
} from '../../shared/utils/explorationProgress';
import { zodiacFromIsoDate } from '../../shared/utils/zodiac';

export type ProfileForm = {
    birthDate: string;
    /** HH:mm, empty when unknown */
    birthTime: string;
    birthPlace: string | null;
    bloodType: BloodType;
    /** Optional; only the BaZi luck cycles use it */
    gender: Gender | null;
};

type ExplorationState = {
    loaded: boolean;
    birthData: BirthData | null;
    bloodType: BloodType;
    gender: Gender | null;
    mbti: string | null;
    hasHumanDesign: boolean;
};

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    const candidate = error as { statusCode?: number; status?: number };

    return candidate.statusCode ?? candidate.status;
}

/**
 * What the visitor has entered so far, from the member's account or the guest session, and how far along
 * the four free layers they are. One place for every screen to read it from.
 */
export const useExploration = () => {
    const state = useState<ExplorationState>('exploration', () => ({
        loaded: false,
        birthData: null,
        bloodType: 'UNKNOWN',
        gender: null,
        mbti: null,
        hasHumanDesign: false,
    }));
    const { isAuthenticated } = useAuth();
    const {
        get, put, post,
    } = useApi();
    const {
        sessionId, restore, ensureSession, forget,
    } = useGuestSession();

    const facts = computed<ExplorationFacts>(() => ({
        birthDate: state.value.birthData?.birthDate ?? null,
        birthTime: state.value.birthData?.birthTime ?? null,
        bloodType: state.value.bloodType,
        mbti: state.value.mbti,
        hasHumanDesign: state.value.hasHumanDesign,
    }));
    const progress = computed(() => explorationProgress(facts.value));

    const reset = () => {
        state.value = {
            loaded: true,
            birthData: null,
            bloodType: 'UNKNOWN',
            gender: null,
            mbti: null,
            hasHumanDesign: false,
        };
    };

    async function loadMember() {
        const profile = await get<ProfileResponse>('/api/profile');
        let hasHumanDesign = false;

        try {
            await get('/api/human-design');
            hasHumanDesign = true;
        } catch (error) {
            // 404 only means no chart yet.
            if (statusOf(error) !== 404) console.error('[useExploration] human design check failed:', error);
        }

        state.value = {
            loaded: true,
            birthData: profile.birthData,
            bloodType: profile.bloodType,
            gender: profile.gender,
            mbti: profile.mbti,
            hasHumanDesign,
        };
    }

    async function loadGuest() {
        // After a page reload the id is only in sessionStorage until it is read back.
        restore();

        if (!sessionId.value) {
            reset();

            return;
        }

        try {
            const profile = await get<GuestProfileResponse>(`/api/guest-sessions/${sessionId.value}/profile`, {}, 'optional');

            state.value = {
                loaded: true,
                birthData: profile.birthData,
                bloodType: profile.bloodType,
                gender: profile.gender,
                mbti: profile.mbti,
                hasHumanDesign: profile.hasHumanDesign,
            };
        } catch (error) {
            // An expired session is gone: start over without it.
            if (statusOf(error) === 404) {
                forget();
                reset();

                return;
            }

            throw error;
        }
    }

    const load = async (): Promise<void> => {
        try {
            if (isAuthenticated.value) {
                await loadMember();
            } else {
                await loadGuest();
            }
        } catch (error) {
            console.error('[useExploration] failed to load:', error);
            state.value.loaded = true;
        }
    };

    /** Save the profile form for the member, or for the guest's session. */
    const save = async (form: ProfileForm): Promise<void> => {
        const body: ProfileInput = {
            birthData: {
                birthDate: form.birthDate,
                zodiac: zodiacFromIsoDate(form.birthDate),
                birthTime: form.birthTime || null,
                birthPlace: form.birthPlace,
            },
            bloodType: form.bloodType,
            gender: form.gender,
        };

        if (isAuthenticated.value) {
            await put('/api/profile', body);
        } else {
            const id = await ensureSession();

            await put(`/api/guest-sessions/${id}/profile`, body, {}, 'optional');
        }

        // Time and place are all a chart needs, so it is ready as soon as they are saved.
        if (form.birthTime && form.birthPlace) {
            try {
                await post('/api/human-design/calculations', {
                    birthDate: form.birthDate,
                    birthTime: form.birthTime,
                    birthPlace: form.birthPlace,
                }, {}, isAuthenticated.value ? 'required' : 'optional');
            } catch (error) {
                // The profile is already saved; the human design page can retry the calculation.
                console.error('[useExploration] human design calculation failed:', error);
            }
        }

        await load();
    };

    return {
        state: computed(() => state.value),
        facts,
        progress,
        load,
        save,
        reset,
    };
};
