import { defineEventHandler } from 'h3';
import { createGuestSessionResponseSchema } from '../../../shared/schemas/api/guest.schema';
import { GuestSessionService } from '../../services/guestSession.service';
import { RateLimitService } from '../../services/rateLimit.service';
import { requireServerSecret } from '../../../config/config';
import { getClientIp } from '../../utils/clientIp';
import { toH3Error } from '../../utils/errorHandler';
import { keyedHash } from '../../utils/hmac';

const SESSIONS_PER_IP_PER_HOUR = 20;
const ONE_HOUR_MS = 60 * 60 * 1000;

export default defineEventHandler(async (event) => {
    try {
        const ipHash = keyedHash(`ip:${getClientIp(event)}`, requireServerSecret('welcomeGrantHmacKey'));

        await new RateLimitService().consume(`guestSession_${ipHash}`, SESSIONS_PER_IP_PER_HOUR, ONE_HOUR_MS);

        const {
            sessionId, expiresAt, 
        } = await new GuestSessionService().create();

        return createGuestSessionResponseSchema.parse({
            sessionId,
            expiresAt: new Date(expiresAt).toISOString(),
        });
    } catch (error) {
        throw toH3Error(error);
    }
});
