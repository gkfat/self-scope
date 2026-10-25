import type { Firestore } from 'firebase-admin/firestore';
import type { TestDefinitionFile } from '../../shared/schemas/firestore/test.schema.ts';

export type ApplyTestOutcome = 'created' | 'unchanged' | 'new-version';

/**
 * Publish a test definition. Versions are immutable (RULE-027): re-importing the
 * same version with different content is an error, a new `version` string is how
 * a test changes. The test document then points at the newest version.
 */
export async function applyTestDefinition(
    db: Firestore,
    definition: TestDefinitionFile,
    now: number,
): Promise<ApplyTestOutcome> {
    const testRef = db.collection('tests').doc(definition.testId);
    const versionRef = testRef.collection('versions').doc(definition.version);
    const content = {
        questions: definition.questions,
        scoringRule: definition.scoringRule,
    };

    return db.runTransaction(async (tx) => {
        const [testSnap, versionSnap] = await Promise.all([tx.get(testRef), tx.get(versionRef)]);

        if (versionSnap.exists) {
            const existing = versionSnap.data() as typeof content;

            if (JSON.stringify({
                questions: existing.questions, scoringRule: existing.scoringRule,
            }) !== JSON.stringify(content)) {
                throw new Error(
                    `version "${definition.version}" of ${definition.testId} already exists with different content; publish a new version instead`,
                );
            }

            return 'unchanged';
        }

        tx.set(versionRef, {
            ...content,
            publishedAt: now,
        });
        tx.set(testRef, {
            title: definition.title,
            currentVersion: definition.version,
            active: true,
            updatedAt: now,
        });

        return testSnap.exists ? 'new-version' : 'created';
    });
}
