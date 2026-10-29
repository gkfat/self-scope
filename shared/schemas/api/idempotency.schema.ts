import { z } from 'zod';

/** The Idempotency-Key header of a request that charges points: the same key never charges or makes anything twice. */
export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
