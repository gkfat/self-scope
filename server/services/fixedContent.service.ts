import { BaseService } from './base.service';
import { FixedContentRepository } from '../repositories/fixedContent.repository';
import {
    fixedContentDocSchema, type FixedContentDoc,
} from '../../shared/schemas/firestore/fixedContent.schema';
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';
import {
    fixedContentId, type FixedContentType,
} from '../../shared/utils/fixedContentKeys';
import { NotFoundError } from '../../shared/types/errors';

type FixedContentServiceOptions = { repository?: FixedContentRepository };

export class FixedContentService extends BaseService {
    protected serviceName = 'fixed-content';

    private readonly repository: FixedContentRepository;

    constructor(options: FixedContentServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new FixedContentRepository();
    }

    /**
     * Fetch one fixed result. Only PUBLISHED content is visible; drafts and
     * reviewed-but-unpublished content look exactly like missing content.
     * Never falls back to AI: a gap is reported as 404 (RULE-017).
     */
    async getPublished(type: FixedContentType, key: string): Promise<FixedResultResponse> {
        const stored = await this.repository.getById(fixedContentId(type, key));

        if (!stored) {
            throw new NotFoundError('Content');
        }

        // Parse what was read: stored documents are untrusted input to this service.
        const doc: FixedContentDoc = fixedContentDocSchema.parse(stored);

        if (doc.status !== 'PUBLISHED') {
            throw new NotFoundError('Content');
        }

        return {
            ...doc.body,
            contentType: doc.contentType,
            key: doc.key,
            contentVersion: doc.contentVersion,
        };
    }
}
