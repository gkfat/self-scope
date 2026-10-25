import { z } from 'zod';
import { guestSessionIdSchema } from '../firestore/guestSession.schema';

export const createGuestSessionResponseSchema = z.object({
    sessionId: guestSessionIdSchema,
    expiresAt: z.string(),
});

export const claimGuestSessionResponseSchema = z.object({ savedAttempts: z.number().int().nonnegative() });

export type CreateGuestSessionResponse = z.infer<typeof createGuestSessionResponseSchema>;
export type ClaimGuestSessionResponse = z.infer<typeof claimGuestSessionResponseSchema>;
