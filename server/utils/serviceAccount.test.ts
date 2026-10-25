import {
    mkdtempSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    afterEach, beforeEach, describe, expect, it,
} from 'vitest';
import { loadServiceAccount } from './serviceAccount';

const account = (projectId: string) => JSON.stringify({
    type: 'service_account',
    project_id: projectId,
    client_email: `sa@${projectId}.iam.gserviceaccount.com`,
    private_key: 'KEY-MATERIAL',
});

describe('loadServiceAccount', () => {
    let dir: string;

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'sa-'));
    });

    afterEach(() => {
        rmSync(dir, {
            recursive: true, force: true,
        });
    });

    it('reads ./service_account.json in development', () => {
        writeFileSync(join(dir, 'service_account.json'), account('from-file'));

        expect(loadServiceAccount({}, dir)?.project_id).toBe('from-file');
    });

    it('prefers the inline env value over any file', () => {
        writeFileSync(join(dir, 'service_account.json'), account('from-file'));

        const result = loadServiceAccount({ FIREBASE_SERVICE_ACCOUNT_KEY: account('from-env') }, dir);

        expect(result?.project_id).toBe('from-env');
    });

    it('uses an explicitly named file', () => {
        writeFileSync(join(dir, 'other.json'), account('named'));
        writeFileSync(join(dir, 'service_account.json'), account('default'));

        expect(loadServiceAccount({ FIREBASE_SERVICE_ACCOUNT_FILE: 'other.json' }, dir)?.project_id).toBe('named');
    });

    it('ignores the default key file in production', () => {
        writeFileSync(join(dir, 'service_account.json'), account('from-file'));

        expect(loadServiceAccount({ NODE_ENV: 'production' }, dir)).toBeNull();
    });

    it('still honours the inline env value in production', () => {
        const result = loadServiceAccount({
            NODE_ENV: 'production', FIREBASE_SERVICE_ACCOUNT_KEY: account('prod'),
        }, dir);

        expect(result?.project_id).toBe('prod');
    });

    it('returns null when nothing is configured so default credentials can be used', () => {
        expect(loadServiceAccount({}, dir)).toBeNull();
    });

    it('fails loudly for a missing named file', () => {
        expect(() => loadServiceAccount({ FIREBASE_SERVICE_ACCOUNT_FILE: 'nope.json' }, dir)).toThrow('does not exist');
    });

    it('names the source but never prints the secret when the JSON is bad', () => {
        writeFileSync(join(dir, 'service_account.json'), '{ KEY-MATERIAL not json');

        try {
            loadServiceAccount({}, dir);
            expect.unreachable();
        } catch (error) {
            expect((error as Error).message).toContain('service_account.json');
            expect((error as Error).message).not.toContain('KEY-MATERIAL');
        }
    });

    it('rejects an account without a private key', () => {
        writeFileSync(join(dir, 'service_account.json'), JSON.stringify({
            project_id: 'p', client_email: 'e',
        }));

        expect(() => loadServiceAccount({}, dir)).toThrow('missing "private_key"');
    });
});
