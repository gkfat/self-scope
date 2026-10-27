import { z } from 'zod';
import { epochMsSchema } from '../common';
import { kinSchema } from '../api/mayaKin.schema';

/** users/{uid}/kinUnlocks/{YYYY-MM-DD}: that a member has unlocked the Kin of one Taipei day. */
export const kinUnlockDocSchema = z.object({
    /** The day's Kin, as it was when unlocked */
    kin: kinSchema,
    unlockedAt: epochMsSchema,
    expiresAt: epochMsSchema,
});

export type KinUnlockDoc = z.infer<typeof kinUnlockDocSchema>;
