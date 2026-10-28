import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { computeTransitChart } from '../astrology/transitChart';
import { UserRepository } from '../repositories/user.repository';
import {
    HOROSCOPE_AREAS, horoscopeContentKey, type HoroscopeBody,
} from '../../shared/constants/horoscope';
import type { DailyHoroscopeResponse } from '../../shared/schemas/api/horoscope.schema';
import type { Zodiac } from '../../shared/schemas/common';
import { houses } from '../../shared/utils/horoscope';
import { taipeiDateKey } from '../../shared/utils/time';
import {
    NotFoundError, UnprocessableError,
} from '../../shared/types/errors';

type HoroscopeServiceOptions = {
    users?: UserRepository;
    content?: FixedContentService;
    clock?: () => number;
};

/**
 * Today's sign horoscope: the member's sun sign is the first house, and the fast bodies of today's sky (at 00:00
 * in Taipei) each fall in one of the twelve. Written content, no AI, free, and nothing is stored: the answer is a
 * function of the date and the sign.
 */
export class HoroscopeService extends BaseService {
    protected serviceName = 'horoscope';

    private readonly users: UserRepository;
    private readonly content: FixedContentService;
    private readonly clock: () => number;

    constructor(options: HoroscopeServiceOptions = {}) {
        super();
        this.users = options.users ?? new UserRepository();
        this.content = options.content ?? new FixedContentService();
        this.clock = options.clock ?? Date.now;
    }

    async getToday(uid: string): Promise<DailyHoroscopeResponse> {
        const user = await this.users.getById(uid);

        if (!user) {
            throw new NotFoundError('User');
        }

        const sign = user.birthData?.zodiac;

        if (!sign) {
            throw new UnprocessableError('Fill in your birth date first', 'PROFILE_REQUIRED');
        }

        // The date comes from the server's clock and the sign from the saved profile; nothing in the request is used.
        const date = taipeiDateKey(new Date(this.clock()));
        const chart = computeTransitChart(date);
        const signOf = Object.fromEntries(
            Object.keys(HOROSCOPE_AREAS).map((body) => [body, chart.placements[body as HoroscopeBody].sign]),
        ) as Record<HoroscopeBody, Zodiac>;

        // Content that is not published yet is a 404: a gap is never filled in with something else
        const bodies = await Promise.all(houses(sign, signOf).map(async ({
            body, sign: transitSign, house,
        }) => ({
            body,
            name: HOROSCOPE_AREAS[body].name,
            area: HOROSCOPE_AREAS[body].area,
            transitSign,
            house,
            content: await this.content.getPublished('HOROSCOPE', horoscopeContentKey(body, house)),
        })));

        return {
            date, sign, bodies,
        };
    }
}
