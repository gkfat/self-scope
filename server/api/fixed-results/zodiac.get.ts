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
            throw new ValidationError('A valid birthDate (YYYY-MM-DD) is required', { issues: query.error.issues });
        }

        const result = await new FixedContentService().getPublished('ZODIAC', zodiacFromIsoDate(query.data.birthDate));

        return fixedResultResponseSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
