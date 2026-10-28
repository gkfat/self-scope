import { randomBytes } from 'node:crypto';
import { BaseService } from './base.service';
import { GuestSessionRepository } from '../repositories/guestSession.repository';
import {
    GUEST_SESSION_TTL_MS,
    guestSessionDocSchema,
    type GuestSessionDoc,
    type GuestTempResults,
} from '../../shared/schemas/firestore/guestSession.schema';
import type { ProfileInput } from '../../shared/schemas/api/profile.schema';
import type { TestResult } from '../../shared/schemas/firestore/testAttempt.schema';
import { forFirestore } from '../humanDesign/stored';
import type { GuestHumanDesign } from '../../shared/schemas/firestore/humanDesign.schema';
import type {
    ClaimGuestSessionResponse, GuestProfileResponse,
} from '../../shared/schemas/api/guest.schema';
import type { UserDoc } from '../../shared/schemas/firestore/user.schema';
import { addMonths } from '../../shared/utils/time';
import { toDate } from '../utils/firestoreTime';
import {
    ForbiddenError, GoneError, NotFoundError,
} from '../../shared/types/errors';

type GuestSessionServiceOptions = {
    repository?: GuestSessionRepository;
    clock?: () => number;
};

const MBTI_VALID_MONTHS = 3;
const HUMAN_DESIGN_VALID_MONTHS = 3;
const ATTEMPT_RETENTION_MONTHS = 3;

export class GuestSessionService extends BaseService {
    protected serviceName = 'guest-session';

    private readonly repository: GuestSessionRepository;
    private readonly clock: () => number;

    constructor(options: GuestSessionServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new GuestSessionRepository();
        this.clock = options.clock ?? Date.now;
    }

    /**
     * Create an anonymous session. The id is a 192-bit random value and is the
     * only credential, so it is returned once and never logged.
     */
    async create(): Promise<{ sessionId: string; expiresAt: number }> {
        const now = this.clock();
        const sessionId = randomBytes(24).toString('base64url');
        const expiresAt = now + GUEST_SESSION_TTL_MS;

        const doc: GuestSessionDoc = {
            createdAt: now,
            expiresAt: new Date(expiresAt),
            tempProfile: null,
            tempResults: null,
            claimedBy: null,
            claimedAt: null,
            savedAttempts: 0,
        };

        await this.repository.sessionRef(sessionId).set(doc);

        return {
            sessionId, expiresAt,
        };
    }

    /**
     * Store the guest's profile. Does not extend the TTL.
     */
    async saveProfile(sessionId: string, profile: ProfileInput): Promise<ProfileInput> {
        await this.updateActiveSession(sessionId, () => ({ tempProfile: profile }));

        return profile;
    }

    /**
     * Store the guest's latest test result (used by test submission).
     */
    async saveTestResult(sessionId: string, test: TestResult): Promise<void> {
        await this.updateActiveSession(sessionId, (session) => ({
            tempResults: {
                ...this.emptyResults(),
                ...session.tempResults,
                test,
            },
        }));
    }

    /**
     * Birth data the guest has entered, or null when the session is missing, expired, claimed or has none.
     */
    async getBirthData(sessionId: string): Promise<ProfileInput['birthData'] | null> {
        const snap = await this.repository.sessionRef(sessionId).get();

        if (!snap.exists) return null;

        const session = guestSessionDocSchema.parse(this.fromFirestore(snap.data()));

        if (session.expiresAt.getTime() <= this.clock() || session.claimedBy) return null;

        return session.tempProfile?.birthData ?? null;
    }

    /**
     * The guest's latest test result, or null when the session is missing, expired, claimed or has none.
     */
    async getTestResult(sessionId: string): Promise<TestResult | null> {
        const snap = await this.repository.sessionRef(sessionId).get();

        if (!snap.exists) return null;

        const session = guestSessionDocSchema.parse(this.fromFirestore(snap.data()));

        if (session.expiresAt.getTime() <= this.clock() || session.claimedBy) return null;

        return session.tempResults?.test ?? null;
    }

    /**
     * Everything the guest has entered so far. Missing, expired and claimed sessions are all "not found".
     */
    async getProfile(sessionId: string): Promise<GuestProfileResponse> {
        const snap = await this.repository.sessionRef(sessionId).get();

        if (!snap.exists) {
            throw new NotFoundError('Guest session');
        }

        const session = guestSessionDocSchema.parse(this.fromFirestore(snap.data()));

        if (session.expiresAt.getTime() <= this.clock() || session.claimedBy) {
            throw new NotFoundError('Guest session');
        }

        return {
            birthData: session.tempProfile?.birthData ?? null,
            bloodType: session.tempProfile?.bloodType ?? 'UNKNOWN',
            mbti: session.tempResults?.test?.result ?? session.tempProfile?.mbti ?? null,
            gender: session.tempProfile?.gender ?? null,
            hasHumanDesign: session.tempResults?.humanDesign != null,
        };
    }

    /**
     * Keep the guest's latest human-design chart (used by the human-design calculation).
     */
    async saveHumanDesign(sessionId: string, humanDesign: GuestHumanDesign): Promise<void> {
        await this.updateActiveSession(sessionId, (session) => ({
            tempResults: {
                ...this.emptyResults(),
                ...session.tempResults,
                humanDesign,
            },
        }));
    }

    /**
     * Move the session's results into the signed-in user's account (FR-032).
     * Idempotent: the same user claiming twice gets the same answer, and the
     * temporary data is cleared by the first claim.
     */
    async claim(sessionId: string, uid: string): Promise<ClaimGuestSessionResponse> {
        const repo = this.repository;
        const now = this.clock();

        const result = await repo.runTransaction(async (tx) => {
            const sessionRef = repo.sessionRef(sessionId);
            const userRef = repo.userRef(uid);

            const sessionSnap = await tx.get(sessionRef);

            if (!sessionSnap.exists) {
                throw new GoneError('Guest session expired or not found');
            }

            const session = guestSessionDocSchema.parse(this.fromFirestore(sessionSnap.data()));

            if (session.claimedBy) {
                if (session.claimedBy !== uid) {
                    throw new ForbiddenError('Guest session belongs to another account');
                }

                return { savedAttempts: session.savedAttempts };
            }

            if (session.expiresAt.getTime() <= now) {
                throw new GoneError('Guest session expired or not found');
            }

            const userSnap = await tx.get(userRef);

            if (!userSnap.exists) {
                throw new NotFoundError('User');
            }

            const user = userSnap.data() as UserDoc;
            // Read before any write: an existing chart is never replaced by a guest's older one.
            const humanDesignSnap = await tx.get(repo.humanDesignRef(uid));
            const userPatch: Partial<UserDoc> = { updatedAt: now };
            let savedAttempts = 0;

            // The profile only fills an empty one; it never overwrites what the user already saved.
            if (session.tempProfile && user.birthData === null) {
                userPatch.birthData = {
                    birthDate: session.tempProfile.birthData.birthDate,
                    zodiac: session.tempProfile.birthData.zodiac,
                    birthTime: session.tempProfile.birthData.birthTime ?? null,
                    birthPlace: session.tempProfile.birthData.birthPlace ?? null,
                };
                userPatch.bloodType = session.tempProfile.bloodType;
                userPatch.gender = session.tempProfile.gender ?? null;
            }

            const test = session.tempResults?.test ?? null;

            if (test) {
                tx.set(repo.testAttemptRef(uid, `guest_${sessionId}`), {
                    ...test,
                    expiresAt: addMonths(test.completedAt, ATTEMPT_RETENTION_MONTHS),
                });
                savedAttempts += 1;

                userPatch.mbti = test.result;
                userPatch.mbtiExpiresAt = addMonths(now, MBTI_VALID_MONTHS);
            } else if (session.tempProfile?.mbti && user.mbti === null) {
                userPatch.mbti = session.tempProfile.mbti;
                userPatch.mbtiExpiresAt = addMonths(now, MBTI_VALID_MONTHS);
            }

            const humanDesign = session.tempResults?.humanDesign ?? null;

            if (humanDesign && !humanDesignSnap.exists) {
                tx.set(repo.humanDesignRef(uid), {
                    ...forFirestore(humanDesign),
                    expiresAt: addMonths(humanDesign.calculatedAt, HUMAN_DESIGN_VALID_MONTHS),
                });
            }

            tx.update(userRef, userPatch);
            tx.update(sessionRef, {
                tempProfile: null,
                tempResults: null,
                claimedBy: uid,
                claimedAt: now,
                savedAttempts,
            });

            return { savedAttempts };
        });

        this.logInfo('guest session claimed', {
            action: 'claim',
            userId: uid,
            data: { savedAttempts: result.savedAttempts },
        });

        return result;
    }

    private emptyResults(): GuestTempResults {
        return {
            test: null, humanDesign: null,
        };
    }

    /**
     * Read-modify-write on a session that exists, is not expired and not claimed.
     */
    private async updateActiveSession(
        sessionId: string,
        buildPatch: (session: GuestSessionDoc) => Partial<GuestSessionDoc>,
    ): Promise<void> {
        const repo = this.repository;
        const now = this.clock();

        await repo.runTransaction(async (tx) => {
            const ref = repo.sessionRef(sessionId);
            const snap = await tx.get(ref);

            if (!snap.exists) {
                throw new NotFoundError('Guest session');
            }

            const session = guestSessionDocSchema.parse(this.fromFirestore(snap.data()));

            if (session.expiresAt.getTime() <= now || session.claimedBy) {
                throw new NotFoundError('Guest session');
            }

            const patch = buildPatch(session);
            const humanDesign = patch.tempResults?.humanDesign;

            // Firestore holds no arrays inside arrays, and the patch re-writes what the session already held.
            tx.update(ref, humanDesign
                ? {
                    ...patch,
                    tempResults: {
                        ...patch.tempResults, humanDesign: forFirestore(humanDesign),
                    },
                }
                : patch);
        });
    }

    /**
     * Firestore returns `expiresAt` as a Timestamp; the schema expects a Date.
     */
    private fromFirestore(data: unknown): unknown {
        if (typeof data !== 'object' || data === null) return data;

        const record = data as Record<string, unknown>;

        return 'expiresAt' in record
            ? {
                ...record, expiresAt: toDate(record.expiresAt),
            }
            : record;
    }
}
