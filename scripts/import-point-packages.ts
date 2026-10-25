import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { pointPackageDocSchema } from '../shared/schemas/firestore/payment.schema.ts';
import { getScriptFirestore } from './lib/admin.ts';

const USAGE = 'Usage: node scripts/import-point-packages.ts <packages.json> [--dry-run]';

// Prices are positive by schema, so the zero-priced example file cannot be imported by accident.
const fileSchema = z.array(z.object({ packageId: z.string().regex(/^[a-z0-9-]+$/) }).extend(pointPackageDocSchema.shape));

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find((arg) => !arg.startsWith('--'));

if (!file) {
    console.error(USAGE);
    process.exit(2);
}

const parsed = fileSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));

if (!parsed.success) {
    console.error('Point packages rejected. Nothing was written.');

    for (const issue of parsed.error.issues) {
        console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }

    process.exit(1);
}

console.log(`${parsed.data.length} package(s) in ${file}`);

if (dryRun) {
    console.log('Dry run: nothing was written.');
    process.exit(0);
}

const db = getScriptFirestore();

for (const {
    packageId, ...pack 
} of parsed.data) {
    await db.collection('pointPackages').doc(packageId).set(pack);
    console.log(`  ${packageId}: ${pack.points} points`);
}
