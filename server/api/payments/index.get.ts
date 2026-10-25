import { defineEventHandler } from 'h3';
import { z } from 'zod';
import { paymentItemSchema } from '../../../shared/schemas/api/payment.schema';
import { PaymentService } from '../../services/payment.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);

        return z.array(paymentItemSchema).parse(await new PaymentService().listPayments(uid));
    } catch (error) {
        throw toH3Error(error);
    }
});
