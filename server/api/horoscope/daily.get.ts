import {
    defineEventHandler, setResponseHeader,
} from 'h3';
import { dailyHoroscopeResponseSchema } from '../../../shared/schemas/api/horoscope.schema';
import { HoroscopeService } from '../../services/horoscope.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        // The sign comes from the saved profile and the date from the server clock; nothing in the request is used.
        const { uid } = await requireAuth(event);

        setResponseHeader(event, 'Cache-Control', 'private, no-store');

        return dailyHoroscopeResponseSchema.parse(await new HoroscopeService().getToday(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
