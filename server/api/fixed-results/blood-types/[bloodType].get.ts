import {
    defineEventHandler, getRouterParam,
} from 'h3';
import {
    bloodTypeParamSchema, fixedResultResponseSchema,
} from '../../../../shared/schemas/api/fixedResult.schema';
import { FixedContentService } from '../../../services/fixedContent.service';
import { toH3Error } from '../../../utils/errorHandler';
import {
    NotFoundError, ValidationError,
} from '../../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const bloodType = bloodTypeParamSchema.safeParse(getRouterParam(event, 'bloodType'));

        if (!bloodType.success) {
            throw new ValidationError('bloodType must be one of A, B, O, AB, UNKNOWN');
        }

        // An unknown blood type is not analysed at all (RULE-002).
        if (bloodType.data === 'UNKNOWN') {
            throw new NotFoundError('Blood type analysis');
        }

        const result = await new FixedContentService().getPublished('BLOOD', bloodType.data);

        return fixedResultResponseSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
