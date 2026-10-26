import {
    defineEventHandler, getHeader, readBody,
} from 'h3';
import {
    humanDesignRequestSchema, humanDesignResponseSchema,
} from '../../../shared/schemas/api/humanDesign.schema';
import { guestSessionIdSchema } from '../../../shared/schemas/firestore/guestSession.schema';
import { HumanDesignService } from '../../services/humanDesign.service';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        // An empty body is fine: everything then comes from the saved profile.
        const body = humanDesignRequestSchema.safeParse((await readBody(event)) ?? {});

        if (!body.success) {
            throw new ValidationError('Invalid birth data', { issues: body.error.issues });
        }

        // The middleware already authenticated the token if one was sent.
        const uid: string | null = event.context.auth?.uid ?? null;
        // A malformed guest header is treated as no session: the chart still shows, nothing is kept.
        const guest = guestSessionIdSchema.safeParse(getHeader(event, 'x-guest-session-id'));

        const result = await new HumanDesignService().calculate(body.data, {
            uid,
            guestSessionId: !uid && guest.success ? guest.data : null,
        });

        return humanDesignResponseSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
