import {
    defineEventHandler, readBody, setResponseStatus,
} from 'h3';
import {
    checkoutSessionSchema, createPaymentRequestSchema,
} from '../../../shared/schemas/api/payment.schema';
import { PaymentService } from '../../services/payment.service';
import { requireAuth } from '../../utils/auth';
import { toH3Error } from '../../utils/errorHandler';
import { ValidationError } from '../../../shared/types/errors';

export default defineEventHandler(async (event) => {
    try {
        const { uid } = await requireAuth(event);
        const request = createPaymentRequestSchema.safeParse(await readBody(event));

        if (!request.success) {
            throw new ValidationError('Agreeing to the purchase terms is required', { issues: request.error.issues });
        }

        const session = await new PaymentService().createPayment(uid, request.data);

        setResponseStatus(event, 201);

        return checkoutSessionSchema.parse(session);
    } catch (error) {
        throw toH3Error(error);
    }
});
