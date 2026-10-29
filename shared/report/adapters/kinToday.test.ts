import {
    describe, expect, it,
} from 'vitest';
import { kinFromNumber } from '../../utils/mayaKin';
import { kinTodayReading } from './kinToday';

const content = {
    title: '今日 Kin：水晶的黃種子',
    summary: '今天的能量是播種與成長。',
    strengths: ['目標', '成長'],
    blindSpots: ['可能急著想看到成果'],
    growthAdvice: '今天可以試試接受一個小小的變動。',
    disclaimer: '僅供參考。',
};

describe('kinTodayReading', () => {
    const reading = kinTodayReading({
        kin: kinFromNumber(191), content: content as never,
    });

    it('quotes the theme of the day with what to watch for', () => {
        expect(reading.lead).toBe('今天的能量是播種與成長。但要注意，可能急著想看到成果');
    });

    it('has the same groups, in the same order, as a card and a rune', () => {
        expect(reading.groups.map((item) => item.title)).toEqual([
            '關鍵字',
            '圖騰與調性',
            '生活面向',
            '光明、陰影與成長',
        ]);
        expect(reading.groups[0]?.readings[0]?.text).toBe('目標、成長');
        expect(reading.groups[2]?.readings.map((item) => item.title)).toEqual([
            '感情',
            '工作',
            '自我',
            '人際',
        ]);
    });

    it('tries one thing today, without saying it twice, and asks three questions', () => {
        expect(reading.advice[0]).toBe('今天可以試試：接受一個小小的變動。');
        expect(reading.advice.filter((line) => line.startsWith('想一想：'))).toHaveLength(3);
    });

    it('reads every one of the 260 Kin', () => {
        for (let number = 1; number <= 260; number += 1) {
            const item = kinTodayReading({
                kin: kinFromNumber(number), content: content as never,
            });

            expect(item.groups, String(number)).toHaveLength(4);
            expect(item.advice, String(number)).toHaveLength(4);
        }
    });
});
