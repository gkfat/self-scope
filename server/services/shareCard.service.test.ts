import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import {
    ShareCardService, excerpt,
} from './shareCard.service';
import { HumanDesignService } from './humanDesign.service';
import { calculateHumanDesign } from '../humanDesign/calculate';
import {
    AuthError, NotFoundError,
} from '../../shared/types/errors';
import { addMonths } from '../../shared/utils/time';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15);
const longText = '這是一段很長的摘要。'.repeat(20);

const content = (type: string, key: string, summary: string) => ({
    contentType: type,
    key,
    body: {
        title: `${key} 的標題`,
        summary,
        strengths: [],
        blindSpots: [],
        loveStyle: '',
        workStyle: '',
        communicationStyle: '',
        growthAdvice: '',
        disclaimer: '僅供娛樂與自我探索',
    },
    contentVersion: '1',
    status: 'PUBLISHED',
    updatedAt: NOW,
    publishedAt: NOW,
});

describe('excerpt', () => {
    it('keeps short text and cuts long text with an ellipsis', () => {
        expect(excerpt('短文')).toBe('短文');
        expect(excerpt('字'.repeat(100), 10)).toBe(`${'字'.repeat(10)}…`);
    });

    it('does not split characters outside the basic plane', () => {
        expect(excerpt('😀'.repeat(5), 3)).toBe('😀😀😀…');
    });
});

describe('ShareCardService', () => {
    let db: FakeFirestore;
    let service: ShareCardService;

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        service = new ShareCardService({ humanDesign: new HumanDesignService({ clock: () => NOW }) });

        await db.doc('fixedContents/ZODIAC_aries').set(content('ZODIAC', 'aries', longText));
    });

    it('builds a card for a single result without needing sign-in', async () => {
        const card = await service.create({
            source: 'SINGLE_RESULT', referenceId: 'ZODIAC:aries',
        }, null);

        expect(card.title).toBe('aries 的標題');
        expect(card.summaryText.endsWith('…')).toBe(true);
        expect([...card.summaryText].length).toBeLessThanOrEqual(81);
        expect(card.imageUrl).toBeNull();
    });

    it('reports an unknown, malformed or unpublished result as not found', async () => {
        for (const referenceId of [
            'ZODIAC:nope',
            'BLOOD:UNKNOWN',
            'garbage',
            'ZODIAC:leo',
        ]) {
            await expect(service.create({
                source: 'SINGLE_RESULT', referenceId,
            }, null)).rejects.toBeInstanceOf(NotFoundError);
        }
    });

    it('never puts personal data on a card', async () => {
        await db.doc('users/u1').set({
            email: 'secret@example.com',
            birthData: {
                birthDate: '1995-03-25', zodiac: 'aries', birthTime: '08:30', birthPlace: 'tw-taipei',
            },
        });

        const text = JSON.stringify(await service.create({
            source: 'SINGLE_RESULT', referenceId: 'ZODIAC:aries',
        }, 'u1'));

        for (const secret of [
            'secret@example.com',
            '1995-03-25',
            '08:30',
            'tw-taipei',
            'u1',
        ]) {
            expect(text).not.toContain(secret);
        }
    });

    describe('human design', () => {
        const chart = calculateHumanDesign('1990-06-15', '12:00', 'Europe/Madrid');

        beforeEach(async () => {
            await db.doc('users/u1/humanDesign/main').set({
                result: chart,
                inputDigest: 'digest',
                calculatedAt: NOW,
                expiresAt: addMonths(NOW, 3),
            });
        });

        it('shares the chart level facts only, for its owner', async () => {
            const card = await service.create({
                source: 'HUMAN_DESIGN', referenceId: 'main',
            }, 'u1');

            expect(card.title).toBe('人類圖：顯示生產者');
            expect(card.summaryText).toContain('人生角色 2/4');
            expect(card.summaryText).toContain('薦骨權威');
            expect(card.summaryText).toContain('等待回應');
            expect(JSON.stringify(card)).not.toMatch(/1990|12:00|madrid|u1/i);
        });

        it('needs sign-in', async () => {
            await expect(service.create({
                source: 'HUMAN_DESIGN', referenceId: 'main',
            }, null)).rejects.toBeInstanceOf(AuthError);
        });

        it('has nothing to share for another member or another reference', async () => {
            await expect(service.create({
                source: 'HUMAN_DESIGN', referenceId: 'main',
            }, 'u2')).rejects.toBeInstanceOf(NotFoundError);
            await expect(service.create({
                source: 'HUMAN_DESIGN', referenceId: 'someone-else',
            }, 'u1')).rejects.toBeInstanceOf(NotFoundError);
        });
    });
});
