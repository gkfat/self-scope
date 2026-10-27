import { Solar } from 'lunar-typescript';
import {
    describe, expect, it,
} from 'vitest';
import { analyzeChart } from './analysis';
import { computeFacts } from './facts';
import { ganzhiLabel } from './ganzhi';
import { calculatePillars } from './pillars';
import { solarTermsOfYear } from './solarTerms';

/**
 * Cross-check against lunar-typescript, an independent implementation with its own solar-term tables.
 * It works in Beijing time (UTC+8), the same clock as Taipei standard time, so wall clocks compare directly.
 */

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const FIRST_YEAR = 1901;
const LAST_YEAR = 2099;
/** Up to this year the two sources agree within a minute (the observed worst case is about 55 seconds). */
const TIGHT_UNTIL_YEAR = 2049;
const TERM_TOLERANCE_MS = 60 * 1000;
/** Later years rest on a forecast of the Earth's rotation, so the two models drift apart (62 seconds by 2098). */
const FAR_TERM_TOLERANCE_MS = 2 * 60 * 1000;
const SAMPLE_COUNT = 2000;
const NEAR_TERM_MS = 3 * 60 * 1000;

/** Our (traditional) term names to the library's (simplified) keys, for the twelve 節. */
const JIE_KEYS: Record<string, string> = {
    小寒: '小寒',
    立春: '立春',
    驚蟄: '惊蛰',
    清明: '清明',
    立夏: '立夏',
    芒種: '芒种',
    小暑: '小暑',
    立秋: '立秋',
    白露: '白露',
    寒露: '寒露',
    立冬: '立冬',
    大雪: '大雪',
};

/** Life-stage names in the library that are written in simplified characters. */
const SIMPLIFIED_STAGE: Record<string, string> = {
    長生: '长生',
    冠帶: '冠带',
    臨官: '临官',
    養: '养',
    絕: '绝',
};

/** Ten-god names in the library are simplified. */
const SIMPLIFIED_GOD: Record<string, string> = {
    劫財: '劫财',
    傷官: '伤官',
    偏財: '偏财',
    正財: '正财',
    七殺: '七杀',
};

function simplifiedStage(stage: string): string {
    return SIMPLIFIED_STAGE[stage] ?? stage;
}

function simplified(god: string | null): string {
    if (god === null) return '日主';

    return SIMPLIFIED_GOD[god] ?? god;
}

/** A deterministic pseudo-random sequence, so the sampled charts are the same on every run. */
function sequence(seed: number) {
    let state = seed;

    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;

        return state / 4294967296;
    };
}

describe('solar terms against lunar-typescript', () => {
    it(`agrees on all twelve 節 of every year from ${FIRST_YEAR} to ${LAST_YEAR}, within a minute up to ${TIGHT_UNTIL_YEAR}`, () => {
        let worst = 0;

        for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
            const table = Solar.fromYmd(year, 6, 15).getLunar().getJieQiTable();

            for (const term of solarTermsOfYear(year).filter((item) => item.monthBranch !== null)) {
                const other = table[JIE_KEYS[term.name] as string];

                if (!other) throw new Error(`Library has no ${term.name} for ${year}`);

                const theirs = Date.UTC(
                    other.getYear(),
                    other.getMonth() - 1,
                    other.getDay(),
                    other.getHour(),
                    other.getMinute(),
                    other.getSecond(),
                ) - BEIJING_OFFSET_MS;
                const diff = Math.abs(term.time.getTime() - theirs);

                if (year <= TIGHT_UNTIL_YEAR) worst = Math.max(worst, diff);

                expect(diff, `${term.name} ${year}`).toBeLessThanOrEqual(
                    year <= TIGHT_UNTIL_YEAR ? TERM_TOLERANCE_MS : FAR_TERM_TOLERANCE_MS,
                );
            }
        }

        // The two sources differ by seconds, never by minutes
        expect(worst).toBeLessThan(TERM_TOLERANCE_MS);
    });
});

describe('four pillars and chart facts against lunar-typescript', () => {
    const random = sequence(20261027);
    const samples = Array.from({ length: SAMPLE_COUNT }, () => {
        const year = FIRST_YEAR + Math.floor(random() * (LAST_YEAR - FIRST_YEAR + 1));
        const minuteOfYear = Math.floor(random() * 365 * 24 * 60);
        const wall = new Date(Date.UTC(year, 0, 1) + minuteOfYear * 60 * 1000);

        return wall;
    });

    it('agrees on the pillars, 命宮, 胎元, 地勢, 旬空 and ten gods of sampled charts', () => {
        let compared = 0;

        for (const wall of samples) {
            const [
                y,
                mo,
                d,
                h,
                mi,
            ] = [
                wall.getUTCFullYear(),
                wall.getUTCMonth() + 1,
                wall.getUTCDate(),
                wall.getUTCHours(),
                wall.getUTCMinutes(),
            ] as const;
            const date = `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const time = `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
            const instant = new Date(wall.getTime() - BEIJING_OFFSET_MS);
            const nearTerm = [
                y - 1,
                y,
                y + 1,
            ]
                .flatMap((year) => solarTermsOfYear(year))
                .some((term) => Math.abs(term.time.getTime() - instant.getTime()) < NEAR_TERM_MS);

            // Right at a term the two sources may legitimately fall on different sides
            if (nearTerm) continue;

            const pillars = calculatePillars({
                birthDate: date,
                birthTime: time,
                standardOffsetMinutes: 480,
                instant,
            });
            const facts = computeFacts(pillars, instant);
            const chart = analyzeChart(pillars);
            const theirs = Solar.fromYmdHms(y, mo, d, h, mi, 0).getLunar().getEightChar();
            const label = `${date} ${time}`;

            expect(ganzhiLabel(pillars.year), label).toBe(theirs.getYear());
            expect(ganzhiLabel(pillars.month), label).toBe(theirs.getMonth());
            expect(ganzhiLabel(pillars.day), label).toBe(theirs.getDay());
            expect(ganzhiLabel(pillars.hour!), label).toBe(theirs.getTime());
            expect(ganzhiLabel(facts.mingGong!), label).toBe(theirs.getMingGong());
            expect(ganzhiLabel(facts.taiYuan), label).toBe(theirs.getTaiYuan());
            expect(facts.stages.map((item) => simplifiedStage(item.stage)), label).toEqual([
                theirs.getYearDiShi(),
                theirs.getMonthDiShi(),
                theirs.getDayDiShi(),
                theirs.getTimeDiShi(),
            ]);
            expect(facts.voids.map((item) => item.branches.join('')), label).toEqual([
                theirs.getYearXunKong(),
                theirs.getMonthXunKong(),
                theirs.getDayXunKong(),
                theirs.getTimeXunKong(),
            ]);
            expect(chart.pillars.map((item) => simplified(item.stemTenGod)), label).toEqual([
                theirs.getYearShiShenGan(),
                theirs.getMonthShiShenGan(),
                '日主',
                theirs.getTimeShiShenGan(),
            ]);
            compared++;
        }

        // Nearly all samples are compared; a few near a term are skipped
        expect(compared).toBeGreaterThan(SAMPLE_COUNT * 0.95);
    });
});
