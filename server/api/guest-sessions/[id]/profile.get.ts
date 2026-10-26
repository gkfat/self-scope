import {
    defineEventHandler, getRouterParam,
} from 'h3';
import { guestProfileResponseSchema } from '../../../../shared/schemas/api/guest.schema';
import { guestSessionIdSchema } from '../../../../shared/schemas/firestore/guestSession.schema';
import { GuestSessionService } from '../../../services/guestSession.service';
import { toH3Error } from '../../../utils/errorHandler';
import { NotFoundError } from '../../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const sessionId = guestSessionIdSchema.safeParse(getRouterParam(event, 'id'));

        // A malformed id cannot exist; answer exactly like an unknown one.
        if (!sessionId.success) {
            throw new NotFoundError('Guest session');
        }

        return guestProfileResponseSchema.parse(await new GuestSessionService().getProfile(sessionId.data));
    } catch (error) {
        throw toH3Error(error);
    }
});
