import {
    describe, expect, it,
} from 'vitest';
import { classifyRoute } from './routeAccess';

describe('classifyRoute', () => {
    it('treats listed anonymous endpoints as public', () => {
        expect(classifyRoute('POST', '/api/auth/login')).toBe('public');
        expect(classifyRoute('POST', '/api/guest-sessions')).toBe('public');
        expect(classifyRoute('PUT', '/api/guest-sessions/abc/profile')).toBe('public');
        expect(classifyRoute('GET', '/api/guest-sessions/abc/profile')).toBe('public');
        expect(classifyRoute('POST', '/api/zodiac/natal-chart')).toBe('public');
        expect(classifyRoute('POST', '/api/bazi/calculations')).toBe('public');
        expect(classifyRoute('GET', '/api/fixed-results/zodiac?birthDate=2000-01-01')).toBe('public');
        expect(classifyRoute('GET', '/api/fixed-results/maya-kin?birthDate=2000-01-01')).toBe('public');
        expect(classifyRoute('GET', '/api/tests')).toBe('public');
        expect(classifyRoute('GET', '/api/tests/mbti')).toBe('public');
    });

    it('allows anonymous or guest callers on optional endpoints', () => {
        expect(classifyRoute('POST', '/api/tests/mbti/submissions')).toBe('optional');
        expect(classifyRoute('POST', '/api/human-design/calculations')).toBe('optional');
        expect(classifyRoute('POST', '/api/share-cards')).toBe('optional');
    });

    it('lets webhook and cron verify themselves', () => {
        expect(classifyRoute('POST', '/api/payments/webhook')).toBe('self');
        expect(classifyRoute('GET', '/api/cron/data-expiry')).toBe('self');
    });

    it('requires a token for everything else, including claiming a guest session', () => {
        expect(classifyRoute('POST', '/api/guest-sessions/abc/claim')).toBe('required');
        expect(classifyRoute('POST', '/api/summaries')).toBe('required');
        expect(classifyRoute('DELETE', '/api/account')).toBe('required');
        expect(classifyRoute('GET', '/api/unknown')).toBe('required');
        expect(classifyRoute('GET', '/api/kin/today')).toBe('required');
        expect(classifyRoute('GET', '/api/rune/daily')).toBe('required');
        expect(classifyRoute('POST', '/api/rune/daily')).toBe('required');
        expect(classifyRoute('POST', '/api/kin/today')).toBe('required');
        expect(classifyRoute('GET', '/api/tarot/daily')).toBe('required');
        expect(classifyRoute('POST', '/api/tarot/daily')).toBe('required');
    });

    it('does not make a public path public for other methods', () => {
        expect(classifyRoute('DELETE', '/api/tests/mbti')).toBe('required');
        expect(classifyRoute('GET', '/api/bazi/calculations')).toBe('required');
    });
});
