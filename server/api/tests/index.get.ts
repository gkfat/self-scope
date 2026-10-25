import { defineEventHandler } from 'h3';
import { z } from 'zod';
import { testSummarySchema } from '../../../shared/schemas/api/test.schema';
import { TestService } from '../../services/test.service';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async () => {
    try {
        return z.array(testSummarySchema).parse(await new TestService().listTests());
    } catch (error) {
        throw toH3Error(error);
    }
});
