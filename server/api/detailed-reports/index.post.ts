import {
    defineEventHandler, getHeader, readBody, setResponseStatus,
} from 'h3';
import {
    createReportRequestSchema, idempotencyKeySchema, reportAcceptedSchema,
} from '../../../shared/schemas/api/detailedReport.schema';
import { DetailedReportService } from '../../services/detailedReport.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const key = idempotencyKeySchema.safeParse(getHeader(event, 'idempotency-key'));

        if (!key.success) {
            throw new ValidationError('Idempotency-Key header is required (8-64 letters, digits, - or _)');
        }

        const request = createReportRequestSchema.safeParse(await readBody(event) ?? {});

        if (!request.success) {
            throw new ValidationError('Invalid request', { issues: request.error.issues });
        }

        const accepted = await new DetailedReportService().create(uid, request.data, key.data);

        setResponseStatus(event, 202);

        return reportAcceptedSchema.parse(accepted);
    } catch (error) {
        throw toH3Error(error);
    }
});
