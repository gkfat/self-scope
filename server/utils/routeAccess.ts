/**
 * Access classification for API routes (design D2).
 *
 * - public:   no token needed or attempted
 * - optional: Bearer token or X-Guest-Session-Id or neither
 * - self:     verified by the handler itself (webhook signature, cron secret)
 * - required: valid Firebase ID token (default)
 */
export type RouteAccess = 'public' | 'optional' | 'self' | 'required';

type Rule = {
    method: string;
    pattern: RegExp;
    access: RouteAccess;
};

const RULES: readonly Rule[] = [
    {
        method: 'GET', pattern: /^\/api\/health\/ping$/, access: 'public',
    },
    {
        method: 'POST', pattern: /^\/api\/auth\/login$/, access: 'public',
    },
    {
        method: 'POST', pattern: /^\/api\/guest-sessions$/, access: 'public',
    },
    {
        method: 'PUT', pattern: /^\/api\/guest-sessions\/[^/]+\/profile$/, access: 'public',
    },
    {
        method: 'GET', pattern: /^\/api\/guest-sessions\/[^/]+\/profile$/, access: 'public',
    },
    {
        method: 'GET', pattern: /^\/api\/fixed-results\/.+$/, access: 'public',
    },
    {
        method: 'GET', pattern: /^\/api\/tests(\/[^/]+)?$/, access: 'public',
    },
    {
        method: 'GET', pattern: /^\/api\/point-packages$/, access: 'public',
    },
    {
        method: 'POST', pattern: /^\/api\/tests\/[^/]+\/submissions$/, access: 'optional',
    },
    {
        method: 'POST', pattern: /^\/api\/human-design\/calculations$/, access: 'optional',
    },
    {
        method: 'POST', pattern: /^\/api\/zodiac\/natal-chart$/, access: 'public',
    },
    {
        method: 'POST', pattern: /^\/api\/share-cards$/, access: 'optional',
    },
    {
        method: 'POST', pattern: /^\/api\/payments\/webhook$/, access: 'self',
    },
    {
        method: 'GET', pattern: /^\/api\/cron\/.+$/, access: 'self',
    },
];

/**
 * Classify a request. Anything not listed requires a valid token.
 */
export function classifyRoute(method: string, path: string): RouteAccess {
    const pathname = path.split('?')[0] ?? path;
    const rule = RULES.find((r) => r.method === method.toUpperCase() && r.pattern.test(pathname));

    return rule?.access ?? 'required';
}
