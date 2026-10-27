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

function emptyState(): ExplorationState {
    return {
        loaded: true,
        birthData: null,
        bloodType: 'UNKNOWN',
        gender: null,
        mbti: null,
        hasHumanDesign: false,
    };
}

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
        ...emptyState(),
        loaded: false,
    }));
    /** Which load is the latest; an older one finishing late must not overwrite a newer answer. */
    const loadSeq = useState<number>('explorationLoadSeq', () => 0);
    /** Goes up each time a `load()` result lands, so a form can refill itself even though `loaded` stays true. */
    const revision = useState<number>('explorationRevision', () => 0);
    const hydratePending = useState<boolean>('explorationHydratePending', () => false);
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
        state.value = emptyState();
    };

    async function loadMember(): Promise<ExplorationState> {
        const profile = await get<ProfileResponse>('/api/profile');
        let hasHumanDesign = false;

        try {
            await get('/api/human-design');
            hasHumanDesign = true;
        } catch (error) {
            // 404 only means no chart yet.
            if (statusOf(error) !== 404) console.error('[useExploration] human design check failed:', error);
        }

        return {
            loaded: true,
            birthData: profile.birthData,
            bloodType: profile.bloodType,
            gender: profile.gender,
            mbti: profile.mbti,
            hasHumanDesign,
        };
    }

    async function loadGuest(): Promise<ExplorationState> {
        // After a page reload the id is only in sessionStorage until it is read back.
        restore();

        if (!sessionId.value) return emptyState();

        try {
            const profile = await get<GuestProfileResponse>(`/api/guest-sessions/${sessionId.value}/profile`, {}, 'optional');

            return {
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

                return emptyState();
            }

            throw error;
        }
    }

    /**
     * Read the current visitor's data into the shared state. Loads can overlap (sign-in changes who is looking
     * while an earlier request is still out), so only the latest one may write: a slower, older answer is dropped.
     */
    async function refresh(): Promise<void> {
        const seq = ++loadSeq.value;

        try {
            const next = isAuthenticated.value ? await loadMember() : await loadGuest();

            if (seq !== loadSeq.value) return;

            state.value = next;

            // The form screens fill themselves from the state when this number changes.
            if (hydratePending.value) {
                hydratePending.value = false;
                revision.value += 1;
            }
        } catch (error) {
            console.error('[useExploration] failed to load:', error);

            if (seq === loadSeq.value) state.value.loaded = true;
        }
    }

    /** Load for whoever is looking now; screens showing a form refill it from the result. */
    const load = async (): Promise<void> => {
        hydratePending.value = true;
        await refresh();
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

        // Refresh without refilling any form: what was just saved came from the form, and the visitor may have typed more since.
        await refresh();
    };

    return {
        state: computed(() => state.value),
        revision: computed(() => revision.value),
        facts,
        progress,
        load,
        save,
        reset,
    };
};
