import {
    defineEventHandler, getRouterParam,
} from 'h3';
import { claimGuestSessionResponseSchema } from '../../../../shared/schemas/api/guest.schema';
import { guestSessionIdSchema } from '../../../../shared/schemas/firestore/guestSession.schema';
import { GuestSessionService } from '../../../services/guestSession.service';
import { requireAuth } from '../../../utils/auth';
import { toH3Error } from '../../../utils/errorHandler';
import { GoneError } from '../../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const sessionId = guestSessionIdSchema.safeParse(getRouterParam(event, 'id'));

        if (!sessionId.success) {
            throw new GoneError('Guest session expired or not found');
        }

        return claimGuestSessionResponseSchema.parse(await new GuestSessionService().claim(sessionId.data, uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
