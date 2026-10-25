import { defineEventHandler } from 'h3';
import { deleteResultSchema } from '../../../shared/schemas/api/account.schema';
import { DeletionService } from '../../services/deletion.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        return deleteResultSchema.parse(await new DeletionService().deleteAccount(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
