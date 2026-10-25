import {
    existsSync, readFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

/**
 * Firebase service account loading, with no Nuxt dependencies so command-line
 * scripts can share it.
 *
 * Order of precedence:
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY: the JSON itself on one line (what Vercel uses)
 * 2. FIREBASE_SERVICE_ACCOUNT_FILE: path to the JSON file
 * 3. ./service_account.json, but only outside production (local development)
 * Returns null when none applies, so the caller can fall back to Google
 * application default credentials.
 */
export type ServiceAccount = {
    project_id: string;
    client_email: string;
    private_key: string;
};

type Source = Record<string, string | undefined>;

const DEFAULT_FILE = 'service_account.json';

function parse(json: string, origin: string): ServiceAccount {
    let data: unknown;

    try {
        data = JSON.parse(json);
    } catch (error) {
        // Say where it came from, never what it contained: this is a secret.
        throw new Error(`${origin} is not valid JSON`, { cause: error });
    }

    const record = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;

    for (const field of [
        'project_id',
        'client_email',
        'private_key',
    ]) {
        if (typeof record[field] !== 'string' || record[field] === '') {
            throw new Error(`${origin} is missing "${field}"`);
        }
    }

    return {
        project_id: record.project_id as string,
        client_email: record.client_email as string,
        private_key: record.private_key as string,
    };
}

export function loadServiceAccount(env: Source = process.env, cwd: string = process.cwd()): ServiceAccount | null {
    const inline = env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (inline) {
        return parse(inline, 'FIREBASE_SERVICE_ACCOUNT_KEY');
    }

    const explicitFile = env.FIREBASE_SERVICE_ACCOUNT_FILE;

    if (explicitFile) {
        const path = resolve(cwd, explicitFile);

        if (!existsSync(path)) {
            throw new Error(`FIREBASE_SERVICE_ACCOUNT_FILE points to a file that does not exist: ${explicitFile}`);
        }

        return parse(readFileSync(path, 'utf8'), explicitFile);
    }

    // A key file lying around must never be picked up by a production build by accident.
    if (env.NODE_ENV === 'production') {
        return null;
    }

    const defaultPath = resolve(cwd, DEFAULT_FILE);

    return existsSync(defaultPath) ? parse(readFileSync(defaultPath, 'utf8'), DEFAULT_FILE) : null;
}
