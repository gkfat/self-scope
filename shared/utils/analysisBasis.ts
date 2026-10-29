import { analysisBasisSchema } from '../schemas/analysisBasis.schema';
import type {
    AnalysisBasis, AnalysisSystem, BasisInputs,
} from '../schemas/analysisBasis.schema';
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
    NATAL_CHART: 'natal-v2',
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
