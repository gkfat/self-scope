import type { HumanDesignResult } from '../../shared/schemas/firestore/humanDesign.schema';

type WithResult = { result: HumanDesignResult };

/** The same entry with its channels written as "a-b" strings, which Firestore can hold (no nested arrays). */
export function forFirestore<T extends WithResult>(entry: T): Omit<T, 'result'> & { result: Omit<HumanDesignResult, 'channels'> & { channels: string[] } } {
    const channels = entry.result.channels.map((channel) => (Array.isArray(channel) ? channel.join('-') : String(channel)));

    return {
        ...entry,
        result: {
            ...entry.result, channels,
        },
    };
}
