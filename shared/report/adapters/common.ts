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

/** The four parts of the practice of a reading, as they have always been called on the pages that show a reading. */
export const PRACTICE_LABELS = {
    habit: '一個值得觀察的習慣',
    behavior: '一個可以嘗試改變的行為',
    reflection: '一個自我反思問題',
    weekly: '本週就能完成的小練習',
} as const;

/**
 * The reviewed advice of a fixed reading: the advice itself, then (when it has one) the four parts of its practice, each
 * under its label.
 */
export function adviceOfBody(body: FixedContentBody): string[] {
    const practice = body.growthPractice;

    return [
        ...(body.growthAdvice.trim() ? [body.growthAdvice] : []), ...(practice ? [
            `${PRACTICE_LABELS.habit}：${practice.habitToObserve}`,
            `${PRACTICE_LABELS.behavior}：${practice.behaviorToTry}`,
            `${PRACTICE_LABELS.reflection}：${practice.reflectionQuestion}`,
            `${PRACTICE_LABELS.weekly}：${practice.weeklyPractice}`,
        ] : []),
    ];
}
