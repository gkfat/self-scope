import {
    defineEventHandler, getRouterParam,
} from 'h3';
import { reportItemSchema } from '../../../shared/schemas/api/detailedReport.schema';
import { DetailedReportService } from '../../services/detailedReport.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { NotFoundError } from '../../../shared/types/errors';

/**
 * Reports live under the caller's own user document, so another member's id is simply "not found".
 */
export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const id = getRouterParam(event, 'id');

        if (!id) {
            throw new NotFoundError('Report');
        }

        return reportItemSchema.parse(await new DetailedReportService().get(uid, id));
    } catch (error) {
        throw toH3Error(error);
    }
});
