import {
    defineEventHandler, getQuery,
} from 'h3';
import {
    pointTransactionListSchema, pointTransactionQuerySchema,
} from '../../../shared/schemas/api/points.schema';
import { PointService } from '../../services/point.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const query = pointTransactionQuerySchema.safeParse(getQuery(event));

        if (!query.success) {
            throw new ValidationError('Invalid query', { issues: query.error.issues });
        }

        const result = await new PointService().listTransactions(uid, query.data.limit, query.data.cursor);

        return pointTransactionListSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
