import {
    defineEventHandler, readBody, setResponseStatus,
} from 'h3';
import {
    summaryObtainedSchema, summaryRequestSchema,
} from '../../../shared/schemas/api/summary.schema';
import { SummaryService } from '../../services/summary.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        // The body is optional; an empty one means the defaults.
        const body = await readBody(event) ?? {};
        const request = summaryRequestSchema.safeParse(body);

        if (!request.success) {
            throw new ValidationError('Invalid request', { issues: request.error.issues });
        }

        const result = await new SummaryService().obtain(uid, request.data);

        // 201 when a point was charged, 200 when the member already owned it.
        setResponseStatus(event, result.pointsDeducted > 0 ? 201 : 200);

        return summaryObtainedSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
