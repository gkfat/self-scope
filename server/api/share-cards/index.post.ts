import {
    defineEventHandler, readBody,
} from 'h3';
import {
    shareCardRequestSchema, shareCardSchema,
} from '../../../shared/schemas/api/shareCard.schema';
import { ShareCardService } from '../../services/shareCard.service';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const request = shareCardRequestSchema.safeParse(await readBody(event));

        if (!request.success) {
            throw new ValidationError('Invalid share request', { issues: request.error.issues });
        }

        // Optional auth: the middleware set the user when a token was sent.
        const uid: string | null = event.context.auth?.uid ?? null;

        return shareCardSchema.parse(await new ShareCardService().create(request.data, uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
