import {
    GALACTIC_TONES, SOLAR_SEALS,
} from '../../constants/mayaKin';
import { mayaKinTermsOf } from '../../ontology/mappings/mayaKin';
import { buildBasis } from '../../utils/analysisBasis';
import {
    kinName, kinOf, sealName, toneName,
} from '../../utils/mayaKin';
import {
    adviceOfBody, readingsOfBody, type FixedContentBody,
} from './common';
import type { SystemReportInput } from '../types';

/**
 * The birth Kin report. The seal and the tone are the facts the mapping works on; their keywords are shown as the
 * Dreamspell table gives them. The report says plainly that this is the Dreamspell calendar of the twentieth century and
 * not an old Maya one.
 */
export function mayaKinReportInput(params: { birthDate: string; body: FixedContentBody }): SystemReportInput {
    const kin = kinOf(params.birthDate);
    const [sealTerm, toneTerm] = mayaKinTermsOf(kin);
    const seal = SOLAR_SEALS[kin.solarSeal - 1];
    const tone = GALACTIC_TONES[kin.galacticTone - 1];

    return {
        system: 'MAYA_KIN',
        position: `Kin ${kin.kinNumber}・${kinName(kin)}`,
        facts: [
            {
                label: 'Kin 編號', value: String(kin.kinNumber),
            },
            {
                label: '圖騰', value: sealName(kin.solarSeal), term: sealTerm,
            },
            {
                label: '圖騰的關鍵字', value: seal ? seal.keywords.join('、') : '',
            },
            {
                label: '調性', value: toneName(kin.galacticTone), term: toneTerm,
            },
            {
                label: '調性的關鍵字', value: tone ? tone.keyword : '',
            },
            {
                label: '曆法', value: 'Dreamspell（二十世紀提出的新曆法，不是古瑪雅原有的曆法）',
            },
        ].filter((fact) => fact.value !== ''),
        interpretations: readingsOfBody(params.body),
        traits: mayaKinTermsOf(kin),
        advice: adviceOfBody(params.body),
        disclaimer: params.body.disclaimer,
        basis: [buildBasis('MAYA_KIN', { birthDate: params.birthDate })],
    };
}
