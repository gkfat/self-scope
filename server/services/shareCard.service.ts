import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { HumanDesignService } from './humanDesign.service';
import { SummaryService } from './summary.service';
import type {
    ShareCard, ShareCardRequest,
} from '../../shared/schemas/api/shareCard.schema';
import {
    HUMAN_DESIGN_AUTHORITY_LABELS, HUMAN_DESIGN_STRATEGY_LABELS, HUMAN_DESIGN_TYPE_LABELS,
} from '../../shared/constants/humanDesignLabels';
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
    humanDesign?: HumanDesignService;
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
    private readonly humanDesign: HumanDesignService;

    constructor(options: ShareCardServiceOptions = {}) {
        super();
        this.fixedContent = options.fixedContent ?? new FixedContentService();
        this.summaries = options.summaries ?? new SummaryService();
        this.humanDesign = options.humanDesign ?? new HumanDesignService();
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

        if (!uid) {
            throw new AuthError('Sign in to share a human design');
        }

        if (request.referenceId !== 'main') {
            throw new NotFoundError('Result');
        }

        const chart = await this.humanDesign.getSaved(uid);

        return {
            title: `人類圖：${HUMAN_DESIGN_TYPE_LABELS[chart.type]}`,
            summaryText: excerpt(
                `人生角色 ${chart.profile}｜${HUMAN_DESIGN_AUTHORITY_LABELS[chart.authority]}｜策略：${HUMAN_DESIGN_STRATEGY_LABELS[chart.strategy]}`,
            ),
            imageUrl: null,
        };
    }

    private fromContent(content: { title: string; summary: string }): ShareCard {
        return {
            title: content.title,
            summaryText: excerpt(content.summary),
            imageUrl: null,
        };
    }
}
