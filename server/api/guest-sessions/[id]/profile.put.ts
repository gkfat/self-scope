import {
    defineEventHandler, getRouterParam, readBody,
} from 'h3';
import { profileInputSchema } from '../../../../shared/schemas/api/profile.schema';
import { guestSessionIdSchema } from '../../../../shared/schemas/firestore/guestSession.schema';
import { GuestSessionService } from '../../../services/guestSession.service';
import { toH3Error } from '../../../utils/errorHandler';
import {
    NotFoundError, ValidationError,
} from '../../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const sessionId = guestSessionIdSchema.safeParse(getRouterParam(event, 'id'));

        // A malformed id cannot exist; answer exactly like an unknown one.
        if (!sessionId.success) {
            throw new NotFoundError('Guest session');
        }

        const profile = profileInputSchema.safeParse(await readBody(event));

        if (!profile.success) {
            throw new ValidationError('Invalid profile', { issues: profile.error.issues });
        }

        return await new GuestSessionService().saveProfile(sessionId.data, profile.data);
    } catch (error) {
        throw toH3Error(error);
    }
});
