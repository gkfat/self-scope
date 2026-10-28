import { BaseService } from './base.service';
import { findAspects } from '../astrology/aspects';
import { buildHouses } from '../astrology/houses';
import {
    computeNatalChart, computeNatalLongitudes,
} from '../astrology/natalChart';
import {
    describeLocalTime, localTimeToUtc,
} from '../humanDesign/localTime';
import { findCity } from '../../shared/constants/cities';
import type {
    NatalChartRequest, NatalChartResponse,
} from '../../shared/schemas/api/natalChart.schema';
import type { NatalBody } from '../../shared/constants/natal';
import type { Zodiac } from '../../shared/schemas/common';
import { ValidationError } from '../../shared/types/errors';

/**
 * The signs of the ten bodies and the ascendant for a birth moment and a place, with the whole-sign houses, their
 * rulers and the major aspects. A fixed calculation: nothing is stored, no AI is involved (RULE-017).
 */
export class NatalChartService extends BaseService {
    protected serviceName = 'natal-chart';

    calculate(request: NatalChartRequest): NatalChartResponse {
        const city = findCity(request.birthPlace);

        if (!city) {
            throw new ValidationError('birthPlace is not in the preset city list');
        }

        const birthUtc = localTimeToUtc(request.birthDate, request.birthTime, city.timeZone);

        const chart = computeNatalChart(birthUtc, city.lat, city.lng);
        const signs = Object.fromEntries(Object.entries(chart.bodies).map(([body, placement]) => [body, placement.sign])) as Record<NatalBody, Zodiac>;

        return {
            ...chart,
            houses: buildHouses(chart.ascendant.sign, signs),
            aspects: findAspects(computeNatalLongitudes(birthUtc, city.lat, city.lng).bodies),
            timeNote: describeLocalTime(request.birthDate, request.birthTime, city.timeZone),
        };
    }
}
