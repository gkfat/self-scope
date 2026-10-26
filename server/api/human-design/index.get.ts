import { defineEventHandler } from 'h3';
import { humanDesignResponseSchema } from '../../../shared/schemas/api/humanDesign.schema';
import { HumanDesignService } from '../../services/humanDesign.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        return humanDesignResponseSchema.parse(await new HumanDesignService().getSaved(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
