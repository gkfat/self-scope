import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { FixedContentService } from './fixedContent.service';
import { NotFoundError } from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const doc = (status: string) => ({
    contentType: 'ZODIAC',
    key: 'aries',
    body: {
        title: '白羊座',
        summary: '摘要',
        strengths: [],
        blindSpots: [],
        loveStyle: '',
        workStyle: '',
        communicationStyle: '',
        growthAdvice: '',
        disclaimer: '僅供娛樂與自我探索',
    },
    contentVersion: '3',
    status,
    updatedAt: 1,
    publishedAt: status === 'PUBLISHED' ? 1 : null,
});

describe('FixedContentService.getPublished', () => {
    let db: FakeFirestore;

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
    });

    it('returns published content with the disclaimer and version', async () => {
        await db.doc('fixedContents/ZODIAC_aries').set(doc('PUBLISHED'));

        const result = await new FixedContentService().getPublished('ZODIAC', 'aries');

        expect(result).toMatchObject({
            contentType: 'ZODIAC',
            key: 'aries',
            title: '白羊座',
            contentVersion: '3',
            disclaimer: '僅供娛樂與自我探索',
        });
    });

    it.each(['DRAFT', 'REVIEWED'])('hides %s content as if it did not exist', async (status) => {
        await db.doc('fixedContents/ZODIAC_aries').set(doc(status));

        await expect(new FixedContentService().getPublished('ZODIAC', 'aries')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('reports missing content as not found instead of generating it', async () => {
        await expect(new FixedContentService().getPublished('ZODIAC', 'leo')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('rejects a stored document that has no disclaimer', async () => {
        const broken = doc('PUBLISHED');
        broken.body.disclaimer = '';
        await db.doc('fixedContents/ZODIAC_aries').set(broken);

        await expect(new FixedContentService().getPublished('ZODIAC', 'aries')).rejects.toThrow();
    });
});
