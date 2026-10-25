import {
    defineEventHandler, getRouterParam,
} from 'h3';
import { publicTestSchema } from '../../../shared/schemas/api/test.schema';
import { TestService } from '../../services/test.service';
import { toH3Error } from '../../utils/errorHandler';
import { NotFoundError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const testId = getRouterParam(event, 'id');

        if (!testId) {
            throw new NotFoundError('Test');
        }

        return publicTestSchema.parse(await new TestService().getTest(testId));
    } catch (error) {
        throw toH3Error(error);
    }
});
