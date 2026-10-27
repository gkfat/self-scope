import {
    describe, expect, it,
} from 'vitest';
import { buildMayaKinReportFacts } from './reportFacts';

describe('buildMayaKinReportFacts', () => {
    it('names the Kin of a birth date with its seal and tone', () => {
        // 2012-12-21 is Kin 207, the Crystal Blue Hand
        expect(buildMayaKinReportFacts('2012-12-21')).toEqual({
            kinNumber: 207,
            name: '水晶的藍手',
            solarSeal: {
                number: 7, name: '藍手', englishName: 'Hand', keywords: ['實踐', '療癒'],
            },
            galacticTone: {
                number: 12, name: '水晶', englishName: 'Crystal', keyword: '合作',
            },
        });
    });

    it('gives 29 February the facts of 28 February', () => {
        expect(buildMayaKinReportFacts('1996-02-29')).toEqual(buildMayaKinReportFacts('1996-02-28'));
    });

    it('carries nothing but the Kin: no birth date in the facts', () => {
        expect(JSON.stringify(buildMayaKinReportFacts('1990-05-17'))).not.toContain('1990');
    });
});
