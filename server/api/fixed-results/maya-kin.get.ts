import {
    defineEventHandler, getQuery,
} from 'h3';
import {
    birthKinQuerySchema, birthKinResponseSchema,
} from '../../../shared/schemas/api/mayaKin.schema';
import { MayaKinService } from '../../services/mayaKin.service';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const query = birthKinQuerySchema.safeParse(getQuery(event));

        if (!query.success) {
            throw new ValidationError('A real birthDate (YYYY-MM-DD) that is not in the future is required', { issues: query.error.issues });
        }

        return birthKinResponseSchema.parse(await new MayaKinService().birthKin(query.data.birthDate));
    } catch (error) {
        throw toH3Error(error);
    }
});
