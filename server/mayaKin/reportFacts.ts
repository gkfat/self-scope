import {
    GALACTIC_TONES, SOLAR_SEALS, SOLAR_SEAL_COLOR_LABELS,
} from '../../shared/constants/mayaKin';
import {
    kinName, kinOf,
} from '../../shared/utils/mayaKin';

export type MayaKinReportFacts = {
    kinNumber: number;
    /** The full name, tone then seal, e.g. 水晶的藍手 */
    name: string;
    solarSeal: { number: number; name: string; englishName: string; keywords: readonly string[] };
    galacticTone: { number: number; name: string; englishName: string; keyword: string };
};

/**
 * The Maya Kin facts a report may use: the Kin of the birth date with the names and keywords of its seal and tone.
 * Only the birth date goes in; nothing is stored. Written with Chinese labels, as the model reads them.
 */
export function buildMayaKinReportFacts(birthDate: string): MayaKinReportFacts {
    const kin = kinOf(birthDate);
    const seal = SOLAR_SEALS[kin.solarSeal - 1];
    const tone = GALACTIC_TONES[kin.galacticTone - 1];

    if (!seal || !tone) throw new RangeError(`Kin ${kin.kinNumber} has no seal or tone`);

    return {
        kinNumber: kin.kinNumber,
        name: kinName(kin),
        solarSeal: {
            number: seal.index,
            name: `${SOLAR_SEAL_COLOR_LABELS[seal.color]}${seal.name}`,
            englishName: seal.englishName,
            keywords: seal.keywords,
        },
        galacticTone: {
            number: tone.index, name: tone.name, englishName: tone.englishName, keyword: tone.keyword,
        },
    };
}
