import {
    defineEventHandler, getRouterParam, setResponseHeader,
} from 'h3';
import { reportSnapshotDetailSchema } from '../../../shared/schemas/api/reportSnapshot.schema';
import { ReportSnapshotService } from '../../services/reportSnapshot.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { NotFoundError } from '../../../shared/types/errors';

/**
 * Snapshots live under the caller's own user document, so another member's id is simply "not found".
 */
export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const id = getRouterParam(event, 'id');

        if (!id) {
            throw new NotFoundError('Report snapshot');
        }

        setResponseHeader(event, 'Cache-Control', 'private, no-store');

        return reportSnapshotDetailSchema.parse(await new ReportSnapshotService().get(uid, id));
    } catch (error) {
        throw toH3Error(error);
    }
});
