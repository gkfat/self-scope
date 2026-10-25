import type { Firestore } from 'firebase-admin/firestore';
import type { ImportRow } from '../../shared/utils/fixedContentImport.ts';
import { fixedContentId } from '../../shared/utils/fixedContentKeys.ts';
import { summaryKeyToCombination } from './combination.ts';

export type ApplyOutcome = {
    created: string[];
    updated: string[];
    unchanged: string[];
};

function sameContent(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Write rows into fixedContents/{type}_{key}. The document id is derived from
 * the content, so re-importing a combination updates it instead of duplicating it.
 * contentVersion only increases when body or status actually changed.
 */
export async function applyFixedContent(
    db: Firestore,
    rows: readonly ImportRow[],
    now: number,
): Promise<ApplyOutcome> {
    const outcome: ApplyOutcome = {
        created: [], updated: [], unchanged: [],
    };

    for (const row of rows) {
        const id = fixedContentId(row.contentType, row.key);
        const ref = db.collection('fixedContents').doc(id);

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const current = snap.exists
                ? snap.data() as { body: unknown; status: string; contentVersion: string; publishedAt: number | null }
                : null;

            if (current && sameContent(current.body, row.body) && current.status === row.status) {
                outcome.unchanged.push(id);
                return;
            }

            const publishedAt = row.status === 'PUBLISHED'
                ? (current?.status === 'PUBLISHED' && current.publishedAt ? current.publishedAt : now)
                : null;

            tx.set(ref, {
                contentType: row.contentType,
                key: row.key,
                ...(row.contentType === 'SUMMARY' ? { combinationKey: summaryKeyToCombination(row.key) } : {}),
                body: row.body,
                contentVersion: String(current ? Number(current.contentVersion) + 1 : 1),
                status: row.status,
                updatedAt: now,
                publishedAt,
            });

            (current ? outcome.updated : outcome.created).push(id);
        });
    }

    return outcome;
}
