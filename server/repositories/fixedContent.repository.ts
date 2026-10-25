import { BaseRepository } from './base.repository';
import type { FixedContentDoc } from '../../shared/schemas/firestore/fixedContent.schema';

/**
 * fixedContents/{contentType}_{key}. Read-only for the app; content is written by
 * the import script (scripts/import-fixed-content.ts).
 */
export class FixedContentRepository extends BaseRepository<FixedContentDoc> {
    protected collectionName = 'fixedContents';
}
