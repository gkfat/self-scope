import { BaseService } from './base.service';
import { GuestSessionService } from './guestSession.service';
import { HumanDesignRepository } from '../repositories/humanDesign.repository';
import { UserRepository } from '../repositories/user.repository';
import { calculateHumanDesign } from '../humanDesign/calculate';
import { describeLocalTime } from '../humanDesign/localTime';
import {
    humanDesignInputDigest, type BirthInput,
} from '../humanDesign/inputDigest';
import { toMillis } from '../utils/firestoreTime';
import {
    HUMAN_DESIGN_DISCLAIMER, HUMAN_DESIGN_RETENTION_MONTHS,
} from '../../shared/constants/humanDesign';
import { findCity } from '../../shared/constants/cities';
import type {
    HumanDesignRequest, HumanDesignResponse,
} from '../../shared/schemas/api/humanDesign.schema';
import {
    humanDesignDocSchema, type HumanDesignDoc, type HumanDesignResult,
} from '../../shared/schemas/firestore/humanDesign.schema';
import { addMonths } from '../../shared/utils/time';
import {
    NotFoundError, UnprocessableError, ValidationError,
} from '../../shared/types/errors';

type HumanDesignServiceOptions = {
    repository?: HumanDesignRepository;
    users?: UserRepository;
    guestSessions?: GuestSessionService;
    clock?: () => number;
};

/** Who is asking: a signed-in member, a guest with a session, or neither. */
export type HumanDesignActor = {
    uid: string | null;
    guestSessionId: string | null;
};

type PartialBirth = {
    birthDate?: string | null;
    birthTime?: string | null;
    birthPlace?: string | null;
};

export class HumanDesignService extends BaseService {
    protected serviceName = 'human-design';

    private readonly repository: HumanDesignRepository;
    private readonly users: UserRepository;
    private readonly guestSessions: GuestSessionService;
    private readonly clock: () => number;

    constructor(options: HumanDesignServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new HumanDesignRepository();
        this.users = options.users ?? new UserRepository();
        this.guestSessions = options.guestSessions ?? new GuestSessionService();
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Calculate a chart. Birth data in the request wins; what it leaves out comes from the saved profile
     * (the member's, or the guest session's). No AI is involved (RULE-013).
     * Members get the chart saved for 3 months; guests only keep it in their session.
     */
    async calculate(request: HumanDesignRequest, actor: HumanDesignActor): Promise<HumanDesignResponse> {
        const now = this.clock();

        if (actor.uid) {
            const user = await this.users.getById(actor.uid);

            if (!user) {
                throw new NotFoundError('User');
            }

            const input = this.resolveInput(request, user.birthData);
            const result = this.compute(input);
            const expiresAt = addMonths(now, HUMAN_DESIGN_RETENTION_MONTHS);

            const profileBirth = this.completeBirth(user.birthData);

            await this.repository.ref(actor.uid).set({
                result,
                inputDigest: humanDesignInputDigest(input),
                profileDigest: profileBirth ? humanDesignInputDigest(profileBirth) : null,
                calculatedAt: now,
                expiresAt,
            } satisfies HumanDesignDoc);

            this.logInfo('human design saved', {
                action: 'calculate',
                userId: actor.uid,
            });

            return this.toResponse(result, true, expiresAt, this.noteFor(input));
        }

        const profile = actor.guestSessionId ? await this.guestSessions.getBirthData(actor.guestSessionId) : null;
        const input = this.resolveInput(request, profile);
        const result = this.compute(input);
        const saved = actor.guestSessionId
            ? await this.keepForGuest(actor.guestSessionId, {
                result,
                inputDigest: humanDesignInputDigest(input),
                calculatedAt: now,
            })
            : false;

        return this.toResponse(result, saved, null, this.noteFor(input));
    }

    /**
     * The member's saved chart. When the saved birth data no longer matches what the chart was
     * calculated from, it is recalculated first (the expiry stays as it was).
     */
    async getSaved(uid: string): Promise<HumanDesignResponse> {
        const current = await this.loadCurrent(uid);

        if (!current) {
            throw new NotFoundError('Human design');
        }

        return this.toResponse(current.result, true, current.expiresAt);
    }

    /** The chart to use as an input elsewhere (detailed reports), or null when there is none. */
    async getCurrent(uid: string): Promise<HumanDesignResult | null> {
        return (await this.loadCurrent(uid))?.result ?? null;
    }

    private async loadCurrent(uid: string): Promise<{ result: HumanDesignResult; expiresAt: number } | null> {
        const snap = await this.repository.ref(uid).get();

        if (!snap.exists) return null;

        const raw = snap.data() as Record<string, unknown>;
        const doc = humanDesignDocSchema.parse({
            ...raw,
            expiresAt: toMillis(raw.expiresAt),
        });

        if (doc.expiresAt <= this.clock()) return null;

        const user = await this.users.getById(uid);
        const profileBirth = this.completeBirth(user?.birthData ?? null);

        // Without a complete profile there is nothing to compare against: the saved chart stands.
        if (!profileBirth) {
            return {
                result: doc.result, expiresAt: doc.expiresAt,
            };
        }

        const profileDigest = humanDesignInputDigest(profileBirth);

        // The profile is unchanged since the calculation (a chart made from other data on purpose stands).
        if (profileDigest === doc.profileDigest) {
            return {
                result: doc.result, expiresAt: doc.expiresAt,
            };
        }

        const result = this.compute(profileBirth);

        await this.repository.ref(uid).set({
            ...doc,
            result,
            inputDigest: profileDigest,
            profileDigest,
            calculatedAt: this.clock(),
        } satisfies HumanDesignDoc);

        this.logInfo('human design recalculated after birth data changed', {
            action: 'recalculate',
            userId: uid,
        });

        return {
            result, expiresAt: doc.expiresAt,
        };
    }

    /** The profile's birth data when it is complete enough for a chart. */
    private completeBirth(birth: PartialBirth | null): BirthInput | null {
        if (!birth?.birthDate || !birth.birthTime || !birth.birthPlace) return null;

        return {
            birthDate: birth.birthDate, birthTime: birth.birthTime, birthPlace: birth.birthPlace,
        };
    }

    private resolveInput(request: HumanDesignRequest, profile: PartialBirth | null): BirthInput {
        const birthDate = request.birthDate ?? profile?.birthDate;
        const birthTime = request.birthTime ?? profile?.birthTime;
        const birthPlace = request.birthPlace ?? profile?.birthPlace;

        if (!birthDate) {
            throw new UnprocessableError('Birth date is required', 'PROFILE_REQUIRED');
        }

        if (!birthTime) {
            throw new UnprocessableError('Birth time is required to calculate a human design', 'BIRTH_TIME_REQUIRED');
        }

        if (!birthPlace) {
            throw new UnprocessableError('Birth place is required to calculate a human design', 'BIRTH_PLACE_REQUIRED');
        }

        return {
            birthDate, birthTime, birthPlace,
        };
    }

    private compute(input: BirthInput): HumanDesignResult {
        const city = findCity(input.birthPlace);

        if (!city) {
            throw new ValidationError('birthPlace is not in the preset city list');
        }

        return calculateHumanDesign(input.birthDate, input.birthTime, city.timeZone);
    }

    private async keepForGuest(
        sessionId: string,
        entry: Parameters<GuestSessionService['saveHumanDesign']>[1],
    ): Promise<boolean> {
        try {
            await this.guestSessions.saveHumanDesign(sessionId, entry);

            return true;
        } catch (error) {
            // An expired or unknown session is normal: the chart still shows, nothing is kept.
            if (!(error instanceof NotFoundError)) {
                this.logError('failed to save guest human design', {
                    action: 'keepForGuest', error,
                });
            }

            return false;
        }
    }

    private noteFor(input: BirthInput): HumanDesignResponse['timeNote'] {
        const city = findCity(input.birthPlace);

        return city ? describeLocalTime(input.birthDate, input.birthTime, city.timeZone) : null;
    }

    private toResponse(
        result: HumanDesignResult,
        saved: boolean,
        expiresAt: number | null,
        timeNote: HumanDesignResponse['timeNote'] = null,
    ): HumanDesignResponse {
        return {
            ...result,
            disclaimer: HUMAN_DESIGN_DISCLAIMER,
            saved,
            expiresAt,
            timeNote,
        };
    }
}
