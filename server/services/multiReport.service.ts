import { BaseService } from './base.service';
import { PointService } from './point.service';
import { ReportSnapshotService } from './reportSnapshot.service';
import { SingleAnalysisService } from './singleAnalysis.service';
import { SingleReportService } from './singleReport.service';
import { assembleMultiReport } from '../../shared/report/assembleMultiReport';
import type { MultiReportSystem } from '../../shared/report/systems';
import type { MultiReportAccepted } from '../../shared/schemas/api/multiReport.schema';
import { multiReportCost } from '../../shared/utils/multiDimensionPricing';
import {
    InsufficientPointsError, UnprocessableError, ValidationError,
} from '../../shared/types/errors';

type MultiReportServiceOptions = {
    single?: SingleReportService;
    snapshots?: ReportSnapshotService;
    analysis?: SingleAnalysisService;
    points?: PointService;
    clock?: () => number;
};

/**
 * The paid multi-dimension report: the lasting systems the member chose, put together by rules into a report that is
 * kept as a snapshot, and then read over by the AI (the price includes that). The report is only made when everything
 * it needs is there and the member can pay for it, so that nothing is made for nothing.
 */
export class MultiReportService extends BaseService {
    protected serviceName = 'multi-report';

    private readonly single: SingleReportService;
    private readonly snapshots: ReportSnapshotService;
    private readonly analysis: SingleAnalysisService;
    private readonly points: PointService;

    constructor(options: MultiReportServiceOptions = {}) {
        super();
        const clock = options.clock ?? Date.now;

        this.single = options.single ?? new SingleReportService({ clock });
        this.snapshots = options.snapshots ?? new ReportSnapshotService({ clock });
        this.analysis = options.analysis ?? new SingleAnalysisService({ clock });
        this.points = options.points ?? new PointService({ clock });
    }

    /**
     * Charge the price of the systems and start the report. The Idempotency-Key is the job id: asking again with it
     * only says where the first request got to, and never charges or makes a second report.
     */
    async create(uid: string, systems: readonly MultiReportSystem[], jobId: string): Promise<MultiReportAccepted> {
        const cost = multiReportCost(systems);

        if (cost === null || new Set(systems).size !== systems.length) {
            throw new ValidationError('At least two different systems are needed for a multi-dimension report');
        }

        const existing = await this.snapshots.findByJob(uid, jobId);

        if (existing) {
            return {
                snapshotId: existing.id, status: existing.status, pointsDeducted: 0,
            };
        }

        const inputs = await this.single.memberInputs(uid, systems);
        const content = assembleMultiReport(inputs, await this.single.todayInputs(uid));

        // The AI only rewrites what the rules found; with nothing found there is nothing to pay for
        if (!content.blocks.some((item) => item.key === 'insights')) {
            throw new UnprocessableError('No insight was found across these systems', 'NO_INSIGHTS');
        }

        const { availableBalance } = await this.points.getBalance(uid);

        if (availableBalance < cost) {
            throw new InsufficientPointsError('Not enough points', {
                required: cost, available: availableBalance,
            });
        }

        const { id } = await this.snapshots.saveOrReuse(uid, content);
        const started = await this.analysis.start(uid, id, jobId);

        this.logInfo('multi-dimension report accepted', {
            action: 'create', userId: uid, data: {
                snapshotId: id, systems: systems.length, cost,
            },
        });

        return {
            snapshotId: id, ...started,
        };
    }
}
