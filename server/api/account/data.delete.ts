import {
    defineEventHandler, readBody,
} from 'h3';
import {
    deleteDataRequestSchema, deleteResultSchema,
} from '../../../shared/schemas/api/account.schema';
import { DeletionService } from '../../services/deletion.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const parsed = deleteDataRequestSchema.safeParse(await readBody(event));

        if (!parsed.success) {
            throw new ValidationError('At least one valid scope is required', { issues: parsed.error.issues });
        }

        const result = await new DeletionService().deleteData(uid, parsed.data.scopes);

        return deleteResultSchema.parse(result);
    } catch (error) {
        throw toH3Error(error);
    }
});
