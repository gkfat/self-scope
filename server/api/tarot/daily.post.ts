import {
    defineEventHandler, setResponseHeader,
} from 'h3';
import { dailyTarotResponseSchema } from '../../../shared/schemas/api/tarot.schema';
import { TarotService } from '../../services/tarot.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        // Identity comes from the token and the date from the server clock; nothing in the request is used.
        const { uid } = await requireAuth(event);

        setResponseHeader(event, 'Cache-Control', 'private, no-store');

        return dailyTarotResponseSchema.parse(await new TarotService().draw(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
