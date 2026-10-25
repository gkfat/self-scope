import { defineEventHandler } from 'h3';
import { z } from 'zod';
import { testAttemptItemSchema } from '../../shared/schemas/api/test.schema';
import { TestService } from '../services/test.service';
import { requireAuth } from '../utils/auth';
import { toH3Error } from '../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        return z.array(testAttemptItemSchema).parse(await new TestService().listAttempts(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
