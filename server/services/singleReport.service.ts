import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { GuestSessionService } from './guestSession.service';
import { NatalChartService } from './natalChart.service';
import { ReportSnapshotService } from './reportSnapshot.service';
import { TestService } from './test.service';
import { TestRepository } from '../repositories/test.repository';
import { UserRepository } from '../repositories/user.repository';
import { assembleSingleReport } from '../../shared/report/assembleSingleReport';
import { bloodReportInput } from '../../shared/report/adapters/blood';
import { mbtiReportInput } from '../../shared/report/adapters/mbti';
import { numerologyReportInput } from '../../shared/report/adapters/numerology';
import { zodiacReportInput } from '../../shared/report/adapters/zodiac';
import type { SingleReportSystem } from '../../shared/report/systems';
import type { SystemReportInput } from '../../shared/report/types';
import type { SingleReportResponse } from '../../shared/schemas/api/singleReport.schema';
import type { BirthData } from '../../shared/schemas/api/profile.schema';
import type {
    BloodType, MbtiType,
} from '../../shared/schemas/common';
import type { UserDoc } from '../../shared/schemas/firestore/user.schema';
import {
    scoreDimensions, type DimensionScore,
} from '../../shared/utils/personalityScoring';
import { lifePathNumber } from '../../shared/utils/numerology';
import { taipeiDateKey } from '../../shared/utils/time';
import {
    NotFoundError, UnprocessableError, ValidationError,
} from '../../shared/types/errors';

type SingleReportServiceOptions = {
    users?: UserRepository;
    fixedContent?: FixedContentService;
    snapshots?: ReportSnapshotService;
    tests?: TestService;
    testRepository?: TestRepository;
    guests?: GuestSessionService;
    natal?: NatalChartService;
    clock?: () => number;
};

/** Who asks: a signed-in member (the report is kept) or a guest with a session (it is not). */
export type ReportAsker = { uid: string } | { guestSessionId: string | null };

/** What a report is made from, whoever the asker is. */
type Subject = {
    birthData: BirthData | null;
    bloodType: BloodType;
    /** The result, when there is a valid one */
    mbti: MbtiType | null;
    /** How clear each pair of that result is, when the attempt it came from is known */
    mbtiResult: {
        dimensions: Record<string, DimensionScore>; testVersion: string;
    } | null;
};

/**
 * The free single-dimension report of one system: made from fixed rules and the reviewed fixed readings, never by AI,
 * never for points. A signed-in member's report is kept once (see `saveOrReuse`); a guest gets the same report made
 * from what they entered in their session, and nothing of it is stored.
 */
export class SingleReportService extends BaseService {
    protected serviceName = 'single-report';

    private readonly users: UserRepository;
    private readonly fixedContent: FixedContentService;
    private readonly snapshots: ReportSnapshotService;
    private readonly tests: TestService;
    private readonly testRepository: TestRepository;
    private readonly guests: GuestSessionService;
    private readonly natal: NatalChartService;
    private readonly clock: () => number;

    constructor(options: SingleReportServiceOptions = {}) {
        super();
        this.clock = options.clock ?? Date.now;
        this.users = options.users ?? new UserRepository();
        this.fixedContent = options.fixedContent ?? new FixedContentService();
        // The parts that look at the time share this service's clock
        this.snapshots = options.snapshots ?? new ReportSnapshotService({ clock: this.clock });
        this.tests = options.tests ?? new TestService({ clock: this.clock });
        this.testRepository = options.testRepository ?? new TestRepository();
        this.guests = options.guests ?? new GuestSessionService({ clock: this.clock });
        this.natal = options.natal ?? new NatalChartService();
    }

    async generate(asker: ReportAsker, system: SingleReportSystem): Promise<SingleReportResponse> {
        const member = 'uid' in asker;
        const subject = member ? await this.memberSubject(asker.uid) : await this.guestSubject(asker.guestSessionId);
        const content = assembleSingleReport(await this.inputOf(subject, system));

        if (!member) {
            const now = this.clock();

            return {
                ...content, id: null, generatedAt: now, expiresAt: null, persisted: false, aiAugmented: false, ai: null,
            };
        }

        const { id } = await this.snapshots.saveOrReuse(asker.uid, content);

        return {
            ...await this.snapshots.get(asker.uid, id), persisted: true,
        };
    }

    private async memberSubject(uid: string): Promise<Subject> {
        const user: UserDoc | null = await this.users.getById(uid);

        if (!user) {
            throw new NotFoundError('User');
        }

        const valid = user.mbti !== null && (user.mbtiExpiresAt === null || user.mbtiExpiresAt > this.clock());
        const latest = valid ? (await this.tests.listAttempts(uid))[0] : undefined;
        const sameResult = latest && latest.result === user.mbti ? latest : null;

        return {
            birthData: user.birthData,
            bloodType: user.bloodType,
            mbti: valid ? user.mbti : null,
            mbtiResult: sameResult
                ? {
                    dimensions: sameResult.dimensions, testVersion: sameResult.testVersion,
                }
                : null,
        };
    }

    private async guestSubject(sessionId: string | null): Promise<Subject> {
        if (!sessionId) {
            throw new UnprocessableError('Fill in your birth date first', 'PROFILE_REQUIRED');
        }

        let profile;

        try {
            profile = await this.guests.getProfile(sessionId);
        } catch (error) {
            // A session that is gone or has run out is the same as one with nothing in it
            if (error instanceof NotFoundError) {
                throw new UnprocessableError('Fill in your birth date first', 'PROFILE_REQUIRED');
            }

            throw error;
        }

        const test = await this.guests.getTestResult(sessionId);
        const version = test ? await this.testRepository.getVersion(test.testId, test.testVersion) : null;

        return {
            birthData: profile.birthData,
            bloodType: profile.bloodType,
            mbti: profile.mbti,
            mbtiResult: test && version && test.result === profile.mbti
                ? {
                    dimensions: scoreDimensions(version.questions, test.answers, version.scoringRule), testVersion: test.testVersion,
                }
                : null,
        };
    }

    private async inputOf(subject: Subject, system: SingleReportSystem): Promise<SystemReportInput> {
        switch (system) {
        case 'ZODIAC': return this.zodiac(subject);
        case 'BLOOD': return this.blood(subject);
        case 'NUMEROLOGY': return this.numerology(subject);
        case 'MBTI': return this.mbti(subject);
        default: throw new ValidationError(`No single-dimension report for ${String(system)}`);
        }
    }

    private requireBirth(subject: Subject): BirthData {
        if (!subject.birthData) {
            throw new UnprocessableError('Fill in your birth date first', 'PROFILE_REQUIRED');
        }

        return subject.birthData;
    }

    private async zodiac(subject: Subject): Promise<SystemReportInput> {
        const birth = this.requireBirth(subject);
        const body = await this.fixedContent.getPublished('ZODIAC', birth.zodiac);
        let natal: Parameters<typeof zodiacReportInput>[0]['natal'] = null;

        if (birth.birthTime && birth.birthPlace) {
            try {
                natal = {
                    chart: this.natal.calculate({
                        birthDate: birth.birthDate, birthTime: birth.birthTime, birthPlace: birth.birthPlace,
                    }),
                    birthTime: birth.birthTime,
                    birthPlace: birth.birthPlace,
                };
            } catch (error) {
                // A saved city that is no longer on the list: the report still stands, without the chart
                this.logWarn('birth chart could not be worked out', {
                    action: 'zodiac', data: { reason: error instanceof Error ? error.message : String(error) },
                });
            }
        }

        return zodiacReportInput({
            zodiac: birth.zodiac, birthDate: birth.birthDate, body, natal,
        });
    }

    private async blood(subject: Subject): Promise<SystemReportInput> {
        if (subject.bloodType === 'UNKNOWN') {
            throw new UnprocessableError('Fill in your blood type first', 'BLOOD_REQUIRED');
        }

        return bloodReportInput({
            bloodType: subject.bloodType, body: await this.fixedContent.getPublished('BLOOD', subject.bloodType),
        });
    }

    private async numerology(subject: Subject): Promise<SystemReportInput> {
        const birth = this.requireBirth(subject);
        const body = await this.fixedContent.getPublished('NUMEROLOGY', String(lifePathNumber(birth.birthDate)));

        return numerologyReportInput({
            birthDate: birth.birthDate, today: taipeiDateKey(new Date(this.clock())), body,
        });
    }

    private async mbti(subject: Subject): Promise<SystemReportInput> {
        if (!subject.mbti) {
            throw new UnprocessableError('Complete the personality test first', 'MBTI_REQUIRED');
        }

        return mbtiReportInput({
            type: subject.mbti,
            dimensions: subject.mbtiResult?.dimensions ?? null,
            testVersion: subject.mbtiResult?.testVersion ?? null,
            body: await this.fixedContent.getPublished('MBTI', subject.mbti),
        });
    }
}
