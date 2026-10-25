import { BaseService } from './base.service';
import { AccountRepository } from '../repositories/account.repository';
import { requireServerSecret } from '../../config/config';
import { hashGoogleUid } from '../utils/hmac';
import {
    WELCOME_BATCH_VALID_DAYS,
    WELCOME_GRANT_RECORD_MONTHS,
    WELCOME_POINTS,
} from '../../shared/constants/points';
import {
    addDays, addMonths,
} from '../../shared/utils/time';
import { AuthError } from '../../shared/types/errors';
import type { AuthTokenPayload } from '../../shared/types/auth';
import type { LoginResponse } from '../../shared/schemas/api/auth.schema';
import type { UserDoc } from '../../shared/schemas/firestore/user.schema';
import type {
    PointAccountDoc, PointBatchDoc, PointTransactionDoc,
} from '../../shared/schemas/firestore/points.schema';

type AccountServiceOptions = {
    repository?: AccountRepository;
    /** Resolved lazily so a missing secret only fails when a login actually needs it. */
    getHmacKey?: () => string;
    clock?: () => number;
};

const WELCOME_BATCH_ID = 'welcome';
const WELCOME_TRANSACTION_ID = 'welcome';

export class AccountService extends BaseService {
    protected serviceName = 'account';

    private readonly repository: AccountRepository;
    private readonly getHmacKey: () => string;
    private readonly clock: () => number;

    constructor(options: AccountServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new AccountRepository();
        this.getHmacKey = options.getHmacKey ?? (() => requireServerSecret('welcomeGrantHmacKey'));
        this.clock = options.clock ?? Date.now;
    }

    /**
     * First login creates the account, its point account and, unless the same
     * Google account received a welcome grant within the last 3 months
     * (RULE-031), the 3-point welcome grant. Everything happens in one
     * transaction so concurrent first logins grant at most once (RULE-009).
     */
    async login(auth: AuthTokenPayload): Promise<LoginResponse> {
        if (!auth.email) {
            throw new AuthError('Google account has no email');
        }

        const {
            uid, email, 
        } = auth;
        const now = this.clock();
        // Key on the Google account id, not the Firebase uid: the uid changes when the Auth user is deleted.
        const grantHash = hashGoogleUid(auth.googleSub ?? uid, this.getHmacKey());
        const repo = this.repository;

        const result = await repo.runTransaction(async (tx) => {
            const userRef = repo.userRef(uid);
            const grantRef = repo.welcomeGrantRef(grantHash);

            const userSnap = await tx.get(userRef);

            if (userSnap.exists) {
                return {
                    userId: uid,
                    email: (userSnap.data() as UserDoc).email,
                    isNewUser: false,
                    welcomePointsGranted: 0,
                };
            }

            const grantSnap = await tx.get(grantRef);
            // Firestore TTL deletes lazily, so an expired record may still exist.
            const grantExpiresAt = grantSnap.exists
                ? (grantSnap.data() as { expiresAt: Date }).expiresAt.getTime()
                : 0;
            const grantBlocked = grantExpiresAt > now;

            const user: UserDoc = {
                email,
                birthData: null,
                bloodType: 'UNKNOWN',
                mbti: null,
                mbtiExpiresAt: null,
                createdAt: now,
                updatedAt: now,
            };
            const pointAccount: PointAccountDoc = {
                userId: uid,
                welcomeGrantedAt: grantBlocked ? null : now,
                createdAt: now,
            };

            tx.set(userRef, user);
            tx.set(repo.pointAccountRef(uid), pointAccount);

            if (grantBlocked) {
                return {
                    userId: uid,
                    email,
                    isNewUser: true,
                    welcomePointsGranted: 0,
                };
            }

            const batch: PointBatchDoc = {
                source: 'WELCOME',
                sourceRef: null,
                granted: WELCOME_POINTS,
                remaining: WELCOME_POINTS,
                expiresAt: addDays(now, WELCOME_BATCH_VALID_DAYS),
                createdAt: now,
            };
            const transaction: PointTransactionDoc = {
                type: 'GRANT',
                amount: WELCOME_POINTS,
                reason: 'WELCOME',
                batchAllocations: [
                    {
                        batchId: WELCOME_BATCH_ID,
                        amount: WELCOME_POINTS,
                    },
                ],
                reference: null,
                createdAt: now,
            };

            tx.set(repo.pointBatchRef(uid, WELCOME_BATCH_ID), batch);
            tx.set(repo.pointTransactionRef(uid, WELCOME_TRANSACTION_ID), transaction);
            // Only the keyed hash is stored; the record is used for nothing but this check.
            tx.set(grantRef, {
                googleUidHash: grantHash,
                grantedAt: new Date(now),
                expiresAt: new Date(addMonths(now, WELCOME_GRANT_RECORD_MONTHS)),
            });

            return {
                userId: uid,
                email,
                isNewUser: true,
                welcomePointsGranted: WELCOME_POINTS,
            };
        });

        this.logInfo('login', {
            action: 'login',
            userId: uid,
            data: {
                isNewUser: result.isNewUser,
                welcomePointsGranted: result.welcomePointsGranted,
            },
        });

        return result;
    }
}
