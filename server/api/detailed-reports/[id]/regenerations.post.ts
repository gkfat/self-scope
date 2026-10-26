import {
    defineEventHandler, getHeader, getRouterParam, setResponseStatus,
} from 'h3';
import {
    idempotencyKeySchema, reportAcceptedSchema,
} from '../../../../shared/schemas/api/detailedReport.schema';
import { DetailedReportService } from '../../../services/detailedReport.service';
import { requireAuth } from '../../../utils/auth';
import { toH3Error } from '../../../utils/errorHandler';
import {
    NotFoundError, ValidationError,
} from '../../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const sourceId = getRouterParam(event, 'id');
        const key = idempotencyKeySchema.safeParse(getHeader(event, 'idempotency-key'));

        if (!sourceId) {
            throw new NotFoundError('Report');
        }

        if (!key.success) {
            throw new ValidationError('Idempotency-Key header is required (8-64 letters, digits, - or _)');
        }

        const accepted = await new DetailedReportService().regenerate(uid, sourceId, key.data);

        setResponseStatus(event, 202);

        return reportAcceptedSchema.parse(accepted);
    } catch (error) {
        throw toH3Error(error);
    }
});
