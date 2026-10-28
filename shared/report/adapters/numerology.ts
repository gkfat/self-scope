import { numerologyTermsOf } from '../../ontology/mappings/numerology';
import { buildBasis } from '../../utils/analysisBasis';
import {
    birthdayNumber, lifePathNumber, personalYearNumber,
} from '../../utils/numerology';
import {
    adviceOfBody, readingsOfBody, type FixedContentBody,
} from './common';
import type { SystemReportInput } from '../types';

/**
 * The life path number report. The year number is the one thing here that depends on the date: it is kept as a
 * time-sensitive fact with the date it was made for (it has no reading of its own, only the number).
 */
export function numerologyReportInput(params: { birthDate: string; today: string; body: FixedContentBody }): SystemReportInput {
    const lifePath = lifePathNumber(params.birthDate);
    const year = Number(params.today.slice(0, 4));
    const terms = numerologyTermsOf(lifePath);

    return {
        system: 'NUMEROLOGY',
        position: `生命靈數 ${lifePath}`,
        facts: [
            {
                label: '生命靈數', value: String(lifePath), term: terms[0],
            }, {
                label: '生日數', value: String(birthdayNumber(params.birthDate)),
            },
        ],
        interpretations: readingsOfBody(params.body, terms[0]),
        traits: terms,
        timeFacts: [
            {
                text: `依生命靈數流年，${year} 年的流年數是 ${personalYearNumber(params.birthDate, year)}。`, asOf: params.today,
            },
        ],
        advice: adviceOfBody(params.body),
        disclaimer: params.body.disclaimer,
        basis: [buildBasis('NUMEROLOGY', { birthDate: params.birthDate })],
    };
}
