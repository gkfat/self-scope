import { z } from 'zod';
import {
    bloodTypeSchema, epochMsSchema, mbtiTypeSchema,
} from '../common';
import { birthDataSchema } from '../api/profile.schema';

/** users/{uid} */
export const userDocSchema = z.object({
    email: z.string(),
    /** Absent until the user fills in the profile. */
    birthData: birthDataSchema.nullable(),
    bloodType: bloodTypeSchema,
    mbti: mbtiTypeSchema.nullable(),
    /** MBTI expires 3 months after it was set (RULE-014); cleared by the expiry job. */
    mbtiExpiresAt: epochMsSchema.nullable(),
    createdAt: epochMsSchema,
    updatedAt: epochMsSchema,
});

export type UserDoc = z.infer<typeof userDocSchema>;
