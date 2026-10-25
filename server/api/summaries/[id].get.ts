import {
    defineEventHandler, getRouterParam,
} from 'h3';
import { summaryItemSchema } from '../../../shared/schemas/api/summary.schema';
import { SummaryService } from '../../services/summary.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { NotFoundError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const id = getRouterParam(event, 'id');

        if (!id) {
            throw new NotFoundError('Summary');
        }

        return summaryItemSchema.parse(await new SummaryService().get(uid, id));
    } catch (error) {
        throw toH3Error(error);
    }
});
