import { BaseService } from './base.service';
import { computeNatalChart } from '../astrology/natalChart';
import {
    describeLocalTime, localTimeToUtc,
} from '../humanDesign/localTime';
import { findCity } from '../../shared/constants/cities';
import type {
    NatalChartRequest, NatalChartResponse,
} from '../../shared/schemas/api/natalChart.schema';
import { ValidationError } from '../../shared/types/errors';

/**
 * The signs of the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn and the ascendant for a birth moment and
 * place. A fixed calculation: nothing is stored, no AI is involved (RULE-017).
 */
export class NatalChartService extends BaseService {
    protected serviceName = 'natal-chart';

    calculate(request: NatalChartRequest): NatalChartResponse {
        const city = findCity(request.birthPlace);

        if (!city) {
            throw new ValidationError('birthPlace is not in the preset city list');
        }

        const birthUtc = localTimeToUtc(request.birthDate, request.birthTime, city.timeZone);

        return {
            ...computeNatalChart(birthUtc, city.lat, city.lng),
            timeNote: describeLocalTime(request.birthDate, request.birthTime, city.timeZone),
        };
    }
}
