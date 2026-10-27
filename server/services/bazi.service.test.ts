import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { BaziService } from './bazi.service';
import { baziResponseSchema } from '../../shared/schemas/api/bazi.schema';
import {
    NotFoundError, ValidationError, 
} from '../../shared/types/errors';
import { baziContentKeys } from '../../shared/utils/fixedContentKeys';
import { ganzhiLabel } from '../../shared/utils/bazi/ganzhi';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

/** "Today" for the luck cycles: 2026-10-27 12:00 Taipei */
const NOW = Date.parse('2026-10-27T12:00:00+08:00');

const reference = {
    birthDate: '1989-10-27', birthTime: '06:00', birthPlace: 'tw-taipei', gender: 'MALE',
} as const;

function contentDoc(key: string, status = 'PUBLISHED') {
    return {
        contentType: 'BAZI',
        key,
        body: {
            title: key, summary: `summary of ${key}`, disclaimer: '僅供娛樂與自我探索',
        },
        contentVersion: '1',
        status,
        updatedAt: 1,
        publishedAt: status === 'PUBLISHED' ? 1 : null,
    };
}

async function seedAll(db: FakeFirestore, skip: readonly string[] = []) {
    for (const key of baziContentKeys()) {
        if (!skip.includes(key)) await db.doc(`fixedContents/BAZI_${key}`).set(contentDoc(key));
    }
}

describe('BaziService.calculate', () => {
    let db: FakeFirestore;
    let service: BaziService;

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        await seedAll(db);
        service = new BaziService({ clock: () => NOW });
    });

    it('works out the reference chart (1989-10-27 06:00 Taipei, male)', async () => {
        const result = await service.calculate(reference);

        expect([
            result.pillars.year,
            result.pillars.month,
            result.pillars.day,
            result.pillars.hour!,
        ].map(ganzhiLabel)).toEqual([
            '己巳',
            '甲戌',
            '庚申',
            '己卯',
        ]);
        expect(result.dayMaster).toEqual({
            stem: '庚', element: 'metal', polarity: 'YANG',
        });
        expect(result.timeZone).toBe('Asia/Taipei');
        expect(result.timeZoneAssumed).toBe(false);
        expect(result.hasTime).toBe(true);
        expect(result.elementCounts).toEqual({
            wood: 2, fire: 1, earth: 3, metal: 2, water: 0,
        });
        expect(result.strength).toMatchObject({
            level: 'strong', side: 'STRONG', useful: {
                useful: 'wealth', favorable: 'output', avoid: ['peer'],
            },
        });
        expect(result.strength.pattern.key).toBe('偏印');
        expect(result.bone).toMatchObject({
            totalQian: 41, label: '4 兩 1 錢',
        });
        expect(ganzhiLabel(result.facts.mingGong!)).toBe('戊辰');
        expect(ganzhiLabel(result.facts.taiYuan)).toBe('乙丑');
        expect(result.borderline).toEqual([]);
    });

    it('gives the luck cycles and flow years when gender and time are there', async () => {
        const result = await service.calculate(reference);

        expect(result.luckStatus).toBe('OK');
        expect(result.luck?.direction).toBe('BACKWARD');
        expect(result.luck?.steps.map((step) => ganzhiLabel(step.pillar))).toEqual([
            '癸酉',
            '壬申',
            '辛未',
            '庚午',
            '己巳',
            '戊辰',
            '丁卯',
            '丙寅',
        ]);
        expect(result.luck?.currentOrder).toBe(4);
        expect(Object.keys(result.luck?.stepYears ?? {})).toHaveLength(8);
        expect(result.luck?.stepYears['1']).toHaveLength(10);
        expect(result.flowYears?.map((item) => item.year)).toEqual([
            2026,
            2027,
            2028,
            2029,
            2030,
        ]);
    });

    it('picks the interpretation texts the chart needs', async () => {
        const { interpretation } = await service.calculate(reference);

        expect(interpretation.dayMaster.key).toBe('daymaster_庚');
        expect(interpretation.strongElement?.key).toBe('element_strong_earth');
        expect(interpretation.missingElements.map((item) => item.key)).toEqual(['element_missing_water']);
        expect(interpretation.dominantGroup?.key).toBe('group_dominant_resource');
        expect(interpretation.month.key).toBe('month_戌');
        expect(interpretation.strength.key).toBe('strength_strong');
        expect(interpretation.pattern.key).toBe('pattern_偏印');
        expect(interpretation.usefulGods?.key).toBe('useful_strong_印');
        expect(interpretation.bone?.key).toBe('bone_41');
        // The fourth step 庚午 has a 庚 stem, a 比肩 against the 庚 day master
        expect(interpretation.currentLuck?.key).toBe('luck_比肩');
        expect(interpretation.dayMaster.disclaimer).toBeTruthy();
    });

    it('returns a response that matches the published schema', async () => {
        for (const request of [
            reference,
            { birthDate: '1989-10-27' },
            {
                birthDate: '2000-01-01', birthTime: '23:30', gender: 'FEMALE',
            } as const,
        ]) {
            expect(baziResponseSchema.safeParse(await service.calculate(request)).success).toBe(true);
        }
    });

    it('gives no luck cycles and says a gender is needed when none is given', async () => {
        const result = await service.calculate({
            ...reference, gender: null,
        });

        expect(result.luckStatus).toBe('NEEDS_GENDER');
        expect(result.luck).toBeNull();
        expect(result.flowYears).toBeNull();
        expect(result.interpretation.currentLuck).toBeNull();
    });

    it('gives three pillars, no stone weight and no luck when the time is unknown', async () => {
        const result = await service.calculate({
            birthDate: '1989-10-27', gender: 'MALE',
        });

        expect(result.hasTime).toBe(false);
        expect(result.pillars.hour).toBeNull();
        expect(result.chart).toHaveLength(3);
        expect(result.bone).toBeNull();
        expect(result.interpretation.bone).toBeNull();
        expect(result.luckStatus).toBe('NEEDS_TIME');
        expect(result.luck).toBeNull();
        // Flow years only need a gender
        expect(result.flowYears).toHaveLength(5);
        expect(result.facts.mingGong).toBeNull();
    });

    it('warns when the date has a 節 and the time is unknown', async () => {
        const result = await service.calculate({ birthDate: '2024-03-05' });

        expect(result.termDay).toEqual({
            term: '驚蟄', changesYear: false,
        });
    });

    it('flags a birth close to a 節', async () => {
        const result = await service.calculate({
            birthDate: '2024-03-05', birthTime: '10:00', birthPlace: 'tw-taipei',
        });

        expect(result.borderline).toContainEqual({
            kind: 'JIE', term: '驚蟄', minutes: 22,
        });
    });

    it('assumes Asia/Taipei without a place and says so, and uses the birthplace zone with one', async () => {
        const assumed = await service.calculate({
            birthDate: '1989-10-27', birthTime: '07:30',
        });
        const london = await service.calculate({
            birthDate: '1989-10-27', birthTime: '07:30', birthPlace: 'gb-london',
        });

        expect(assumed.timeZone).toBe('Asia/Taipei');
        expect(assumed.timeZoneAssumed).toBe(true);
        expect(london.timeZone).toBe('Europe/London');
        expect(london.timeZoneAssumed).toBe(false);
        // 07:30 in Taipei is 辰 hour; London was on summer time, so 07:30 BST is 06:30 standard time, still 卯 hour
        expect(assumed.pillars.hour?.branch).toBe('辰');
        expect(london.pillars.hour?.branch).toBe('卯');
    });

    it('applies the daylight-saving hour of old Taiwan before reading the day and hour', async () => {
        // 1975-07-01 00:30 was on summer time (UTC+9): standard time is 1975-06-30 23:30, a late 子 hour of the day before
        const result = await service.calculate({
            birthDate: '1975-07-01', birthTime: '00:30', birthPlace: 'tw-taipei',
        });

        expect(result.lateZi).toBe(true);
        expect(ganzhiLabel(result.pillars.day)).toBe('丁未');
        expect(result.pillars.hour?.branch).toBe('子');
    });

    it('rejects a city that is not in the list', async () => {
        await expect(service.calculate({
            birthDate: '1989-10-27', birthPlace: 'atlantis',
        })).rejects.toBeInstanceOf(ValidationError);
    });

    it('leaves out text a chart does not need (no clearly strong element, balanced strength)', async () => {
        let withoutStrong = null;
        let balanced = null;

        for (let day = 0; day < 4000 && !(withoutStrong && balanced); day++) {
            const birthDate = new Date(Date.UTC(2000, 0, 1) + day * 86400000).toISOString().slice(0, 10);
            const result = await service.calculate({
                birthDate, birthTime: '10:00',
            });

            if (!withoutStrong && result.interpretation.strongElement === null) withoutStrong = result;
            if (!balanced && result.strength.side === 'BALANCED') balanced = result;
        }

        expect(withoutStrong).not.toBeNull();
        expect(balanced).not.toBeNull();
        expect(balanced!.strength.useful).toBeNull();
        expect(balanced!.interpretation.usefulGods).toBeNull();
    });

    it('is a 404 when a needed text is not published, and writes nothing', async () => {
        await db.doc('fixedContents/BAZI_daymaster_庚').set(contentDoc('daymaster_庚', 'DRAFT'));

        const before = db.paths();

        await expect(service.calculate(reference)).rejects.toBeInstanceOf(NotFoundError);
        expect(db.paths()).toEqual(before);
    });

    it('is a 404 when a text is missing altogether', async () => {
        const empty = new FakeFirestore();

        holder.db = empty;

        await expect(new BaziService({ clock: () => NOW }).calculate(reference)).rejects.toBeInstanceOf(NotFoundError);
        expect(empty.paths()).toEqual([]);
    });

    it('does not write anything on success either', async () => {
        const before = db.paths();

        await service.calculate(reference);

        expect(db.paths()).toEqual(before);
    });
});
