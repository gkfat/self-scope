import {
    defineEventHandler, getHeader, getRouterParam, readBody,
} from 'h3';
import {
    submissionRequestSchema, submissionResponseSchema,
} from '../../../../shared/schemas/api/test.schema';
import { guestSessionIdSchema } from '../../../../shared/schemas/firestore/guestSession.schema';
import { TestService } from '../../../services/test.service';
import { toH3Error } from '../../../utils/errorHandler';
import {
    NotFoundError, ValidationError,
} from '../../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const testId = getRouterParam(event, 'id');

        if (!testId) {
            throw new NotFoundError('Test');
        }

        const body = submissionRequestSchema.safeParse(await readBody(event));

        if (!body.success) {
            throw new ValidationError('Invalid submission', { issues: body.error.issues });
        }

        // The middleware already authenticated the token if one was sent.
        const uid: string | null = event.context.auth?.uid ?? null;
        // A malformed guest header is treated as no session: the result still shows, nothing is kept.
        const guest = guestSessionIdSchema.safeParse(getHeader(event, 'x-guest-session-id'));

        const result = await new TestService().submit(testId, body.data, {
            uid,
            guestSessionId: !uid && guest.success ? guest.data : null,
        });

        return submissionResponseSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
