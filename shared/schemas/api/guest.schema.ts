import { z } from 'zod';
import {
    bloodTypeSchema, mbtiTypeSchema, 
} from '../common';
import { guestSessionIdSchema } from '../firestore/guestSession.schema';
import { birthDataSchema } from './profile.schema';

export const createGuestSessionResponseSchema = z.object({
    sessionId: guestSessionIdSchema,
    expiresAt: z.string(),
});

export const claimGuestSessionResponseSchema = z.object({ savedAttempts: z.number().int().nonnegative() });

/** What a guest has entered so far, so the profile and progress screens can show it again. */
export const guestProfileResponseSchema = z.object({
    birthData: birthDataSchema.nullable(),
    bloodType: bloodTypeSchema,
    /** From the guest's test result, or the type they entered themselves */
    mbti: mbtiTypeSchema.nullable(),
    hasHumanDesign: z.boolean(),
});

export type GuestProfileResponse = z.infer<typeof guestProfileResponseSchema>;
export type CreateGuestSessionResponse = z.infer<typeof createGuestSessionResponseSchema>;
export type ClaimGuestSessionResponse = z.infer<typeof claimGuestSessionResponseSchema>;
