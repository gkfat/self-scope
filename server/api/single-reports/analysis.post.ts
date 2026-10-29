import {
    defineEventHandler, getHeader, readBody, setResponseHeader, setResponseStatus,
} from 'h3';
import {
    idempotencyKeySchema, singleAnalysisAcceptedSchema, singleAnalysisRequestSchema,
} from '../../../shared/schemas/api/singleReport.schema';
import { SingleAnalysisService } from '../../services/singleAnalysis.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

/**
 * The AI analysis of one of the member's reports: 1 point, made after the response, written into the report's own AI
 * field. The Idempotency-Key header is the job id; the report is polled through `POST /api/single-reports`.
 */
export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const key = idempotencyKeySchema.safeParse(getHeader(event, 'idempotency-key'));

        if (!key.success) {
            throw new ValidationError('Idempotency-Key header is required (8-64 letters, digits, - or _)');
        }

        const body = singleAnalysisRequestSchema.safeParse(await readBody(event));

        if (!body.success) {
            throw new ValidationError('A report is required', { issues: body.error.issues });
        }

        setResponseHeader(event, 'Cache-Control', 'private, no-store');
        setResponseStatus(event, 202);

        return singleAnalysisAcceptedSchema.parse(await new SingleAnalysisService().start(uid, body.data.snapshotId, key.data));
    } catch (error) {
        throw toH3Error(error);
    }
});
