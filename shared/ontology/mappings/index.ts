import type { MappingEntry } from '../schema';
import type { TermRegistry } from '../mapping';
import {
    BAZI_MAPPINGS, BAZI_TERMS,
} from './bazi';
import {
    BLOOD_MAPPINGS, BLOOD_TERMS,
} from './blood';
import {
    HUMAN_DESIGN_MAPPINGS, HUMAN_DESIGN_TERMS,
} from './humanDesign';
import {
    HOROSCOPE_MAPPINGS, HOROSCOPE_TERMS,
} from './horoscope';
import {
    MAYA_KIN_MAPPINGS, MAYA_KIN_TERMS,
} from './mayaKin';
import {
    MBTI_MAPPINGS, MBTI_TERMS,
} from './mbti';
import {
    NUMEROLOGY_MAPPINGS, NUMEROLOGY_TERMS,
} from './numerology';
import {
    RUNE_MAPPINGS, RUNE_TERMS,
} from './rune';
import {
    TAROT_MAPPINGS, TAROT_TERMS,
} from './tarot';
import {
    ZODIAC_MAPPINGS, ZODIAC_TERMS,
} from './zodiac';

/** The terms every system really has. Filled in system by system as its mapping is written. */
export const TERM_REGISTRY: TermRegistry = {
    ZODIAC: ZODIAC_TERMS,
    BLOOD: BLOOD_TERMS,
    MBTI: MBTI_TERMS,
    NUMEROLOGY: NUMEROLOGY_TERMS,
    MAYA_KIN: MAYA_KIN_TERMS,
    BAZI: BAZI_TERMS,
    HUMAN_DESIGN: HUMAN_DESIGN_TERMS,
    TAROT: TAROT_TERMS,
    RUNE: RUNE_TERMS,
    HOROSCOPE: HOROSCOPE_TERMS,
};

/** Every mapping entry, trait and state alike. */
export const ALL_MAPPINGS: readonly MappingEntry[] = [
    ...ZODIAC_MAPPINGS,
    ...BLOOD_MAPPINGS,
    ...MBTI_MAPPINGS,
    ...NUMEROLOGY_MAPPINGS,
    ...MAYA_KIN_MAPPINGS,
    ...BAZI_MAPPINGS,
    ...HUMAN_DESIGN_MAPPINGS,
    ...TAROT_MAPPINGS,
    ...RUNE_MAPPINGS,
    ...HOROSCOPE_MAPPINGS,
];

/** The mapping of the lasting traits only: no state of today is ever part of it. */
export const STABLE_MAPPINGS: readonly MappingEntry[] = ALL_MAPPINGS.filter((entry) => entry.kind === 'trait');

/** The mapping of today's states, held up against the stable traits and never added to them. */
export const STATE_MAPPINGS: readonly MappingEntry[] = ALL_MAPPINGS.filter((entry) => entry.kind === 'state');
