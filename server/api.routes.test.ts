import {
    readdirSync, readFileSync,
} from 'node:fs';
import {
    join, relative,
} from 'node:path';
import {
    describe, expect, it,
} from 'vitest';

/**
 * Keeps the implemented routes and the published API spec
 * (openspec/analysis/render/api.yaml) from drifting apart (task 13.1).
 */
const API_DIR = join(__dirname, 'api');
const SPEC_FILE = join(__dirname, '..', 'openspec', 'analysis', 'render', 'api.yaml');

/** Operational routes that are intentionally not part of the product API. */
const INTERNAL = new Set(['GET /health/ping']);

/** Capabilities that are specified but not built yet. Remove a prefix when it ships. */
const NOT_BUILT_YET = [
    '/human-design',
    '/detailed-reports',
    '/admin',
    // The "此刻／今日" capabilities (add-daily-tarot-draw, add-daily-rune-draw, add-maya-kin, add-transit-report, add-today-section)
    '/today',
    '/tarot',
    '/rune',
    '/kin',
    '/fixed-results/maya-kin',
    '/transit-reports',
];

const normalize = (path: string) => path.replace(/\{[^}]+\}/g, '{}');

function walk(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);

        return entry.isDirectory() ? walk(full) : [full];
    });
}

function implementedRoutes(): Set<string> {
    const routes = new Set<string>();

    for (const file of walk(API_DIR)) {
        const match = /^(.*)\.(get|post|put|patch|delete)\.ts$/.exec(relative(API_DIR, file));

        if (!match) continue;

        const route = (match[1] as string)
            .split('/')
            .filter((segment) => segment !== 'index')
            .map((segment) => segment.replace(/^\[(.+)\]$/, '{$1}'))
            .join('/');

        routes.add(`${(match[2] as string).toUpperCase()} ${normalize(`/${route}`)}`);
    }

    return routes;
}

/** The spec is machine-generated with a fixed layout: paths at 2 spaces, methods at 4. */
function specRoutes(): Set<string> {
    const routes = new Set<string>();
    let currentPath: string | null = null;
    let inPaths = false;

    for (const line of readFileSync(SPEC_FILE, 'utf8').split('\n')) {
        if (/^\S/.test(line)) {
            inPaths = line.startsWith('paths:');
            continue;
        }

        if (!inPaths) continue;

        const path = /^ {2}"?(\/[^":]*)"?:\s*$/.exec(line);
        const method = /^ {4}(get|post|put|patch|delete):\s*$/.exec(line);

        if (path) currentPath = path[1] as string;
        if (method && currentPath) routes.add(`${(method[1] as string).toUpperCase()} ${normalize(currentPath)}`);
    }

    return routes;
}

describe('API routes vs published spec', () => {
    const implemented = implementedRoutes();
    const spec = specRoutes();

    it('finds routes on both sides', () => {
        expect(implemented.size).toBeGreaterThan(20);
        expect(spec.size).toBeGreaterThan(20);
    });

    it('has a spec entry for every implemented route', () => {
        const undocumented = [...implemented].filter((route) => !spec.has(route) && !INTERNAL.has(route));

        expect(undocumented).toEqual([]);
    });

    it('only leaves unbuilt routes for capabilities that are not built yet', () => {
        const missing = [...spec].filter((route) => !implemented.has(route));
        const unexpected = missing.filter((route) => !NOT_BUILT_YET.some((prefix) => route.split(' ')[1]?.startsWith(prefix)));

        expect(unexpected).toEqual([]);
    });
});
