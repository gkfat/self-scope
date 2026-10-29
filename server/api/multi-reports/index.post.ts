import {
    defineEventHandler, getHeader, readBody, setResponseHeader, setResponseStatus,
} from 'h3';
import {
    multiReportAcceptedSchema, multiReportRequestSchema,
} from '../../../shared/schemas/api/multiReport.schema';
import { idempotencyKeySchema } from '../../../shared/schemas/api/idempotency.schema';
import { MultiReportService } from '../../services/multiReport.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

/**
 * A multi-dimension report of the lasting systems the member chose: paid in points (the AI reading is included), made
 * after the response. The Idempotency-Key header is the job id; the report is read and polled through
 * `GET /api/report-snapshots/{id}`.
 */
export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const key = idempotencyKeySchema.safeParse(getHeader(event, 'idempotency-key'));

        if (!key.success) {
            throw new ValidationError('Idempotency-Key header is required (8-64 letters, digits, - or _)');
        }

        const body = multiReportRequestSchema.safeParse(await readBody(event));

        if (!body.success) {
            throw new ValidationError('At least two different systems are required', { issues: body.error.issues });
        }

        setResponseHeader(event, 'Cache-Control', 'private, no-store');
        setResponseStatus(event, 202);

        return multiReportAcceptedSchema.parse(await new MultiReportService().create(uid, body.data.systems, key.data));
    } catch (error) {
        throw toH3Error(error);
    }
});
