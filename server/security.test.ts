import {
    existsSync, readFileSync, readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import {
    describe, expect, it,
} from 'vitest';

const ROOT = join(__dirname, '..');

describe('firestore.rules', () => {
    const rules = readFileSync(join(ROOT, 'firestore.rules'), 'utf8')
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, '').trim())
        .filter((line) => line !== '');

    it('denies all client reads and writes', () => {
        const allows = rules.filter((line) => line.startsWith('allow'));

        expect(allows).toEqual(['allow read, write: if false;']);
    });
});

describe('secrets', () => {
    it('keeps .env files and service account keys out of version control', () => {
        const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8');

        expect(gitignore).toMatch(/^\.env$/m);
        expect(gitignore).toMatch(/^service_account\.json$/m);
    });

    it('does not mark server-only secrets as public runtime config', () => {
        const config = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8');
        const publicBlock = config.slice(config.indexOf('public:'));

        for (const secret of [
            'CRON_SECRET',
            'WELCOME_GRANT_HMAC_KEY',
            'PAYMENT_DEV_WEBHOOK_SECRET',
            'SERVICE_ACCOUNT',
        ]) {
            expect(publicBlock).not.toContain(secret);
        }
    });

    it('does not ship a real .env.example secret', () => {
        const example = readFileSync(join(ROOT, '.env.example'), 'utf8');

        expect(example).not.toMatch(/BEGIN PRIVATE KEY/);
        expect(example).not.toMatch(/"private_key"\s*:\s*"-----/);
    });
});

describe('client code', () => {
    function sourceFiles(dir: string): string[] {
        return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
            const full = join(dir, entry.name);

            return entry.isDirectory() ? sourceFiles(full) : [full];
        });
    }

    it('never touches the server-only modules or secret config from app/', () => {
        const forbidden = [
            /from ['"][^'"]*server\//,
            /firebase-admin/,
            /getServerConfig/,
            /requireServerSecret/,
            /useRuntimeConfig\(\)\.(cronSecret|welcomeGrantHmacKey|payment)/,
        ];

        for (const file of sourceFiles(join(ROOT, 'app'))) {
            if (!/\.(ts|vue)$/.test(file)) continue;

            const text = readFileSync(file, 'utf8');

            for (const pattern of forbidden) {
                expect({
                    file: file.replace(ROOT, ''), matches: pattern.test(text),
                }).toMatchObject({ matches: false });
            }
        }
    });

    it('exists as a directory', () => {
        expect(existsSync(join(ROOT, 'app'))).toBe(true);
    });
});
