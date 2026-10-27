import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { MayaKinService } from './mayaKin.service';
import {
    birthKinQuerySchema, birthKinResponseSchema,
} from '../../shared/schemas/api/mayaKin.schema';
import { NotFoundError } from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

function contentDoc(type: string, key: string, status = 'PUBLISHED') {
    return {
        contentType: type,
        key,
        body: {
            title: `${type} ${key}`, summary: `summary of ${key}`, disclaimer: '僅供娛樂與自我探索',
        },
        contentVersion: '1',
        status,
        updatedAt: 1,
        publishedAt: status === 'PUBLISHED' ? 1 : null,
    };
}

describe('MayaKinService.birthKin', () => {
    let db: FakeFirestore;
    let service: MayaKinService;

    const seed = (key: string, status = 'PUBLISHED') => db.doc(`fixedContents/KIN_BIRTH_${key}`).set(contentDoc('KIN_BIRTH', key, status));

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        service = new MayaKinService();
    });

    it('gives the Kin of a birth date with its KIN_BIRTH content', async () => {
        await seed('207');

        const response = await service.birthKin('2012-12-21');

        expect(birthKinResponseSchema.parse(response)).toMatchObject({
            kin: {
                kinNumber: 207, solarSeal: 7, galacticTone: 12,
            },
            content: {
                contentType: 'KIN_BIRTH', key: '207',
            },
        });
    });

    it('gives 29 February the Kin of 28 February', async () => {
        await seed('51');

        expect((await service.birthKin('1996-02-29')).kin.kinNumber).toBe(51);
        expect((await service.birthKin('1996-02-28')).kin.kinNumber).toBe(51);
    });

    it.each(['DRAFT', 'REVIEWED'])('answers 404 while the content is %s, and never falls back', async (status) => {
        await seed('207', status);

        await expect(service.birthKin('2012-12-21')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('answers 404 when the content is missing', async () => {
        await expect(service.birthKin('2012-12-21')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('stores nothing', async () => {
        await seed('207');

        const before = db.paths();

        await service.birthKin('2012-12-21');

        expect(db.paths()).toEqual(before);
    });
});

describe('birthKinQuerySchema', () => {
    it('takes a real date that is not in the future', () => {
        expect(birthKinQuerySchema.safeParse({ birthDate: '1990-05-17' }).success).toBe(true);
        expect(birthKinQuerySchema.safeParse({ birthDate: '1996-02-29' }).success).toBe(true);
    });

    it.each([
        '2023-02-29',
        '2024-02-31',
        '2999-01-01',
        '1990-5-17',
        'not a date',
        '',
    ])('rejects %s', (birthDate) => {
        expect(birthKinQuerySchema.safeParse({ birthDate }).success).toBe(false);
    });

    it('needs the birth date', () => {
        expect(birthKinQuerySchema.safeParse({}).success).toBe(false);
    });
});
