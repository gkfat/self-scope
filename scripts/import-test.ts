import { readFileSync } from 'node:fs';
import { testDefinitionFileSchema } from '../shared/schemas/firestore/test.schema.ts';
import { applyTestDefinition } from './lib/applyTest.ts';
import { getScriptFirestore } from './lib/admin.ts';

const USAGE = 'Usage: node scripts/import-test.ts <content/tests/file.json> [--dry-run]';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find((arg) => !arg.startsWith('--'));

if (!file) {
    console.error(USAGE);
    process.exit(2);
}

const parsed = testDefinitionFileSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));

if (!parsed.success) {
    console.error('Test definition rejected. Nothing was written.');

    for (const issue of parsed.error.issues) {
        console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }

    process.exit(1);
}

console.log(`${parsed.data.testId} v${parsed.data.version}: ${parsed.data.questions.length} questions`);

if (dryRun) {
    console.log('Dry run: nothing was written.');
    process.exit(0);
}

const outcome = await applyTestDefinition(getScriptFirestore(), parsed.data, Date.now());

console.log(outcome);
