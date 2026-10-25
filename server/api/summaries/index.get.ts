import { defineEventHandler } from 'h3';
import { z } from 'zod';
import { summaryItemSchema } from '../../../shared/schemas/api/summary.schema';
import { SummaryService } from '../../services/summary.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        return z.array(summaryItemSchema).parse(await new SummaryService().list(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
