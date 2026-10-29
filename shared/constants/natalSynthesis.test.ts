import {
    describe, expect, it,
} from 'vitest';
import {
    ASPECTS, NATAL_BODIES, 
} from './natal';
import {
    ASPECT_BALANCE_READINGS, ASPECT_RELATIONS, ELEMENT_LEAD_READINGS, ELEMENT_MISSING_READINGS, HOUSE_AREAS, HOUSE_GROUPS, MODE_LEAD_READINGS, aspectReading, bodyInHouseReading,
    chartRulerReading, houseGatherReading,
} from './natalSynthesis';
import { NATAL_LABELS } from './natalLabels';

const banned = /(症|病|診斷|治療|一定|必然|保證|注定)/;
const name = (body: keyof typeof NATAL_LABELS) => NATAL_LABELS[body].name;

describe('the readings of the houses and aspects', () => {
    it('cover the twelve houses, and the four groups hold each house once', () => {
        expect(HOUSE_AREAS).toHaveLength(12);
        expect(HOUSE_GROUPS.flatMap((group) => group.houses).sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
    });

    it('read every body in every house: 10 x 12, short and tentative', () => {
        for (const body of NATAL_BODIES) {
            for (let house = 1; house <= 12; house++) {
                const text = bodyInHouseReading(body, house);

                expect(text.length, `${body} ${house}`).toBeGreaterThanOrEqual(20);
                expect(text.length, `${body} ${house}`).toBeLessThanOrEqual(110);
                expect(text, `${body} ${house}`).toMatch(/傾向|容易/);
                expect(text, `${body} ${house}`).not.toMatch(banned);
            }
        }
    });

    it('say of the slow bodies that they are a background shared with a generation', () => {
        expect(bodyInHouseReading('PLUTO', 1)).toContain('同世代共有');
        expect(bodyInHouseReading('SUN', 1)).not.toContain('同世代共有');
    });

    it('read every pair of bodies in every kind of aspect, saying so when it is tight', () => {
        for (const { type } of ASPECTS) {
            for (const [index, first] of NATAL_BODIES.entries()) {
                for (const second of NATAL_BODIES.slice(index + 1)) {
                    const loose = aspectReading(type, first, second, 5, name);

                    expect(loose, `${type} ${first} ${second}`).toContain(ASPECT_RELATIONS[type].relation);
                    expect(loose, `${type} ${first} ${second}`).not.toMatch(banned);
                    expect(loose).not.toContain('相差很小');
                    expect(aspectReading(type, first, second, 1, name)).toContain('相差很小');
                }
            }
        }
    });

    it('give each conclusion about the chart as a whole a title without a colon, so that it can be told from its text', () => {
        const titles = [
            ...Object.values(ASPECT_BALANCE_READINGS).map((item) => item.title),
            houseGatherReading('太陽、月亮、水星', 5).title,
            chartRulerReading('金星', 7).title,
        ];

        for (const title of titles) {
            expect(title.length).toBeGreaterThan(0);
            expect(title).not.toContain('：');
        }

        expect(houseGatherReading('土星、天王星、海王星', 3).title).toBe('土星、天王星、海王星集中在第 3 宮');
    });

    it('keep the sentences about the chart as a whole tentative, and free of diagnosis and promises', () => {
        const all = [
            ...Object.values(ELEMENT_LEAD_READINGS),
            ...Object.values(ELEMENT_MISSING_READINGS),
            ...Object.values(MODE_LEAD_READINGS),
            ...Object.values(ASPECT_BALANCE_READINGS).map((item) => item.text),
            houseGatherReading('太陽、月亮、水星', 5).text,
            chartRulerReading('金星', 7).text,
        ];

        for (const text of all) {
            expect(text).toMatch(/可能|容易|傾向|需要/);
            expect(text).not.toMatch(banned);
        }
    });
});
