import { defineEventHandler } from 'h3';
import { profileResponseSchema } from '../../shared/schemas/api/profile.schema';
import { ProfileService } from '../services/profile.service';
import { requireAuth } from '../utils/auth';
import { toH3Error } from '../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        return profileResponseSchema.parse(await new ProfileService().getProfile(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
