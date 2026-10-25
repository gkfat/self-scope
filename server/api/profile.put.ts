import {
    defineEventHandler, readBody,
} from 'h3';
import {
    profileInputSchema, profileResponseSchema,
} from '../../shared/schemas/api/profile.schema';
import { ProfileService } from '../services/profile.service';
import { requireAuth } from '../utils/auth';
import { toH3Error } from '../utils/errorHandler';
import { ValidationError } from '../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const parsed = profileInputSchema.safeParse(await readBody(event));

        if (!parsed.success) {
            throw new ValidationError('Invalid profile', { issues: parsed.error.issues });
        }

        const profile = await new ProfileService().updateProfile(uid, parsed.data);

        return profileResponseSchema.parse(profile);
    } catch (error) {
        throw toH3Error(error);
    }
});
