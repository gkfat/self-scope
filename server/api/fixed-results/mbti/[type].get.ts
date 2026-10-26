import {
    defineEventHandler, getRouterParam,
} from 'h3';
import { fixedResultResponseSchema } from '../../../../shared/schemas/api/fixedResult.schema';
import { mbtiTypeSchema } from '../../../../shared/schemas/common';
import { FixedContentService } from '../../../services/fixedContent.service';
import { toH3Error } from '../../../utils/errorHandler';
import { ValidationError } from '../../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const type = mbtiTypeSchema.safeParse(getRouterParam(event, 'type'));

        if (!type.success) {
            throw new ValidationError('type must be one of the 16 MBTI types');
        }

        const result = await new FixedContentService().getPublished('MBTI', type.data);

        return fixedResultResponseSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
