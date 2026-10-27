import {
    defineEventHandler, readBody,
} from 'h3';
import {
    baziRequestSchema, baziResponseSchema,
} from '../../../shared/schemas/api/bazi.schema';
import { BaziService } from '../../services/bazi.service';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const body = baziRequestSchema.safeParse(await readBody(event));

        if (!body.success) {
            throw new ValidationError('Invalid birth data', { issues: body.error.issues });
        }

        return baziResponseSchema.parse(await new BaziService().calculate(body.data));
    } catch (error) {
        throw toH3Error(error);
    }
});
