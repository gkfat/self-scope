import { z } from 'zod';

export const loginRequestSchema = z.object({ idToken: z.string().min(1) });

export const loginResponseSchema = z.object({
    userId: z.string(),
    email: z.string(),
    isNewUser: z.boolean(),
    welcomePointsGranted: z.number().int().nonnegative(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
