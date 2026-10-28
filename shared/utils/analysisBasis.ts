import { analysisBasisSchema } from '../schemas/analysisBasis.schema';
import type {
    AnalysisBasis, AnalysisSystem, BasisInputs,
} from '../schemas/analysisBasis.schema';
import type { ReportDimension } from '../schemas/firestore/detailedReport.schema';
import { RUNE_DRAW_VERSION } from './rune';
import { TAROT_DRAW_VERSION } from './tarot';

/** Systems whose version is a constant here; MBTI takes the version of the test that was answered. */
type VersionedSystem = Exclude<AnalysisSystem, 'MBTI'>;

/**
 * Version of each system's rules. Raise the one of a system whenever its calculation changes behavior (how a month is
 * cut at a solar term, how February 29 is handled, which body maps to which gate...): a stored basis is how a past
 * result is explained once the rules have moved on.
 */
export const RULE_VERSIONS: Readonly<Record<VersionedSystem, string>> = {
    ZODIAC: 'zodiac-v1',
    BAZI: 'bazi-v1',
    NATAL_CHART: 'natal-v1',
    HUMAN_DESIGN: 'human-design-v1',
    NUMEROLOGY: 'numerology-v1',
    MAYA_KIN: 'dreamspell-v1',
    HOROSCOPE: 'horoscope-v1',
    TAROT: TAROT_DRAW_VERSION,
    RUNE: RUNE_DRAW_VERSION,
};

const METHODS: Readonly<Record<AnalysisSystem, string>> = {
    ZODIAC: 'sun-sign-from-birth-date',
    BAZI: 'bazi-four-pillars',
    NATAL_CHART: 'tropical-natal-chart',
    HUMAN_DESIGN: 'human-design-chart',
    NUMEROLOGY: 'life-path-number',
    MAYA_KIN: 'dreamspell-kin',
    HOROSCOPE: 'whole-sign-transit',
    MBTI: 'mbti-style-questionnaire',
    TAROT: 'daily-draw',
    RUNE: 'daily-draw',
};

/** The basis of a system whose rules are versioned here. */
export function buildBasis(system: VersionedSystem, inputs: BasisInputs): AnalysisBasis {
    return analysisBasisSchema.parse({
        system,
        method: METHODS[system],
        ruleVersion: RULE_VERSIONS[system],
        inputs,
    });
}

/** The basis of an MBTI result: the scoring rule belongs to the version of the test that was answered. */
export function buildMbtiBasis(testVersion: string, inputs: BasisInputs = {}): AnalysisBasis {
    return analysisBasisSchema.parse({
        system: 'MBTI',
        method: METHODS.MBTI,
        ruleVersion: testVersion,
        inputs,
    });
}

type ReportBasisParams = {
    dimensions: readonly ReportDimension[];
    birth: {
        birthDate: string;
        birthTime?: string | null;
        birthPlace?: string | null;
    } | null;
    /** Version of the member's latest saved test, when the report used it. */
    testVersion: string | null;
};

const BIRTH_DATE_ONLY: Readonly<Partial<Record<ReportDimension, VersionedSystem>>> = {
    ZODIAC: 'ZODIAC',
    NUMEROLOGY: 'NUMEROLOGY',
    MAYA_KIN: 'MAYA_KIN',
};

const BIRTH_MOMENT: Readonly<Partial<Record<ReportDimension, VersionedSystem>>> = {
    BAZI: 'BAZI',
    HUMAN_DESIGN: 'HUMAN_DESIGN',
};

/**
 * The basis of every chosen dimension that was calculated, in the order the dimensions are listed.
 * Blood type is a stated fact and has none; MBTI has one only when the latest test was used.
 */
export function buildReportBasis(params: ReportBasisParams): AnalysisBasis[] {
    const basis: AnalysisBasis[] = [];

    for (const dimension of params.dimensions) {
        const dateOnly = BIRTH_DATE_ONLY[dimension];
        const moment = BIRTH_MOMENT[dimension];

        if (dateOnly || moment) {
            if (!params.birth) {
                throw new Error(`birth data is required for the ${dimension} basis`);
            }

            basis.push(buildBasis(
                (dateOnly ?? moment) as VersionedSystem,
                dateOnly
                    ? { birthDate: params.birth.birthDate }
                    : {
                        birthDate: params.birth.birthDate,
                        birthTime: params.birth.birthTime ?? null,
                        birthPlace: params.birth.birthPlace ?? null,
                    },
            ));
            continue;
        }

        if (dimension === 'MBTI' && params.testVersion) {
            basis.push(buildMbtiBasis(params.testVersion));
        }
    }

    return basis;
}
