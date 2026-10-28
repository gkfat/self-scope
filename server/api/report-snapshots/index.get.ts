import {
    defineEventHandler, setResponseHeader,
} from 'h3';
import { z } from 'zod';
import { reportSnapshotItemSchema } from '../../../shared/schemas/api/reportSnapshot.schema';
import { ReportSnapshotService } from '../../services/reportSnapshot.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        setResponseHeader(event, 'Cache-Control', 'private, no-store');

        return z.array(reportSnapshotItemSchema).parse(await new ReportSnapshotService().list(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
