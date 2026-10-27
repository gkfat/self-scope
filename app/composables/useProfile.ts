import type {
    BloodType, Gender,
} from '../../shared/schemas/common';

const AUTOSAVE_DELAY_MS = 800;

/**
 * The birth-details form on the home screen. It is filled in from what was saved earlier: the member's
 * account when signed in, otherwise the guest session. It is saved back a moment after the visitor stops
 * typing, once there is a full date.
 *
 * The data itself comes from `useExploration`; this holds only the form and keeps it in step with it.
 */
export const useProfile = () => {
    const { isAuthenticated } = useAuth();
    const {
        state, revision, save,
    } = useExploration();

    const birthDate = ref('');
    const bloodType = ref<BloodType | null>(null);
    const birthTime = ref('');
    const birthPlace = ref<string | null>(null);
    const gender = ref<Gender | null>(null);
    const savedNote = ref('');

    let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
    // Filling the inputs from what was saved earlier is not an edit and must not be saved back.
    let hydrating = false;

    function cancelAutosave() {
        if (!autosaveTimer) return;

        clearTimeout(autosaveTimer);
        autosaveTimer = null;
    }

    async function saveEntered() {
        autosaveTimer = null;

        if (!birthDate.value) return;

        try {
            await save({
                birthDate: birthDate.value,
                birthTime: birthTime.value,
                birthPlace: birthPlace.value,
                bloodType: bloodType.value ?? 'UNKNOWN',
                gender: gender.value,
            });
            savedNote.value = isAuthenticated.value ? '已存到你的帳號。' : '已暫存 1 天，登入後可以長期保存。';
        } catch (error) {
            console.error('[useProfile] autosave failed:', error);
            savedNote.value = '這次沒有存起來，分析仍可查看。';
        }
    }

    async function hydrate() {
        if (!state.value.loaded) return;

        // Anything still waiting to be saved was typed for whoever was looking before; it must not land on this one.
        cancelAutosave();
        hydrating = true;
        birthDate.value = state.value.birthData?.birthDate ?? '';
        bloodType.value = state.value.bloodType === 'UNKNOWN' ? null : state.value.bloodType;
        birthTime.value = state.value.birthData?.birthTime ?? '';
        birthPlace.value = state.value.birthData?.birthPlace ?? null;
        gender.value = state.value.gender;
        savedNote.value = '';
        await nextTick();
        hydrating = false;
    }

    watch([
        birthDate,
        bloodType,
        birthTime,
        birthPlace,
        gender,
    ], () => {
        if (hydrating) return;

        cancelAutosave();
        autosaveTimer = setTimeout(saveEntered, AUTOSAVE_DELAY_MS);
    });

    // Fill in when the page opens with the data already there, and again each time a load lands. `loaded` is
    // not enough: it is already true after the first (visitor) load, so a member's data arriving later would be missed.
    watch(revision, hydrate, { immediate: true });

    onBeforeUnmount(cancelAutosave);

    return {
        birthDate,
        bloodType,
        birthTime,
        birthPlace,
        gender,
        savedNote,
    };
};
