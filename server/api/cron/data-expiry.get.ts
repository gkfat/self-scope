import {
    defineEventHandler, getHeader,
} from 'h3';
import { requireServerSecret } from '../../../config/config';
import { dataExpiryResultSchema } from '../../../shared/schemas/api/cron.schema';
import { DataExpiryService } from '../../services/dataExpiry.service';
import { assertCronAuthorized } from '../../utils/cronAuth';
import { toH3Error } from '../../utils/errorHandler';

/**
 * Daily retention job, called by Vercel Cron. Not covered by Firebase auth:
 * the CRON_SECRET bearer token is the credential.
 */
export default defineEventHandler(async (event) => {
    try {
        assertCronAuthorized(getHeader(event, 'authorization'), requireServerSecret('cronSecret'));

        return dataExpiryResultSchema.parse(await new DataExpiryService().run());
    } catch (error) {
        throw toH3Error(error);
    }
});
