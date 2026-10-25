import {
    describe, expect, it,
} from 'vitest';
import { assertCronAuthorized } from './cronAuth';
import { AuthError } from '../../shared/types/errors';

describe('assertCronAuthorized', () => {
    it('accepts the exact bearer secret', () => {
        expect(() => assertCronAuthorized('Bearer s3cret', 's3cret')).not.toThrow();
    });

    it('rejects a missing header, a wrong secret and a wrong scheme', () => {
        expect(() => assertCronAuthorized(undefined, 's3cret')).toThrow(AuthError);
        expect(() => assertCronAuthorized('Bearer nope', 's3cret')).toThrow(AuthError);
        expect(() => assertCronAuthorized('s3cret', 's3cret')).toThrow(AuthError);
        expect(() => assertCronAuthorized('Bearer s3cret ', 's3cret')).toThrow(AuthError);
    });
});
