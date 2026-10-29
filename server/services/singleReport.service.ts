import { BaseService } from './base.service';
import { BaziService } from './bazi.service';
import { FixedContentService } from './fixedContent.service';
import { GuestSessionService } from './guestSession.service';
import { HoroscopeService } from './horoscope.service';
import { NatalChartService } from './natalChart.service';
import { SingleAnalysisService } from './singleAnalysis.service';
import { RuneService } from './rune.service';
import { TarotService } from './tarot.service';
import { ReportSnapshotService } from './reportSnapshot.service';
import { TestService } from './test.service';
import { TestRepository } from '../repositories/test.repository';
import { UserRepository } from '../repositories/user.repository';
import { calculateHumanDesign } from '../humanDesign/calculate';
import { findCity } from '../../shared/constants/cities';
import { assembleSingleReport } from '../../shared/report/assembleSingleReport';
import { bloodReportInput } from '../../shared/report/adapters/blood';
import {
    horoscopeReportInput, runeReportInput, tarotReportInput,
} from '../../shared/report/adapters/state';
import { humanDesignReportInput } from '../../shared/report/adapters/humanDesign';
import { baziReportInput } from '../../shared/report/adapters/bazi';
import { mayaKinReportInput } from '../../shared/report/adapters/mayaKin';
import { mbtiReportInput } from '../../shared/report/adapters/mbti';
import { numerologyReportInput } from '../../shared/report/adapters/numerology';
import { zodiacReportInput } from '../../shared/report/adapters/zodiac';
import type { SingleReportSystem } from '../../shared/report/systems';
import type { SystemReportInput } from '../../shared/report/types';
import type { SingleReportResponse } from '../../shared/schemas/api/singleReport.schema';
import type { BirthData } from '../../shared/schemas/api/profile.schema';
import type {
    BloodType, Gender, MbtiType,
} from '../../shared/schemas/common';
import type { UserDoc } from '../../shared/schemas/firestore/user.schema';
import {
    scoreDimensions, type DimensionScore,
} from '../../shared/utils/personalityScoring';
import { isStateSystem } from '../../shared/ontology/mapping';
import { RUNE_DRAW_VERSION } from '../../shared/utils/rune';
import { TAROT_DRAW_VERSION } from '../../shared/utils/tarot';
import { kinOf } from '../../shared/utils/mayaKin';
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
    bazi?: BaziService;
    tarot?: TarotService;
    rune?: RuneService;
    horoscope?: HoroscopeService;
    analysis?: SingleAnalysisService;
    clock?: () => number;
};

/** Who asks: a signed-in member (the report is kept) or a guest with a session (it is not). */
export type ReportAsker = { uid: string } | { guestSessionId: string | null };

/** What a report is made from, whoever the asker is. */
type Subject = {
    birthData: BirthData | null;
    bloodType: BloodType;
    /** Only used to choose the direction of the BaZi luck cycles */
    gender: Gender | null;
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
    private readonly charts: BaziService;
    private readonly tarot: TarotService;
    private readonly rune: RuneService;
    private readonly horoscope: HoroscopeService;
    private readonly analysis: SingleAnalysisService;
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
        this.charts = options.bazi ?? new BaziService({ clock: this.clock });
        this.tarot = options.tarot ?? new TarotService({ clock: this.clock });
        this.rune = options.rune ?? new RuneService({ clock: this.clock });
        this.horoscope = options.horoscope ?? new HoroscopeService({ clock: this.clock });
        this.analysis = options.analysis ?? new SingleAnalysisService({ clock: this.clock });
    }

    async generate(asker: ReportAsker, system: SingleReportSystem): Promise<SingleReportResponse> {
        const member = 'uid' in asker;

        if (isStateSystem(system)) return this.generateToday(asker, system);

        const subject = member ? await this.memberSubject(asker.uid) : await this.guestSubject(asker.guestSessionId);
        const content = assembleSingleReport(await this.inputOf(subject, system));

        if (!member) {
            const now = this.clock();

            return {
                ...content, id: null, generatedAt: now, expiresAt: null, persisted: false, aiAugmented: false, ai: null, aiJob: null,
            };
        }

        const { id } = await this.snapshots.saveOrReuse(asker.uid, content);

        // An analysis whose worker vanished is failed and refunded here, where the member would see it hang
        await this.analysis.reapIfStale(asker.uid, id);

        return {
            ...await this.snapshots.get(asker.uid, id), persisted: true,
        };
    }

    /**
     * The report of today's state (tarot, runes, sign horoscope): made from what the member has today, for members only,
     * and never kept. It is a day's state, so a snapshot per day would only push the lasting reports out of the 20 a
     * member can keep.
     */
    private async generateToday(asker: ReportAsker, system: SingleReportSystem): Promise<SingleReportResponse> {
        if (!('uid' in asker)) {
            throw new UnprocessableError('Sign in to see the report of today', 'LOGIN_REQUIRED');
        }

        const content = assembleSingleReport(await this.todayInput(asker.uid, system));

        return {
            ...content, id: null, generatedAt: this.clock(), expiresAt: null, persisted: false, aiAugmented: false, ai: null, aiJob: null,
        };
    }

    private async todayInput(uid: string, system: SingleReportSystem): Promise<SystemReportInput> {
        switch (system) {
        case 'TAROT': {
            const today = await this.tarot.getToday(uid);

            if (!today.drawn) throw new UnprocessableError('Draw today\'s card first', 'NOT_DRAWN');

            return tarotReportInput({
                date: today.date, card: today.card, content: today.content, drawVersion: TAROT_DRAW_VERSION,
            });
        }
        case 'RUNE': {
            const today = await this.rune.getToday(uid);

            if (!today.drawn) throw new UnprocessableError('Draw today\'s rune first', 'NOT_DRAWN');

            return runeReportInput({
                date: today.date, rune: today.rune, content: today.content, drawVersion: RUNE_DRAW_VERSION,
            });
        }
        case 'HOROSCOPE': return horoscopeReportInput({ horoscope: await this.horoscope.getToday(uid) });
        default: throw new ValidationError(`No report of today for ${String(system)}`);
        }
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
            gender: user.gender,
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
            gender: profile.gender,
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
        case 'MAYA_KIN': return this.mayaKin(subject);
        case 'BAZI': return this.bazi(subject);
        case 'HUMAN_DESIGN': return this.humanDesign(subject);
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

    private async bazi(subject: Subject): Promise<SystemReportInput> {
        const birth = this.requireBirth(subject);
        const today = taipeiDateKey(new Date(this.clock()));
        let place: string | null = birth.birthPlace ?? null;
        let chart;

        try {
            chart = await this.charts.calculate({
                birthDate: birth.birthDate, birthTime: birth.birthTime ?? null, birthPlace: place, gender: subject.gender,
            });
        } catch (error) {
            if (!(error instanceof ValidationError) || place === null) throw error;

            // A saved city that is no longer on the list: the chart is worked out in the default zone, and says so
            this.logWarn('birth city unknown to the BaZi chart', {
                action: 'bazi', data: { reason: error.message },
            });
            place = null;
            chart = await this.charts.calculate({
                birthDate: birth.birthDate, birthTime: birth.birthTime ?? null, birthPlace: null, gender: subject.gender,
            });
        }

        return baziReportInput({
            chart,
            birthDate: birth.birthDate,
            birthTime: birth.birthTime ?? null,
            birthPlace: place,
            gender: subject.gender,
            today,
        });
    }

    private humanDesign(subject: Subject): SystemReportInput {
        const birth = this.requireBirth(subject);

        if (!birth.birthTime) {
            throw new UnprocessableError('Birth time is required to calculate a human design', 'BIRTH_TIME_REQUIRED');
        }

        if (!birth.birthPlace) {
            throw new UnprocessableError('Birth place is required to calculate a human design', 'BIRTH_PLACE_REQUIRED');
        }

        const city = findCity(birth.birthPlace);

        if (!city) {
            throw new ValidationError('birthPlace is not in the preset city list');
        }

        return humanDesignReportInput({
            chart: calculateHumanDesign(birth.birthDate, birth.birthTime, city.timeZone),
            birthDate: birth.birthDate,
            birthTime: birth.birthTime,
            birthPlace: birth.birthPlace,
        });
    }

    private async mayaKin(subject: Subject): Promise<SystemReportInput> {
        const birth = this.requireBirth(subject);

        return mayaKinReportInput({
            birthDate: birth.birthDate, body: await this.fixedContent.getPublished('KIN_BIRTH', String(kinOf(birth.birthDate).kinNumber)),
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
