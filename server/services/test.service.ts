import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { GuestSessionService } from './guestSession.service';
import { TestRepository } from '../repositories/test.repository';
import {
    findAnswerIssues, scorePersonality,
} from '../../shared/utils/personalityScoring';
import {
    testAttemptDocSchema, type TestAttemptDoc, type TestResult,
} from '../../shared/schemas/firestore/testAttempt.schema';
import type {
    PublicTest, SubmissionRequest, SubmissionResponse, TestAttemptItem, TestSummary,
} from '../../shared/schemas/api/test.schema';
import { addMonths } from '../../shared/utils/time';
import {
    NotFoundError, ValidationError,
} from '../../shared/types/errors';

const ATTEMPT_RETENTION_MONTHS = 3;
const MBTI_VALID_MONTHS = 3;
const ATTEMPT_LIST_LIMIT = 50;

type TestServiceOptions = {
    repository?: TestRepository;
    fixedContent?: FixedContentService;
    guestSessions?: GuestSessionService;
    clock?: () => number;
};

/** Who is submitting: a signed-in user, a guest with a session, or neither. */
export type SubmissionActor = {
    uid: string | null;
    guestSessionId: string | null;
};

export class TestService extends BaseService {
    protected serviceName = 'test';

    private readonly repository: TestRepository;
    private readonly fixedContent: FixedContentService;
    private readonly guestSessions: GuestSessionService;
    private readonly clock: () => number;

    constructor(options: TestServiceOptions = {}) {
        super();
        this.repository = options.repository ?? new TestRepository();
        this.fixedContent = options.fixedContent ?? new FixedContentService();
        this.guestSessions = options.guestSessions ?? new GuestSessionService();
        this.clock = options.clock ?? Date.now;
    }

    async listTests(): Promise<TestSummary[]> {
        const tests = await this.repository.listActiveTests();
        const summaries: TestSummary[] = [];

        for (const {
            testId, test, 
        } of tests) {
            const version = await this.repository.getVersion(testId, test.currentVersion);

            if (!version) continue;

            summaries.push({
                testId,
                title: test.title,
                version: test.currentVersion,
                questionCount: version.questions.length,
            });
        }

        return summaries;
    }

    /**
     * The current version's questions, without dimensions, directions or scoring.
     */
    async getTest(testId: string): Promise<PublicTest> {
        const {
            test, version, 
        } = await this.loadCurrent(testId);

        return {
            testId,
            title: test.title,
            version: test.currentVersion,
            questions: version.questions.map(({
                questionId, text, options, 
            }) => ({
                questionId, text, options,
            })),
        };
    }

    /**
     * Score a submission on the server (never trust a client-side score).
     * Signed-in users get the attempt saved for 3 months; guests only a
     * one-day session copy. A storage failure never costs the user the result.
     */
    async submit(
        testId: string,
        input: SubmissionRequest,
        actor: SubmissionActor,
    ): Promise<SubmissionResponse> {
        const test = await this.repository.getTest(testId);

        if (!test || !test.active) {
            throw new NotFoundError('Test');
        }

        // Any published version is scored as submitted, so a test updated while
        // someone is answering still scores against the version they saw (RULE-027).
        const version = await this.repository.getVersion(testId, input.testVersion);

        if (!version) {
            throw new NotFoundError('Test version');
        }

        const issues = findAnswerIssues(version.questions, input.answers);

        if (issues.length > 0) {
            throw new ValidationError('Invalid answers', { issues });
        }

        const result = scorePersonality(version.questions, input.answers, version.scoringRule);
        // Fetch the content before saving anything: a result we cannot present must not be stored.
        const content = await this.fixedContent.getPublished('MBTI', result);

        const now = this.clock();
        const testResult: TestResult = {
            testId,
            testVersion: input.testVersion,
            answers: input.answers.map((answer) => ({
                questionId: answer.questionId,
                value: answer.value,
                // Answer times are only kept when the user agreed (FR-024).
                responseTimeMs: input.responseTimeConsent ? (answer.responseTimeMs ?? null) : null,
            })),
            result,
            completedAt: now,
        };

        const saved = await this.persist(testResult, actor, now);

        return {
            attemptId: saved.attemptId,
            testVersion: input.testVersion,
            result,
            content,
            persisted: saved.attemptId !== null,
            saveFailed: saved.failed,
            expiresAt: saved.expiresAt,
        };
    }

    /**
     * The signed-in user's attempts that have not expired, newest first.
     */
    async listAttempts(uid: string): Promise<TestAttemptItem[]> {
        const now = this.clock();
        const snap = await this.repository.attemptsRef(uid)
            .orderBy('completedAt', 'desc')
            .limit(ATTEMPT_LIST_LIMIT)
            .get();

        return snap.docs
            .map((doc) => ({
                attemptId: doc.id,
                doc: testAttemptDocSchema.parse(doc.data()),
            }))
            .filter(({ doc }) => doc.expiresAt > now)
            .map(({
                attemptId, doc, 
            }) => ({
                attemptId,
                testId: doc.testId,
                testVersion: doc.testVersion,
                result: doc.result,
                completedAt: doc.completedAt,
                expiresAt: doc.expiresAt,
            }));
    }

    private async loadCurrent(testId: string) {
        const test = await this.repository.getTest(testId);

        if (!test || !test.active) {
            throw new NotFoundError('Test');
        }

        const version = await this.repository.getVersion(testId, test.currentVersion);

        if (!version) {
            throw new NotFoundError('Test version');
        }

        return {
            test, version,
        };
    }

    private async persist(
        testResult: TestResult,
        actor: SubmissionActor,
        now: number,
    ): Promise<{ attemptId: string | null; expiresAt: number | null; failed: boolean }> {
        if (actor.uid) {
            return this.saveForUser(actor.uid, testResult, now);
        }

        if (actor.guestSessionId) {
            return this.saveForGuest(actor.guestSessionId, testResult);
        }

        return {
            attemptId: null, expiresAt: null, failed: false,
        };
    }

    private async saveForUser(uid: string, testResult: TestResult, now: number) {
        const repo = this.repository;
        const expiresAt = addMonths(now, ATTEMPT_RETENTION_MONTHS);

        try {
            const attemptRef = repo.attemptsRef(uid).doc();
            const attempt: TestAttemptDoc = {
                ...testResult, expiresAt,
            };

            await repo.runTransaction(async (tx) => {
                tx.set(attemptRef, attempt);
                // The latest result is also the user's MBTI, which expires on its own clock.
                tx.update(repo.userRef(uid), {
                    mbti: testResult.result,
                    mbtiExpiresAt: addMonths(now, MBTI_VALID_MONTHS),
                    updatedAt: now,
                });
            });

            return {
                attemptId: attemptRef.id, expiresAt, failed: false,
            };
        } catch (error) {
            this.logError('failed to save test attempt', {
                action: 'saveForUser',
                userId: uid,
                error,
            });

            return {
                attemptId: null, expiresAt: null, failed: true,
            };
        }
    }

    private async saveForGuest(sessionId: string, testResult: TestResult) {
        try {
            await this.guestSessions.saveTestResult(sessionId, testResult);
        } catch (error) {
            // An unknown or expired session just means nothing is kept; the result still shows.
            if (error instanceof NotFoundError) {
                return {
                    attemptId: null, expiresAt: null, failed: false,
                };
            }

            this.logError('failed to save guest result', { action: 'saveForGuest' });

            return {
                attemptId: null, expiresAt: null, failed: true,
            };
        }

        return {
            attemptId: null, expiresAt: null, failed: false,
        };
    }
}
