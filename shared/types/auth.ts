/**
 * Verified Firebase ID token claims we rely on.
 */
export type AuthTokenPayload = {
    uid: string;
    email?: string;
    email_verified?: boolean;
    /**
     * Stable Google account id (token claim firebase.identities['google.com']).
     * Unlike uid it survives deleting and recreating the Firebase Auth user,
     * so the welcome-grant ledger keys on it.
     */
    googleSub?: string;
};
