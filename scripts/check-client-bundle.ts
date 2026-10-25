import {
    existsSync, readFileSync, readdirSync,
} from 'node:fs';
import { join } from 'node:path';

/**
 * After `pnpm build`, make sure nothing secret reached the files served to browsers.
 * Usage: node scripts/check-client-bundle.ts
 */
const CANDIDATE_DIRS = ['.vercel/output/static', '.output/public'];
const FORBIDDEN: Array<{ label: string; pattern: RegExp }> = [
    {
        label: 'private key', pattern: /BEGIN (RSA |EC )?PRIVATE KEY/,
    },
    {
        label: 'service account', pattern: /"type"\s*:\s*"service_account"/,
    },
    {
        label: 'firebase-admin', pattern: /firebase-admin/,
    },
    {
        label: 'server secret name', pattern: /(CRON_SECRET|WELCOME_GRANT_HMAC_KEY|PAYMENT_DEV_WEBHOOK_SECRET|FIREBASE_SERVICE_ACCOUNT_KEY)/,
    },
];

function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);

        return entry.isDirectory() ? files(full) : [full];
    });
}

const root = CANDIDATE_DIRS.find((dir) => existsSync(dir));

if (!root) {
    console.error('No build output found. Run `pnpm build` first.');
    process.exit(2);
}

const findings: string[] = [];
let scanned = 0;

for (const file of files(root)) {
    if (!/\.(js|mjs|css|html|json|map)$/.test(file)) continue;

    scanned += 1;
    const text = readFileSync(file, 'utf8');

    for (const {
        label, pattern, 
    } of FORBIDDEN) {
        if (pattern.test(text)) findings.push(`${file}: ${label}`);
    }
}

console.log(`scanned ${scanned} file(s) in ${root}`);

if (findings.length > 0) {
    console.error('Secrets found in the client bundle:');
    for (const finding of findings) console.error(`  ${finding}`);
    process.exit(1);
}

console.log('no secrets found');
