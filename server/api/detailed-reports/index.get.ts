import { defineEventHandler } from 'h3';
import { z } from 'zod';
import { reportItemSchema } from '../../../shared/schemas/api/detailedReport.schema';
import { DetailedReportService } from '../../services/detailedReport.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        return z.array(reportItemSchema).parse(await new DetailedReportService().list(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
