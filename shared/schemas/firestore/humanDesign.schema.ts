import { z } from 'zod';
import { CENTERS } from '../../constants/humanDesign';
import { epochMsSchema } from '../common';

export const humanDesignTypeSchema = z.enum([
    'MANIFESTOR',
    'GENERATOR',
    'MANIFESTING_GENERATOR',
    'PROJECTOR',
    'REFLECTOR',
]);

export const humanDesignAuthoritySchema = z.enum([
    'EMOTIONAL',
    'SACRAL',
    'SPLENIC',
    'EGO',
    'SELF_PROJECTED',
    'MENTAL',
    'LUNAR',
]);

export const humanDesignStrategySchema = z.enum([
    'INFORM',
    'RESPOND',
    'WAIT_FOR_INVITATION',
    'WAIT_A_LUNAR_CYCLE',
]);

export const humanDesignDefinitionSchema = z.enum([
    'NONE',
    'SINGLE',
    'SPLIT',
    'TRIPLE_SPLIT',
    'QUADRUPLE_SPLIT',
]);

export const humanDesignBodySchema = z.enum([
    'SUN',
    'EARTH',
    'MOON',
    'NORTH_NODE',
    'SOUTH_NODE',
    'MERCURY',
    'VENUS',
    'MARS',
    'JUPITER',
    'SATURN',
    'URANUS',
    'NEPTUNE',
    'PLUTO',
]);

export const humanDesignActivationSchema = z.object({
    body: humanDesignBodySchema,
    gate: z.number().int().min(1).max(64),
    line: z.number().int().min(1).max(6),
});

export const incarnationCrossAngleSchema = z.enum([
    'RIGHT_ANGLE',
    'JUXTAPOSITION',
    'LEFT_ANGLE',
]);

/** The four gates of the cross: Personality Sun/Earth, then Design Sun/Earth (e.g. 63/64 | 5/35). */
export const incarnationCrossSchema = z.object({
    angle: incarnationCrossAngleSchema,
    gates: z.tuple([
        z.number().int().min(1).max(64),
        z.number().int().min(1).max(64),
        z.number().int().min(1).max(64),
        z.number().int().min(1).max(64),
    ]),
});

export const humanDesignResultSchema = z.object({
    type: humanDesignTypeSchema,
    strategy: humanDesignStrategySchema,
    authority: humanDesignAuthoritySchema,
    /** e.g. "1/3": the Personality Sun line over the Design Sun line. */
    profile: z.string().regex(/^[1-6]\/[1-6]$/),
    definition: humanDesignDefinitionSchema,
    incarnationCross: incarnationCrossSchema,
    definedCenters: z.array(z.enum(CENTERS)),
    channels: z.array(z.tuple([z.number().int(), z.number().int()])),
    /** Gates activated at birth (conscious). */
    personality: z.array(humanDesignActivationSchema),
    /** Gates activated 88° of solar arc before birth (unconscious). */
    design: z.array(humanDesignActivationSchema),
});

/** A guest's result, kept in the session until the guest signs in (or the session expires). */
export const guestHumanDesignSchema = z.object({
    result: humanDesignResultSchema,
    inputDigest: z.string(),
    calculatedAt: epochMsSchema,
});

/**
 * users/{uid}/humanDesign/main — only digests are kept, never the raw time and place.
 * `inputDigest` is what the chart was calculated from; `profileDigest` is the member's saved birth data
 * at that moment (null when it was incomplete), so a later profile change is noticed.
 */
export const humanDesignDocSchema = z.object({
    result: humanDesignResultSchema,
    inputDigest: z.string(),
    profileDigest: z.string().nullable().default(null),
    calculatedAt: epochMsSchema,
    expiresAt: epochMsSchema,
});

export type IncarnationCross = z.infer<typeof incarnationCrossSchema>;
export type HumanDesignResult = z.infer<typeof humanDesignResultSchema>;
export type HumanDesignActivation = z.infer<typeof humanDesignActivationSchema>;
export type HumanDesignBody = z.infer<typeof humanDesignBodySchema>;
export type GuestHumanDesign = z.infer<typeof guestHumanDesignSchema>;
export type HumanDesignDoc = z.infer<typeof humanDesignDocSchema>;
