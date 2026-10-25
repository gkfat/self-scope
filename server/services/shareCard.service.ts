import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { SummaryService } from './summary.service';
import type {
    ShareCard, ShareCardRequest,
} from '../../shared/schemas/api/shareCard.schema';
import {
    isValidContentKey, type FixedContentType,
} from '../../shared/utils/fixedContentKeys';
import {
    AuthError, NotFoundError,
} from '../../shared/types/errors';

const EXCERPT_LENGTH = 80;
const SINGLE_REFERENCE = /^(ZODIAC|BLOOD|MBTI):(.+)$/;

type ShareCardServiceOptions = {
    fixedContent?: FixedContentService;
    summaries?: SummaryService;
};

/**
 * Cut at a character count, not UTF-16 units, so Chinese text is never split mid-character.
 */
export function excerpt(text: string, length: number = EXCERPT_LENGTH): string {
    const characters = [...text.trim()];

    return characters.length <= length ? characters.join('') : `${characters.slice(0, length).join('')}…`;
}

export class ShareCardService extends BaseService {
    protected serviceName = 'share-card';

    private readonly fixedContent: FixedContentService;
    private readonly summaries: SummaryService;

    constructor(options: ShareCardServiceOptions = {}) {
        super();
        this.fixedContent = options.fixedContent ?? new FixedContentService();
        this.summaries = options.summaries ?? new SummaryService();
    }

    /**
     * Build a card from content that is already public or that the caller owns.
     * Only the content's own title and summary go in: never birth data, place, email or ids (RULE-026).
     */
    async create(request: ShareCardRequest, uid: string | null): Promise<ShareCard> {
        if (request.source === 'SINGLE_RESULT') {
            const match = SINGLE_REFERENCE.exec(request.referenceId);
            const type = match?.[1] as FixedContentType | undefined;
            const key = match?.[2];

            if (!type || !key || !isValidContentKey(type, key)) {
                throw new NotFoundError('Result');
            }

            return this.fromContent(await this.fixedContent.getPublished(type, key));
        }

        if (request.source === 'SUMMARY') {
            if (!uid) {
                throw new AuthError('Sign in to share a summary');
            }

            return this.fromContent((await this.summaries.get(uid, request.referenceId)).content);
        }

        // Human design sharing arrives with the human-design capability.
        throw new NotFoundError('Result');
    }

    private fromContent(content: { title: string; summary: string }): ShareCard {
        return {
            title: content.title,
            summaryText: excerpt(content.summary),
            imageUrl: null,
        };
    }
}
