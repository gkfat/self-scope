import {
    beforeEach, describe, expect, it,
} from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { FakeFirestore } from '../../server/test-utils/fakeFirestore';
import { applyFixedContent } from './applyFixedContent';
import type { ImportRow } from '../../shared/utils/fixedContentImport';

const body = {
    title: '標題',
    summary: '摘要',
    strengths: [],
    blindSpots: [],
    loveStyle: '',
    workStyle: '',
    communicationStyle: '',
    growthAdvice: '',
    disclaimer: '僅供娛樂與自我探索',
};

const row = (overrides: Partial<ImportRow> = {}): ImportRow => ({
    contentType: 'SUMMARY',
    key: 'aries_INTJ',
    body,
    status: 'DRAFT',
    ...overrides,
});

describe('applyFixedContent', () => {
    let db: FakeFirestore;
    const asFirestore = () => db as unknown as Firestore;

    beforeEach(() => {
        db = new FakeFirestore();
    });

    it('creates the document with a deterministic id and version 1', async () => {
        const outcome = await applyFixedContent(asFirestore(), [row()], 1000);

        expect(outcome.created).toEqual(['SUMMARY_aries_INTJ']);

        const stored = (await db.doc('fixedContents/SUMMARY_aries_INTJ').get()).data();
        expect(stored).toMatchObject({
            contentVersion: '1',
            status: 'DRAFT',
            publishedAt: null,
            combinationKey: {
                zodiac: 'aries', mbti: 'INTJ', bloodType: null,
            },
        });
    });

    it('does not duplicate a combination when imported again', async () => {
        await applyFixedContent(asFirestore(), [row()], 1000);
        const second = await applyFixedContent(asFirestore(), [row()], 2000);

        expect(second.unchanged).toEqual(['SUMMARY_aries_INTJ']);
        expect(db.paths()).toHaveLength(1);
        expect((await db.doc('fixedContents/SUMMARY_aries_INTJ').get()).data()?.contentVersion).toBe('1');
    });

    it('bumps the version when the body changes', async () => {
        await applyFixedContent(asFirestore(), [row()], 1000);
        const outcome = await applyFixedContent(asFirestore(), [
            row({
                body: {
                    ...body, summary: '新的摘要',
                },
            }),
        ], 2000);

        expect(outcome.updated).toEqual(['SUMMARY_aries_INTJ']);
        expect((await db.doc('fixedContents/SUMMARY_aries_INTJ').get()).data()?.contentVersion).toBe('2');
    });

    it('sets publishedAt on publication and keeps the first publication time', async () => {
        await applyFixedContent(asFirestore(), [row({ status: 'PUBLISHED' })], 1000);
        expect((await db.doc('fixedContents/SUMMARY_aries_INTJ').get()).data()?.publishedAt).toBe(1000);

        await applyFixedContent(asFirestore(), [
            row({
                status: 'PUBLISHED',
                body: {
                    ...body, summary: '修訂',
                },
            }),
        ], 2000);
        expect((await db.doc('fixedContents/SUMMARY_aries_INTJ').get()).data()?.publishedAt).toBe(1000);
    });

    it('clears publishedAt when content goes back to draft', async () => {
        await applyFixedContent(asFirestore(), [row({ status: 'PUBLISHED' })], 1000);
        await applyFixedContent(asFirestore(), [row({ status: 'DRAFT' })], 2000);

        expect((await db.doc('fixedContents/SUMMARY_aries_INTJ').get()).data()?.publishedAt).toBeNull();
    });
});
