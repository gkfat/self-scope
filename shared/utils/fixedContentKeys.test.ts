import {
    describe, expect, it,
} from 'vitest';
import {
    baziContentKeys,
    expectedFixedContentIds,
    fixedContentId,
    isValidContentKey,
    kinContentKeys,
    tarotContentKeys,
} from './fixedContentKeys';

describe('isValidContentKey', () => {
    it('validates each content type', () => {
        expect(isValidContentKey('ZODIAC', 'aries')).toBe(true);
        expect(isValidContentKey('ZODIAC', 'INTJ')).toBe(false);
        expect(isValidContentKey('BLOOD', 'AB')).toBe(true);
        expect(isValidContentKey('BLOOD', 'UNKNOWN')).toBe(false);
        expect(isValidContentKey('MBTI', 'INTJ')).toBe(true);
        expect(isValidContentKey('NUMEROLOGY', '11')).toBe(true);
        expect(isValidContentKey('NUMEROLOGY', '10')).toBe(false);
    });

    it('accepts the legal BAZI keys', () => {
        for (const key of [
            'daymaster_甲',
            'element_strong_wood',
            'element_missing_water',
            'group_dominant_resource',
            'month_寅',
            'luck_偏印',
            'strength_taiwang',
            'pattern_建祿',
            'useful_strong_印',
            'useful_weak_官殺',
            'bone_21',
            'bone_71',
        ]) {
            expect(isValidContentKey('BAZI', key), key).toBe(true);
        }
    });

    it('rejects illegal BAZI keys', () => {
        for (const key of [
            'daymaster_子',
            'daymaster_',
            'group_dominant_other',
            'element_missing_air',
            'month_甲',
            'luck_好運',
            'strength_strongest',
            'pattern_比肩',
            'useful_strong_other',
            'useful_balanced_印',
            'bone_20',
            'bone_72',
            'bone_021',
            'bone_4.1',
            'aries',
        ]) {
            expect(isValidContentKey('BAZI', key), key).toBe(false);
        }
    });
});

describe('TAROT keys', () => {
    it('accepts every card in both orientations', () => {
        expect(tarotContentKeys()).toHaveLength(44);
        expect(isValidContentKey('TAROT', '0_upright')).toBe(true);
        expect(isValidContentKey('TAROT', '13_reversed')).toBe(true);
        expect(isValidContentKey('TAROT', '21_upright')).toBe(true);

        for (const key of tarotContentKeys()) expect(isValidContentKey('TAROT', key), key).toBe(true);
    });

    it('rejects cards outside the major arcana and malformed keys', () => {
        for (const key of [
            '22_upright',
            '-1_upright',
            '3_sideways',
            '03_upright',
            '3',
            'upright',
            '3_upright_extra',
            'aries',
        ]) {
            expect(isValidContentKey('TAROT', key), key).toBe(false);
        }
    });
});

describe('KIN keys', () => {
    it.each(['KIN_BIRTH', 'KIN_TODAY'] as const)('%s accepts 1 to 260', (type) => {
        expect(kinContentKeys()).toHaveLength(260);
        expect(isValidContentKey(type, '1')).toBe(true);
        expect(isValidContentKey(type, '207')).toBe(true);
        expect(isValidContentKey(type, '260')).toBe(true);

        for (const key of kinContentKeys()) expect(isValidContentKey(type, key), key).toBe(true);
    });

    it.each(['KIN_BIRTH', 'KIN_TODAY'] as const)('%s rejects keys outside 1 to 260 and malformed ones', (type) => {
        for (const key of [
            '0',
            '261',
            '-1',
            '01',
            '1.5',
            '',
            'one',
            '1_upright',
            ' 7',
        ]) {
            expect(isValidContentKey(type, key), key).toBe(false);
        }
    });
});

describe('RUNE keys', () => {
    it('accepts every rune upright, and reversed only for the ones that can be reversed', () => {
        expect(isValidContentKey('RUNE', '0_upright')).toBe(true);
        // Fehu can be reversed
        expect(isValidContentKey('RUNE', '0_reversed')).toBe(true);
        // Gebo looks the same upside down: upright only
        expect(isValidContentKey('RUNE', '6_upright')).toBe(true);
        expect(isValidContentKey('RUNE', '6_reversed')).toBe(false);
        expect(isValidContentKey('RUNE', '23_reversed')).toBe(true);
    });

    it('rejects every reversed key of the nine symmetric runes', () => {
        for (const index of [
            6,
            8,
            9,
            10,
            11,
            12,
            15,
            21,
            22,
        ]) {
            expect(isValidContentKey('RUNE', `${index}_upright`), `${index} upright`).toBe(true);
            expect(isValidContentKey('RUNE', `${index}_reversed`), `${index} reversed`).toBe(false);
        }
    });

    it('rejects runes outside the 24 and malformed keys', () => {
        for (const key of [
            '24_upright',
            '-1_upright',
            '3_sideways',
            '03_upright',
            '3',
            'upright',
            '3_upright_extra',
        ]) {
            expect(isValidContentKey('RUNE', key), key).toBe(false);
        }
    });
});

describe('HOROSCOPE keys', () => {
    it('accepts the five bodies in each of the twelve houses', () => {
        expect(isValidContentKey('HOROSCOPE', 'MOON_5')).toBe(true);
        expect(isValidContentKey('HOROSCOPE', 'VENUS_12')).toBe(true);
        expect(isValidContentKey('HOROSCOPE', 'SUN_1')).toBe(true);
        expect(isValidContentKey('HOROSCOPE', 'MARS_7')).toBe(true);
        expect(isValidContentKey('HOROSCOPE', 'MERCURY_3')).toBe(true);
    });

    it('rejects other bodies, houses out of 1 to 12 and malformed keys', () => {
        for (const key of [
            'MOON_0',
            'MOON_13',
            'MOON_05',
            'JUPITER_1',
            'SATURN_4',
            'MOON-5',
            'MOON_',
            'moon_5',
            '5',
            'MOON_5_extra',
        ]) {
            expect(isValidContentKey('HOROSCOPE', key), key).toBe(false);
        }
    });
});

describe('baziContentKeys', () => {
    const keys = baziContentKeys();
    const countOf = (prefix: string) => keys.filter((key) => key.startsWith(prefix)).length;

    it('lists 123 distinct keys', () => {
        expect(keys).toHaveLength(123);
        expect(new Set(keys).size).toBe(123);
    });

    it('splits them into the ten content groups', () => {
        expect(countOf('daymaster_')).toBe(10);
        expect(countOf('element_strong_')).toBe(5);
        expect(countOf('element_missing_')).toBe(5);
        expect(countOf('group_dominant_')).toBe(5);
        expect(countOf('month_')).toBe(12);
        expect(countOf('luck_')).toBe(10);
        expect(countOf('strength_')).toBe(5);
        expect(countOf('pattern_')).toBe(10);
        expect(countOf('useful_')).toBe(10);
        expect(countOf('bone_')).toBe(51);
    });

    it('is valid for every key it lists', () => {
        for (const key of keys) expect(isValidContentKey('BAZI', key), key).toBe(true);
    });
});

describe('expectedFixedContentIds', () => {
    const ids = expectedFixedContentIds();

    it('lists 44 single results, 123 BaZi contents and 44 tarot contents, 520 Kin contents and 39 rune contents and 60 sign horoscope contents, all unique', () => {
        expect(ids).toHaveLength(830);
        expect(new Set(ids).size).toBe(830);
        expect(ids.filter((id) => id.startsWith('ZODIAC_'))).toHaveLength(12);
        expect(ids.filter((id) => id.startsWith('BLOOD_'))).toHaveLength(4);
        expect(ids.filter((id) => id.startsWith('MBTI_'))).toHaveLength(16);
        expect(ids.filter((id) => id.startsWith('NUMEROLOGY_'))).toHaveLength(12);
        expect(ids.filter((id) => id.startsWith('BAZI_'))).toHaveLength(123);
        expect(ids.filter((id) => id.startsWith('TAROT_'))).toHaveLength(44);
        expect(ids.filter((id) => id.startsWith('KIN_BIRTH_'))).toHaveLength(260);
        expect(ids.filter((id) => id.startsWith('KIN_TODAY_'))).toHaveLength(260);
        expect(ids.filter((id) => id.startsWith('RUNE_'))).toHaveLength(39);
        expect(ids.filter((id) => id.startsWith('HOROSCOPE_'))).toHaveLength(60);
    });

    it('uses the same id format as fixedContentId', () => {
        expect(ids).toContain(fixedContentId('ZODIAC', 'aries'));
    });
});
