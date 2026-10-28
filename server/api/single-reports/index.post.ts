import {
    defineEventHandler, getHeader, readBody, setResponseHeader,
} from 'h3';
import {
    singleReportRequestSchema, singleReportResponseSchema, 
} from '../../../shared/schemas/api/singleReport.schema';
import { guestSessionIdSchema } from '../../../shared/schemas/firestore/guestSession.schema';
import { SingleReportService } from '../../services/singleReport.service';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

/**
 * The free single-dimension report of one system, for a signed-in member (kept) or a guest with a session (not kept).
 * Who asks comes from the token or the session header; the request only names the system.
 */
export default defineEventHandler(async (event) => {
    try {
        const body = singleReportRequestSchema.safeParse(await readBody(event));

        if (!body.success) {
            throw new ValidationError('A system with a single-dimension report is required', { issues: body.error.issues });
        }

        // The middleware already authenticated the token if one was sent.
        const uid: string | null = event.context.auth?.uid ?? null;
        // A malformed guest header is no session: the report then asks for the birth date
        const guest = guestSessionIdSchema.safeParse(getHeader(event, 'x-guest-session-id'));

        setResponseHeader(event, 'Cache-Control', 'private, no-store');

        return singleReportResponseSchema.parse(await new SingleReportService().generate(
            uid ? { uid } : { guestSessionId: guest.success ? guest.data : null },
            body.data.system,
        ));
    } catch (error) {
        throw toH3Error(error);
    }
});
