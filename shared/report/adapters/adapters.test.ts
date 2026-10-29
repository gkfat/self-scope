import {
    describe, expect, it,
} from 'vitest';
import { computeNatalChart } from '../../../server/astrology/natalChart';
import { BaziService } from '../../../server/services/bazi.service';
import { NatalChartService } from '../../../server/services/natalChart.service';
import { reportSnapshotContentSchema } from '../../schemas/firestore/reportSnapshot.schema';
import { fixedContentBodySchema } from '../../schemas/firestore/fixedContent.schema';
import { personalYearNumber } from '../../utils/numerology';
import { assembleSingleReport } from '../assembleSingleReport';
import { bloodReportInput } from './blood';
import {
    horoscopeReportInput, runeReportInput, tarotReportInput,
} from './state';
import { baziReportInput } from './bazi';
import { calculateHumanDesign } from '../../../server/humanDesign/calculate';
import { humanDesignReportInput } from './humanDesign';
import { mayaKinReportInput } from './mayaKin';
import {
    mbtiReportInput, mbtiStrengthWord, 
} from './mbti';
import { numerologyReportInput } from './numerology';
import {
    NATAL_MISSING_NOTE, zodiacReportInput, 
} from './zodiac';

const body = (title: string) => fixedContentBodySchema.parse({
    title,
    summary: `${title}的簡述。`,
    strengths: ['優勢一', '優勢二'],
    blindSpots: ['盲點一'],
    workStyle: '工作的樣子。',
    growthAdvice: '給自己一點時間。',
    disclaimer: '僅供娛樂與自我探索。',
});

const accepted = (input: Parameters<typeof assembleSingleReport>[0]) => reportSnapshotContentSchema.safeParse(assembleSingleReport(input)).success;

describe('bloodReportInput', () => {
    it('makes a report the snapshot schema accepts, with the blood type as its one fact', () => {
        const input = bloodReportInput({
            bloodType: 'AB', body: body('AB 型'),
        });

        expect(input.position).toBe('AB 型');
        expect(input.facts).toEqual([
            {
                label: '血型', value: 'AB 型', term: 'blood:AB',
            },
        ]);
        expect(input.basis).toEqual([]);
        expect(accepted(input)).toBe(true);
    });

    it('takes its readings from the reviewed words and leaves them unchanged', () => {
        const readings = bloodReportInput({
            bloodType: 'O', body: body('O 型'),
        }).interpretations;

        expect(readings.map((r) => r.title)).toEqual([
            'O 型',
            '可能的優勢',
            '可能的盲點',
            '工作與決策',
        ]);
        expect(readings[1]?.text).toBe('優勢一；優勢二');
    });
});

describe('the advice of a reading', () => {
    it('is the advice itself, then the four parts of the practice, each under its label', () => {
        const withPractice = fixedContentBodySchema.parse({
            ...body('天蠍座'),
            growthPractice: {
                habitToObserve: '留意自己什麼時候開始想太多。',
                behaviorToTry: '把一個顧慮直接說出來。',
                reflectionQuestion: '我現在的判斷，有多少是推測？',
                weeklyPractice: '本週選一次場合，說出一個需求。',
            },
        });

        expect(bloodReportInput({
            bloodType: 'O', body: withPractice,
        }).advice).toEqual([
            '給自己一點時間。',
            '一個值得觀察的習慣：留意自己什麼時候開始想太多。',
            '一個可以嘗試改變的行為：把一個顧慮直接說出來。',
            '一個自我反思問題：我現在的判斷，有多少是推測？',
            '本週就能完成的小練習：本週選一次場合，說出一個需求。',
        ]);
    });

    it('is only the advice when the reading has no practice', () => {
        expect(bloodReportInput({
            bloodType: 'O', body: body('O 型'),
        }).advice).toEqual(['給自己一點時間。']);
    });
});

describe('numerologyReportInput', () => {
    const input = numerologyReportInput({
        birthDate: '1989-10-27', today: '2026-10-28', body: body('生命靈數 1'),
    });

    it('gives the life path number as the position and as a fact the mapping can use', () => {
        expect(input.position).toBe('生命靈數 1');
        expect(input.facts[0]).toMatchObject({
            label: '生命靈數', value: '1', term: 'numerology:1',
        });
        expect(input.traits).toEqual(['numerology:1']);
    });

    it('keeps the year number as a fact with the date it was made for', () => {
        expect(input.timeFacts).toEqual([
            {
                text: `依生命靈數流年，2026 年的流年數是 ${personalYearNumber('1989-10-27', 2026)}。`, asOf: '2026-10-28',
            },
        ]);
        expect(assembleSingleReport(input).blocks.find((b) => b.key === 'time')?.segments[0]).toMatchObject({
            timeSensitive: true, asOf: '2026-10-28',
        });
    });

    it('records what it was calculated from', () => {
        expect(input.basis).toMatchObject([
            {
                system: 'NUMEROLOGY', inputs: { birthDate: '1989-10-27' },
            },
        ]);
        expect(accepted(input)).toBe(true);
    });
});

describe('zodiacReportInput', () => {
    const chart = new NatalChartService().calculate({
        birthDate: '1989-10-27', birthTime: '06:10', birthPlace: 'tw-taipei',
    });

    it('with a birth time and a city gives the chart, the houses with their rulers and the aspects as facts', () => {
        const input = zodiacReportInput({
            zodiac: 'scorpio', birthDate: '1989-10-27', body: body('天蠍座'), natal: {
                chart, birthTime: '06:10', birthPlace: 'tw-taipei',
            },
        });
        const labels = input.facts.map((fact) => fact.label);

        expect(input.position).toBe('太陽天蠍座');
        expect(labels).toContain('上升');
        expect(labels.filter((label) => label.startsWith('第 ')).length).toBe(12);
        expect(labels.some((label) => label.startsWith('相位・'))).toBe(true);
        expect(input.facts.find((fact) => fact.label === '第 1 宮（自我與開始）')?.value).toContain('宮主星');
        expect(input.notes).toEqual([]);
        expect(input.basis.map((b) => b.system)).toEqual(['ZODIAC', 'NATAL_CHART']);
        expect(accepted(input)).toBe(true);
    });

    it('reads each placement with the reviewed text of that placement', () => {
        const input = zodiacReportInput({
            zodiac: 'scorpio', birthDate: '1989-10-27', body: body('天蠍座'), natal: {
                chart, birthTime: '06:10', birthPlace: 'tw-taipei',
            },
        });

        expect(input.interpretations.some((reading) => reading.title === '月亮在天秤座' || reading.title.startsWith('月亮在'))).toBe(true);
        expect(input.interpretations.length).toBeGreaterThan(10);
    });

    it('without them has only the sun sign, says what would add the rest, and guesses nothing', () => {
        const input = zodiacReportInput({
            zodiac: 'scorpio', birthDate: '1989-10-27', body: body('天蠍座'), natal: null,
        });

        expect(input.facts).toHaveLength(1);
        expect(input.facts[0]).toMatchObject({ term: 'zodiac:scorpio' });
        expect(input.notes).toEqual([NATAL_MISSING_NOTE]);
        expect(input.basis.map((b) => b.system)).toEqual(['ZODIAC']);
        const shownFacts = assembleSingleReport(input).blocks.find((b) => b.key === 'facts')?.segments.map((s) => s.text) ?? [];

        expect(shownFacts.some((text) => text.startsWith('上升：') || text.startsWith('第 1 宮'))).toBe(false);
    });

    it('does not depend on what the chart function returns beyond its own shape', () => {
        expect(computeNatalChart(new Date(Date.UTC(1989, 9, 26, 22, 10)), 25.033, 121.5654).ascendant.sign).toBe(chart.ascendant.sign);
    });
});

describe('the birth chart beyond the signs: houses, aspects and what they say together', () => {
    const chart = new NatalChartService().calculate({
        birthDate: '1989-10-27', birthTime: '06:10', birthPlace: 'tw-taipei',
    });
    const input = zodiacReportInput({
        zodiac: 'scorpio', birthDate: '1989-10-27', body: body('天蠍座'), natal: {
            chart, birthTime: '06:10', birthPlace: 'tw-taipei',
        },
    });
    const labels = new Set(input.facts.map((fact) => fact.label));

    it('gives every aspect a label of its own, so that its reading can sit with it', () => {
        const aspectLabels = input.facts.map((fact) => fact.label).filter((label) => label.startsWith('相位・'));

        expect(aspectLabels.length).toBe(chart.aspects.length);
        expect(new Set(aspectLabels).size).toBe(aspectLabels.length);
    });

    it('reads each body in its house, and each aspect, as part of the fact it belongs to', () => {
        const inHouse = input.interpretations.filter((reading) => reading.factLabel?.startsWith('第 '));
        const ofAspect = input.interpretations.filter((reading) => reading.factLabel?.startsWith('相位・'));

        expect(inHouse).toHaveLength(chart.houses.reduce((total, house) => total + house.bodies.length, 0));
        expect(ofAspect).toHaveLength(chart.aspects.length);

        for (const reading of [...inHouse, ...ofAspect]) {
            expect(labels.has(reading.factLabel as string), reading.title).toBe(true);
        }
    });

    it('draws conclusions from the facts together, each with what it rests on', () => {
        const conclusions = (input.inferences ?? []).filter((inference) => inference.kind !== 'SYSTEM_INTERPRETATION');

        expect(conclusions.length).toBeGreaterThan(0);

        for (const inference of conclusions) {
            expect(inference.basedOn.length).toBeGreaterThan(0);
            expect(inference.title).not.toBe('');
            expect(inference.title).not.toContain('：');
            expect(inference.text).toMatch(/可能|容易|傾向|需要/);
        }
    });

    it('sorts the conclusions into the houses and the aspects', () => {
        const conclusions = (input.inferences ?? []).filter((inference) => inference.kind !== 'SYSTEM_INTERPRETATION');
        const groups = new Set(conclusions.map((inference) => inference.group?.title));

        expect(groups).toEqual(new Set(['十二宮位歸納', '相位歸納']));
        expect((input.inferences ?? []).filter((inference) => inference.group?.key === 'aspects').every((inference) => inference.title.includes('相位'))).toBe(true);
    });

    it('gives the key words of each placement its own card, in the order of the groups, from the reading of that placement', () => {
        const highlights = (input.inferences ?? []).filter((inference) => inference.kind === 'SYSTEM_INTERPRETATION');

        expect(highlights).toHaveLength(11);
        const names = [
            '太陽',
            '月亮',
            '上升',
            '水星',
            '金星',
            '火星',
            '木星',
            '土星',
            '天王星',
            '海王星',
            '冥王星',
        ];

        highlights.forEach((item, index) => expect(item.title.startsWith(names[index] as string), item.title).toBe(true));
        expect(new Set(highlights.map((item) => item.group?.title))).toEqual(new Set([
            '個人行星',
            '社會行星',
            '世代行星',
        ]));
        expect(highlights.filter((item) => item.group?.title === '個人行星')).toHaveLength(6);

        for (const item of highlights) {
            expect(item.text).not.toBe('');
            expect(item.text).not.toContain('；');

            for (const label of item.basedOn) expect(labels.has(label), label).toBe(true);
        }
    });

    it('has no such conclusions without a chart', () => {
        expect(zodiacReportInput({
            zodiac: 'scorpio', birthDate: '1989-10-27', body: body('天蠍座'), natal: null,
        }).inferences).toEqual([]);
    });
});

describe('mbtiReportInput', () => {
    const dimensions = {
        EI: {
            score: -18, maxScore: 20, leaning: 'I',
        },
        SN: {
            score: 2, maxScore: 20, leaning: 'S',
        },
        TF: {
            score: 5, maxScore: 20, leaning: 'T',
        },
        JP: {
            score: 8, maxScore: 20, leaning: 'J',
        },
    };

    it('names the four sides of the result and how clear each is', () => {
        const input = mbtiReportInput({
            type: 'ISTJ', dimensions, testVersion: '2', body: body('ISTJ'),
        });

        expect(input.position).toBe('ISTJ');
        expect(input.facts.map((fact) => fact.term)).toEqual([
            'mbti:EI:I',
            'mbti:SN:S',
            'mbti:TF:T',
            'mbti:JP:J',
        ]);
        expect(input.facts[0]?.value).toBe('內向（I），明顯偏向');
        expect(input.facts[1]?.value).toBe('實感（S），稍微偏向');
        expect(input.basis).toMatchObject([
            {
                system: 'MBTI', ruleVersion: '2',
            },
        ]);
        expect(accepted(input)).toBe(true);
    });

    it('says nothing about strength without the scores', () => {
        const input = mbtiReportInput({
            type: 'INTJ', dimensions: null, testVersion: null, body: body('INTJ'),
        });

        expect(input.facts.every((fact) => !fact.value.includes('偏向'))).toBe(true);
        expect(input.basis).toEqual([]);
    });

    it('buckets the strength the same way the page does', () => {
        expect(mbtiStrengthWord(0)).toBe('兩邊接近');
        expect(mbtiStrengthWord(0.33)).toBe('稍微偏向');
        expect(mbtiStrengthWord(0.5)).toBe('偏向');
        expect(mbtiStrengthWord(0.9)).toBe('明顯偏向');
    });

    it('is called a questionnaire of our own in the limits of the report', () => {
        const limits = assembleSingleReport(mbtiReportInput({
            type: 'ISTJ', dimensions, testVersion: '2', body: body('ISTJ'),
        })).blocks.find((b) => b.key === 'limits');

        expect(limits?.segments[0]?.text).toContain('自製');
    });
});

describe('mayaKinReportInput', () => {
    const input = mayaKinReportInput({
        birthDate: '2012-12-21', body: body('Kin 207'),
    });

    it('names the Kin, its seal and its tone, with the keywords of the Dreamspell table', () => {
        expect(input.position).toBe('Kin 207・水晶的藍手');
        expect(input.facts.find((fact) => fact.label === '圖騰')).toMatchObject({
            value: '藍手', term: 'kin:seal:7',
        });
        expect(input.facts.find((fact) => fact.label === '調性')).toMatchObject({
            value: '水晶', term: 'kin:tone:12',
        });
        expect(input.facts.find((fact) => fact.label === '圖騰的關鍵字')?.value).toBe('實踐、療癒');
        expect(input.traits).toEqual(['kin:seal:7', 'kin:tone:12']);
    });

    it('says that this is the Dreamspell, not an old Maya calendar, in the facts and in the limits', () => {
        expect(input.facts.find((fact) => fact.label === '曆法')?.value).toContain('不是古瑪雅原有的曆法');

        const limits = assembleSingleReport(input).blocks.find((b) => b.key === 'limits')?.segments[0]?.text;

        expect(limits).toContain('不是古瑪雅原有的曆法');
    });

    it('records what it was calculated from and gives a report the snapshot schema accepts', () => {
        expect(input.basis).toMatchObject([
            {
                system: 'MAYA_KIN', ruleVersion: 'dreamspell-v1', inputs: { birthDate: '2012-12-21' },
            },
        ]);
        expect(accepted(input)).toBe(true);
    });
});

describe('baziReportInput', () => {
    const NOW = Date.parse('2026-10-27T12:00:00+08:00');
    const run = async (params: { birthTime: string | null; gender: 'MALE' | null }) => {
        const service = new BaziService({
            clock: () => NOW,
            content: {
                getPublished: async (type: string, key: string) => ({
                    ...body(key), contentType: type, key, contentVersion: '1',
                }), 
            } as never,
        });
        const chart = await service.calculate({
            birthDate: '1989-10-27', birthTime: params.birthTime, birthPlace: 'tw-taipei', gender: params.gender,
        });

        return baziReportInput({
            chart, birthDate: '1989-10-27', birthTime: params.birthTime, birthPlace: 'tw-taipei', gender: params.gender, today: '2026-10-27',
        });
    };

    it('names the pillars and the day master, with the time facts dated', async () => {
        const input = await run({
            birthTime: '06:00', gender: 'MALE', 
        });

        expect(input.facts.find((fact) => fact.label === '四柱')?.value).toContain('時柱');
        expect(input.facts.find((fact) => fact.label === '日主')?.term).toMatch(/^bazi:daymaster:/);
        expect(input.timeFacts.length).toBeGreaterThan(0);
        expect(input.timeFacts.every((fact) => fact.asOf === '2026-10-27')).toBe(true);
        expect(accepted(input)).toBe(true);
    });

    it('says what is missing without a birth time or a gender', async () => {
        const input = await run({
            birthTime: null, gender: null, 
        });

        expect(input.facts.find((fact) => fact.label === '四柱')?.value).toContain('時柱 未知');
        expect(input.notes.join('')).toContain('沒有出生時間');
        expect(input.notes.join('')).toContain('性別');
        expect(accepted(input)).toBe(true);
    });
});

describe('humanDesignReportInput', () => {
    const chart = calculateHumanDesign('1989-10-27', '06:00', 'Asia/Taipei');
    const input = humanDesignReportInput({
        chart, birthDate: '1989-10-27', birthTime: '06:00', birthPlace: 'tw-taipei',
    });

    it('names the type, authority and each defined center and channel as facts with terms', () => {
        expect(input.facts.find((fact) => fact.label === '類型')?.term).toBe(`hd:type:${chart.type}`);
        expect(input.facts.find((fact) => fact.label === '內在權威')?.term).toBe(`hd:authority:${chart.authority}`);
        expect(input.facts.filter((fact) => fact.label === '有定義的能量中心')).toHaveLength(chart.definedCenters.length);
        expect(input.facts.filter((fact) => fact.label === '完整的通道')).toHaveLength(chart.channels.length);
        expect(input.traits.length).toBeGreaterThan(2);
    });

    it('keeps the profile, definition and cross out of the terms', () => {
        expect(input.facts.find((fact) => fact.label === '人生角色')?.term).toBeUndefined();
        expect(input.facts.find((fact) => fact.label === '定義')?.term).toBeUndefined();
    });

    it('records the birth data it was worked out from and gives a report the snapshot schema accepts', () => {
        expect(input.basis).toMatchObject([
            {
                system: 'HUMAN_DESIGN', inputs: {
                    birthDate: '1989-10-27', birthTime: '06:00', birthPlace: 'tw-taipei',
                },
            },
        ]);
        expect(accepted(input)).toBe(true);
    });
});

describe('the reports of today', () => {
    const content = {
        ...body('今日'), contentType: 'TAROT' as const, key: 'k', contentVersion: '1',
    };

    it('gives a tarot card a report the snapshot schema accepts, dated, and with the advice of the reading', () => {
        const input = tarotReportInput({
            date: '2026-10-28',
            card: {
                index: 1, roman: 'I', name: '魔術師', englishName: 'The Magician', orientation: 'upright', illustration: null,
            },
            content,
            drawVersion: 'tarot-v1',
        });

        expect(input.timeFacts?.[0]).toMatchObject({ asOf: '2026-10-28' });
        expect(input.advice).toContain('今天可以試試：給自己一點時間。');
        expect(accepted(input)).toBe(true);
    });

    it('carries everything the daily tarot page used to show: the longer reading, the picture and the questions', () => {
        const input = tarotReportInput({
            date: '2026-10-28',
            card: {
                index: 1, roman: 'I', name: '魔術師', englishName: 'The Magician', orientation: 'reversed', illustration: null,
            },
            content,
            drawVersion: 'tarot-v1',
        });
        const titles = input.interpretations.map((reading) => reading.title);

        for (const title of [
            '今日主題',
            '人物',
            '顏色',
            '道具',
            '構圖',
            '傳統',
            '現代',
            '自我',
            '人際',
            '光明面：資源與優勢',
            '陰影面：過度的傾向',
            '內在衝突',
            '成長課題',
        ]) {
            expect(titles, title).toContain(title);
        }

        expect(input.facts.some((fact) => fact.label === '關鍵字')).toBe(false);
        expect(input.interpretations.find((reading) => reading.group === '關鍵字')?.text).not.toBe('');
        expect(input.facts.some((fact) => fact.label === '核心主題')).toBe(false);
        // The other side of the card is not shown, and the direction is in the card of the draw
        expect(titles).not.toContain('牌的方向');
        expect(titles).not.toContain('逆位核心');
        expect(titles).not.toContain('正位與逆位的差異');
        expect(input.advice.filter((line) => line.startsWith('想一想：'))).toHaveLength(3);
    });

    it('puts the theme of the day and what to watch for in one quote at the head of the overview', () => {
        const input = tarotReportInput({
            date: '2026-10-29',
            card: {
                index: 10, roman: 'X', name: '命運之輪', englishName: 'Wheel of Fortune', orientation: 'upright', illustration: null,
            },
            content: {
                ...content, summary: '今天傾向感受到事情的流動與轉變，保持彈性，順勢調整會比較輕鬆。', blindSpots: ['把變化都歸給運氣時，可能少了主動調整的力氣。'],
            },
            drawVersion: 'tarot-v1',
        });
        const [lead] = input.interpretations;

        expect(lead).toMatchObject({
            lead: true,
            text: '今天傾向感受到事情的流動與轉變，保持彈性，順勢調整會比較輕鬆。但要注意，把變化都歸給運氣時，可能少了主動調整的力氣。',
        });
        expect(input.interpretations.some((reading) => reading.title === '可以留意的地方')).toBe(false);
    });

    it('gives the direction a card of its own, and sorts the readings of a card into groups', () => {
        const input = tarotReportInput({
            date: '2026-10-29',
            card: {
                index: 1, roman: 'I', name: '魔術師', englishName: 'The Magician', orientation: 'upright', illustration: null,
            },
            content,
            drawVersion: 'tarot-v1',
        });

        expect(input.facts[1]).toMatchObject({
            label: '正逆位', value: '正位',
        });
        // The card, the side that was drawn (upright here) and its core
        expect(input.facts.map((fact) => fact.label)).toEqual([
            '今日的牌',
            '正逆位',
            '正位核心',
        ]);
        expect([...new Set(input.interpretations.flatMap((reading) => (reading.group ? [reading.group] : [])))]).toEqual([
            '關鍵字',
            '牌面解構',
            '牌義詮釋',
            '生活面向',
            '光明、陰影與成長',
        ]);
        // Only the quote at the head has no group
        expect(input.interpretations.filter((reading) => !reading.group).map((reading) => reading.lead)).toEqual([true]);
    });

    it('does not say "今天可以試試" twice when the advice already opens with it', () => {
        const input = runeReportInput({
            date: '2026-10-28',
            rune: {
                index: 0, name: 'Fehu', glyph: 'ᚠ', meaning: '財富', orientation: 'upright', illustration: null,
            },
            content: {
                ...content, growthAdvice: '今天可以試試接受一個小小的變動，看看它帶來什麼。',
            },
            drawVersion: 'rune-v1',
        });

        expect(input.advice[0]).toBe('今天可以試試：接受一個小小的變動，看看它帶來什麼。');
    });

    it('gives a rune the same groups as a card, and three questions for the side that was drawn', () => {
        const upright = runeReportInput({
            date: '2026-10-28',
            rune: {
                index: 0, name: 'Fehu', glyph: 'ᚠ', meaning: '財富', orientation: 'upright', illustration: null,
            },
            content,
            drawVersion: 'rune-v1',
        });

        expect([...new Set(upright.interpretations.flatMap((reading) => (reading.group ? [reading.group] : [])))]).toEqual([
            '關鍵字',
            '符文詮釋',
            '生活面向',
            '光明、陰影與成長',
        ]);
        expect(upright.advice.filter((line) => line.startsWith('想一想：'))).toHaveLength(3);

        const reversed = runeReportInput({
            date: '2026-10-28',
            rune: {
                index: 0, name: 'Fehu', glyph: 'ᚠ', meaning: '財富', orientation: 'reversed', illustration: null,
            },
            content,
            drawVersion: 'rune-v1',
        });

        // The side that was drawn is the one that is read
        expect(reversed.advice.filter((line) => line.startsWith('想一想：'))).not.toEqual(upright.advice.filter((line) => line.startsWith('想一想：')));
    });

    it('gives a rune a report the snapshot schema accepts', () => {
        const input = runeReportInput({
            date: '2026-10-28',
            rune: {
                index: 0, name: 'Fehu', glyph: 'ᚠ', meaning: '財富', orientation: 'upright', illustration: null,
            },
            content,
            drawVersion: 'rune-v1',
        });

        expect(input.position).toContain('Fehu');
        expect(input.interpretations[0]).toMatchObject({ lead: true });
        expect(input.interpretations.some((reading) => reading.group === '關鍵字')).toBe(true);
        expect(input.advice[0]).toBe('今天可以試試：給自己一點時間。');
        expect(accepted(input)).toBe(true);
    });

    it('reads each body of the horoscope in the houses of the sign, as a group of its own', () => {
        const input = horoscopeReportInput({
            horoscope: {
                date: '2026-10-28',
                sign: 'scorpio',
                bodies: [
                    {
                        body: 'MOON', name: '月亮', area: '今日心情與節奏', transitSign: 'leo', house: 3, content: {
                            ...content, title: '月亮在第 3 宮：溝通與學習',
                        },
                    }, {
                        body: 'SUN', name: '太陽', area: '這段時間的主題', transitSign: 'scorpio', house: 1, content,
                    },
                ] as never,
            },
        });

        expect(input.position).toContain('天蠍座');
        // The overview is the quote of the Moon; each body is a group of its own, named for what it stands for
        expect(input.facts).toEqual([]);
        expect(input.interpretations[0]).toMatchObject({ lead: true });
        expect([...new Set(input.interpretations.flatMap((reading) => (reading.group ? [reading.group] : [])))]).toEqual([
            '關鍵字',
            '心情與節奏',
            '這段時間的主題',
        ]);
        // The sign the body is in comes with the house
        expect(input.interpretations.find((reading) => reading.group === '心情與節奏' && reading.title.includes('・第'))?.title).toBe('月亮在獅子座・第 3 宮：溝通與學習');
        // One thing to try, and three questions (the houses of the bodies, each once)
        expect(input.advice.filter((line) => line.startsWith('今天可以試試：'))).toHaveLength(1);
        expect(input.advice.filter((line) => line.startsWith('想一想：'))).toHaveLength(2);
        expect(accepted(input)).toBe(true);
    });
});
