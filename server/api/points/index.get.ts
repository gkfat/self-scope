import { defineEventHandler } from 'h3';
import { pointBalanceSchema } from '../../../shared/schemas/api/points.schema';
import { PointService } from '../../services/point.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        return pointBalanceSchema.parse(await new PointService().getBalance(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
