import { BaseService } from './base.service';
import { UserRepository } from '../repositories/user.repository';
import { addMonths } from '../../shared/utils/time';
import { NotFoundError } from '../../shared/types/errors';
import type {
    ProfileInput, ProfileResponse,
} from '../../shared/schemas/api/profile.schema';
import type { UserDoc } from '../../shared/schemas/firestore/user.schema';

const MBTI_VALID_MONTHS = 3;

type ProfileServiceOptions = {
    repository?: UserRepository;
    clock?: () => number;
};

export class ProfileService extends BaseService {
    protected serviceName = 'profile';

    private readonly repository: UserRepository;
    private readonly clock: () => number;

    constructor(options: ProfileServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new UserRepository();
        this.clock = options.clock ?? Date.now;
    }

    async getProfile(uid: string): Promise<ProfileResponse> {
        const user = await this.repository.getById(uid);

        if (!user) {
            throw new NotFoundError('User');
        }

        return this.toResponse(uid, user);
    }

    /**
     * Replace the birth data and blood type. MBTI semantics:
     * - undefined: keep the stored value (it may come from a test result)
     * - null: clear it
     * - a value: set it; the 3-month expiry restarts only when the value changes
     */
    async updateProfile(uid: string, input: ProfileInput): Promise<ProfileResponse> {
        const current = await this.repository.getById(uid);

        if (!current) {
            throw new NotFoundError('User');
        }

        const mbti = input.mbti === undefined ? current.mbti : input.mbti;
        const mbtiChanged = mbti !== current.mbti;
        const mbtiExpiresAt = mbti === null
            ? null
            : (mbtiChanged || current.mbtiExpiresAt === null
                ? addMonths(this.clock(), MBTI_VALID_MONTHS)
                : current.mbtiExpiresAt);

        const updated = await this.repository.update(uid, {
            birthData: {
                birthDate: input.birthData.birthDate,
                zodiac: input.birthData.zodiac,
                birthTime: input.birthData.birthTime ?? null,
                birthPlace: input.birthData.birthPlace ?? null,
            },
            bloodType: input.bloodType,
            mbti,
            mbtiExpiresAt,
        });

        this.logInfo('profile updated', {
            action: 'updateProfile',
            userId: uid,
        });

        return this.toResponse(uid, updated);
    }

    private toResponse(uid: string, user: UserDoc): ProfileResponse {
        return {
            userId: uid,
            email: user.email,
            birthData: user.birthData,
            bloodType: user.bloodType,
            mbti: user.mbti,
        };
    }
}
