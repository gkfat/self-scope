import {
    defineEventHandler, getQuery,
} from 'h3';
import {
    fixedResultResponseSchema, zodiacResultQuerySchema,
} from '../../../shared/schemas/api/fixedResult.schema';
import { FixedContentService } from '../../services/fixedContent.service';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';
import { zodiacFromIsoDate } from '../../../shared/utils/zodiac';

export default defineEventHandler(async (event) => {
    try {
        const query = zodiacResultQuerySchema.safeParse(getQuery(event));

        if (!query.success) {
            throw new ValidationError('A valid birthDate (YYYY-MM-DD) or sign is required', { issues: query.error.issues });
        }

        const sign = 'sign' in query.data ? query.data.sign : zodiacFromIsoDate(query.data.birthDate);
        const result = await new FixedContentService().getPublished('ZODIAC', sign);

        return fixedResultResponseSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
