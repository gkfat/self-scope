import { z } from 'zod';
import { epochMsSchema } from '../common';
import { profileInputSchema } from '../api/profile.schema';
import { guestHumanDesignSchema } from './humanDesign.schema';
import { testResultSchema } from './testAttempt.schema';

/** 24 random bytes, base64url (192 bit). The id is the only credential for a guest session. */
export const GUEST_SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{32}$/;
export const guestSessionIdSchema = z.string().regex(GUEST_SESSION_ID_PATTERN);

export const GUEST_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export const guestTempResultsSchema = z.object({
    test: testResultSchema.nullable().default(null),
    /** Filled by the human-design capability. */
    humanDesign: guestHumanDesignSchema.nullable().default(null),
});

/** guestSessions/{sessionId}. expiresAt is a Date so Firestore TTL can clear it. */
export const guestSessionDocSchema = z.object({
    createdAt: epochMsSchema,
    expiresAt: z.date(),
    tempProfile: profileInputSchema.nullable(),
    tempResults: guestTempResultsSchema.nullable(),
    /** Set once the session was claimed; the temporary data is cleared at the same time. */
    claimedBy: z.string().nullable(),
    claimedAt: epochMsSchema.nullable(),
    savedAttempts: z.number().int().nonnegative(),
});

export type GuestTempResults = z.infer<typeof guestTempResultsSchema>;
export type GuestSessionDoc = z.infer<typeof guestSessionDocSchema>;
