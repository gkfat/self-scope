import {
    defineEventHandler, readBody,
} from 'h3';
import {
    natalChartRequestSchema, natalChartResponseSchema,
} from '../../../shared/schemas/api/natalChart.schema';
import { NatalChartService } from '../../services/natalChart.service';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const body = natalChartRequestSchema.safeParse(await readBody(event));

        if (!body.success) {
            throw new ValidationError('Birth date, time and city are all required', { issues: body.error.issues });
        }

        return natalChartResponseSchema.parse(new NatalChartService().calculate(body.data));
    } catch (error) {
        throw toH3Error(error);
    }
});
