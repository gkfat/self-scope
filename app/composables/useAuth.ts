import {
    type Auth,
    type User,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import type { LoginResponse } from '../../shared/schemas/api/auth.schema';

type AuthState = {
    user: User | null;
    idToken: string | null;
    loading: boolean;
    error: string | null;
    initialized: boolean;
};

/** Points the server granted at this sign-in (first login only); the layout shows it once, then resets it. */
const welcomePoints = ref(0);

const authState = ref<AuthState>({
    user: null,
    idToken: null,
    loading: true,
    error: null,
    initialized: false,
});

let unsubscribe: (() => void) | null = null;

function hasCode(error: unknown): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error;
}

function hasStatus(error: unknown): error is { statusCode: number; data?: { message?: string } } {
    return typeof error === 'object' && error !== null && 'statusCode' in error;
}

function describeSignInError(error: unknown): string {
    if (hasCode(error)) {
        if (error.code === 'auth/popup-closed-by-user') return '登入視窗已關閉';
        if (error.code === 'auth/popup-blocked') return '瀏覽器阻擋了彈出視窗，請允許彈出視窗後重試';
        if (error.code === 'auth/cancelled-popup-request') return '登入請求已取消';
    }

    if (hasStatus(error)) {
        if (error.statusCode === 401) return '認證失敗，請重新登入';
        if (error.statusCode >= 500) return '伺服器錯誤，請稍後再試';
        if (error.data?.message) return error.data.message;
    }

    return error instanceof Error ? error.message : '登入失敗，請稍後再試';
}

/**
 * Firebase Authentication composable (Google sign-in).
 * Guests can use the app without signing in; saving results requires it.
 */
export const useAuth = () => {
    const { $firebaseAuth } = useNuxtApp();
    const auth = $firebaseAuth as Auth | undefined;

    const initAuthListener = () => {
        if (!auth) {
            console.error('[useAuth] Firebase Auth not initialized');
            authState.value.loading = false;
            authState.value.initialized = true;
            return;
        }

        if (unsubscribe) return;

        unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                authState.value.user = user;
                authState.value.loading = false;
                authState.value.initialized = true;

                if (!user) {
                    authState.value.idToken = null;
                    return;
                }

                try {
                    authState.value.idToken = await user.getIdToken();
                } catch (error) {
                    console.error('[useAuth] Failed to get ID token:', error);
                    authState.value.error = '無法取得認證憑證';
                }
            },
            (error) => {
                console.error('[useAuth] Auth state change error:', error);
                authState.value.error = '認證狀態檢查失敗';
                authState.value.loading = false;
                authState.value.initialized = true;
            },
        );
    };

    const signInWithGoogle = async (): Promise<boolean> => {
        if (!auth) {
            authState.value.error = 'Firebase 未正確初始化';
            return false;
        }

        authState.value.loading = true;
        authState.value.error = null;

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const { user } = await signInWithPopup(auth, provider);
            const idToken = await user.getIdToken();

            const login = await $fetch<LoginResponse>('/api/auth/login', {
                method: 'POST',
                body: { idToken },
            });

            welcomePoints.value = login.welcomePointsGranted;

            authState.value.idToken = idToken;
            return true;
        } catch (error) {
            console.error('[useAuth] Google sign in failed:', error);

            // Keep Firebase and the server consistent: sign out when the server login failed.
            try {
                await firebaseSignOut(auth);
            } catch (signOutError) {
                console.error('[useAuth] Failed to sign out after error:', signOutError);
            }

            authState.value.error = describeSignInError(error);
            return false;
        } finally {
            authState.value.loading = false;
        }
    };

    const signOut = async (): Promise<void> => {
        if (!auth) return;

        authState.value.loading = true;
        authState.value.error = null;

        try {
            await firebaseSignOut(auth);
            authState.value.user = null;
            authState.value.idToken = null;
        } catch (error) {
            console.error('[useAuth] Sign out failed:', error);
            authState.value.error = '登出失敗';
        } finally {
            authState.value.loading = false;
        }
    };

    /**
     * Force-refresh the ID token (used after a 401).
     */
    const refreshToken = async (): Promise<string | null> => {
        if (!authState.value.user) return null;

        try {
            const token = await authState.value.user.getIdToken(true);
            authState.value.idToken = token;
            return token;
        } catch (error) {
            console.error('[useAuth] Token refresh failed:', error);
            return null;
        }
    };

    const clearError = () => {
        authState.value.error = null;
    };

    return {
        user: computed(() => authState.value.user),
        idToken: computed(() => authState.value.idToken),
        loading: computed(() => authState.value.loading),
        error: computed(() => authState.value.error),
        initialized: computed(() => authState.value.initialized),
        isAuthenticated: computed(() => !!authState.value.user && !!authState.value.idToken),

        welcomePoints: computed(() => welcomePoints.value),
        dismissWelcome: () => {
            welcomePoints.value = 0;
        },
        signInWithGoogle,
        signOut,
        refreshToken,
        clearError,
        initAuthListener,
    };
};
