import {
    defineEventHandler, readBody,
} from 'h3';
import {
    loginRequestSchema, loginResponseSchema,
} from '../../../shared/schemas/api/auth.schema';
import { AccountService } from '../../services/account.service';
import { verifyIdToken } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const parsed = loginRequestSchema.safeParse(await readBody(event));

        if (!parsed.success) {
            throw new ValidationError('Invalid request: idToken is required');
        }

        const auth = await verifyIdToken(parsed.data.idToken);
        const result = await new AccountService().login(auth);

        return loginResponseSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
