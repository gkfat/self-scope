import { computeCoverage } from '../shared/utils/fixedContentImport.ts';
import { getScriptFirestore } from './lib/admin.ts';

const snapshot = await getScriptFirestore().collection('fixedContents').get();
const report = computeCoverage(snapshot.docs.map((doc) => ({
    id: doc.id,
    status: String(doc.get('status')),
})));

console.log(`expected ${report.expected}, published ${report.published}`);
console.log(`missing ${report.missing.length}, not published ${report.unpublished.length}, unexpected ${report.unexpected.length}`);

const preview = (label: string, ids: string[]) => {
    if (ids.length === 0) return;
    console.log(`${label} (first 20):`);
    for (const id of ids.slice(0, 20)) console.log(`  ${id}`);
};

preview('missing', report.missing);
preview('not published', report.unpublished);
preview('unexpected', report.unexpected);

process.exit(report.complete ? 0 : 1);
