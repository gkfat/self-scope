import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import {
    parseImportCsv, parseImportJson,
} from '../shared/utils/fixedContentImport.ts';
import { applyFixedContent } from './lib/applyFixedContent.ts';
import { getScriptFirestore } from './lib/admin.ts';

const USAGE = 'Usage: node scripts/import-fixed-content.ts <file.json|file.csv> [--dry-run]';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find((arg) => !arg.startsWith('--'));

if (!file) {
    console.error(USAGE);
    process.exit(2);
}

const extension = extname(file).toLowerCase();

if (extension !== '.json' && extension !== '.csv') {
    console.error(`Unsupported file type "${extension}". ${USAGE}`);
    process.exit(2);
}

const text = readFileSync(file, 'utf8');
const parsed = extension === '.json' ? parseImportJson(text) : parseImportCsv(text);

if (parsed.errors.length > 0) {
    console.error(`Import rejected: ${parsed.errors.length} invalid row(s). Nothing was written.`);

    for (const error of parsed.errors) {
        console.error(`  row ${error.row}: ${error.message}`);
    }

    process.exit(1);
}

console.log(`${parsed.rows.length} valid row(s) in ${file}`);

if (dryRun) {
    console.log('Dry run: nothing was written.');
    process.exit(0);
}

const outcome = await applyFixedContent(getScriptFirestore(), parsed.rows, Date.now());

console.log(`created ${outcome.created.length}, updated ${outcome.updated.length}, unchanged ${outcome.unchanged.length}`);
