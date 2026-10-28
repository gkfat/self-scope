import type { z } from 'zod';
import type { fixedContentBodySchema } from '../../schemas/firestore/fixedContent.schema';
import type { ReportInterpretation } from '../types';

export type FixedContentBody = z.infer<typeof fixedContentBodySchema>;

/**
 * What a reviewed fixed reading says, as the report's readings of a fact: the headline, the strengths and the blind
 * spots, and the readings of love, work and communication when the content has them. The words are the reviewed ones,
 * joined and never reworded.
 */
export function readingsOfBody(body: FixedContentBody, term?: string): ReportInterpretation[] {
    const reading = (title: string, text: string): ReportInterpretation[] => (text.trim() ? [
        {
            title, text, ...(term ? { term } : {}),
        },
    ] : []);

    return [
        ...reading(body.title, body.summary),
        ...reading('可能的優勢', body.strengths.join('；')),
        ...reading('可能的盲點', body.blindSpots.join('；')),
        ...reading('感情與關係', body.loveStyle),
        ...reading('工作與決策', body.workStyle),
        ...reading('溝通方式', body.communicationStyle),
    ];
}

/** The reviewed advice of a fixed reading, and the one thing to try this week when it has one. */
export function adviceOfBody(body: FixedContentBody): string[] {
    return [...(body.growthAdvice.trim() ? [body.growthAdvice] : []), ...(body.growthPractice ? [`這週可以試試：${body.growthPractice.weeklyPractice}`] : [])];
}
