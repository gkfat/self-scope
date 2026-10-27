import {
    describe, expect, it, 
} from 'vitest';
import { calculateHumanDesign } from './calculate';
import { forFirestore } from './stored';
import { humanDesignResultSchema } from '../../shared/schemas/firestore/humanDesign.schema';

describe('forFirestore', () => {
    const result = calculateHumanDesign('1990-01-01', '12:00', 'Asia/Taipei');

    it('writes channels without nesting arrays, which Firestore refuses', () => {
        const stored = forFirestore({ result });

        expect(stored.result.channels.length).toBeGreaterThan(0);
        expect(stored.result.channels.every((channel) => typeof channel === 'string')).toBe(true);
    });

    it('reads the stored channels back as the same pairs', () => {
        const stored = forFirestore({ result });

        expect(humanDesignResultSchema.parse(stored.result)).toEqual(result);
    });
});
