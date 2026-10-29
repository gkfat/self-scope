import {
    defineEventHandler, setResponseHeader,
} from 'h3';
import { z } from 'zod';
import { reportSnapshotItemSchema } from '../../../shared/schemas/api/reportSnapshot.schema';
import { ReportSnapshotService } from '../../services/reportSnapshot.service';
import { SingleAnalysisService } from '../../services/singleAnalysis.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        setResponseHeader(event, 'Cache-Control', 'private, no-store');

        const snapshots = new ReportSnapshotService();
        const items = await snapshots.list(uid);
        const running = items.filter((item) => item.aiStatus === 'GENERATING');

        if (running.length === 0) return z.array(reportSnapshotItemSchema).parse(items);

        // An analysis whose worker vanished is failed and refunded here, where the member would see it hang
        const analysis = new SingleAnalysisService();

        await Promise.all(running.map((item) => analysis.reapIfStale(uid, item.id)));

        return z.array(reportSnapshotItemSchema).parse(await snapshots.list(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
