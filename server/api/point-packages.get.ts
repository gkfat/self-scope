import { defineEventHandler } from 'h3';
import { z } from 'zod';
import { pointPackageItemSchema } from '../../shared/schemas/api/payment.schema';
import { PaymentService } from '../services/payment.service';
import { toH3Error } from '../utils/errorHandler';

export default defineEventHandler(async () => {
    try {
        return z.array(pointPackageItemSchema).parse(await new PaymentService().listPackages());
    } catch (error) {
        throw toH3Error(error);
    }
});
