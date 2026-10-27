import {
    defineEventHandler, setResponseHeader,
} from 'h3';
import { dailyRuneResponseSchema } from '../../../shared/schemas/api/rune.schema';
import { RuneService } from '../../services/rune.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        // Identity comes from the token and the date from the server clock; nothing in the request is used.
        const { uid } = await requireAuth(event);

        setResponseHeader(event, 'Cache-Control', 'private, no-store');

        return dailyRuneResponseSchema.parse(await new RuneService().draw(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
