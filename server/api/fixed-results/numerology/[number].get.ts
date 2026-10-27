import {
    defineEventHandler, getRouterParam,
} from 'h3';
import { fixedResultResponseSchema } from '../../../../shared/schemas/api/fixedResult.schema';
import { NUMEROLOGY_NUMBERS } from '../../../../shared/utils/fixedContentKeys';
import { FixedContentService } from '../../../services/fixedContent.service';
import { toH3Error } from '../../../utils/errorHandler';
import { ValidationError } from '../../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const number = getRouterParam(event, 'number') ?? '';

        if (!(NUMEROLOGY_NUMBERS as readonly string[]).includes(number)) {
            throw new ValidationError('number must be 1-9, 11, 22 or 33');
        }

        const result = await new FixedContentService().getPublished('NUMEROLOGY', number);

        return fixedResultResponseSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
