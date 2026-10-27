import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { ProfileService } from './profile.service';
import { addMonths } from '../../shared/utils/time';
import type { UserDoc } from '../../shared/schemas/firestore/user.schema';
import type { ProfileInput } from '../../shared/schemas/api/profile.schema';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 0, 15);

const baseUser: UserDoc = {
    email: 'a@example.com',
    birthData: null,
    bloodType: 'UNKNOWN',
    gender: null,
    mbti: null,
    mbtiExpiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
};

const input: ProfileInput = {
    birthData: {
        birthDate: '1995-03-25',
        zodiac: 'aries',
        birthTime: '08:30',
        birthPlace: 'tw-taipei',
    },
    bloodType: 'A',
    gender: null,
};

describe('ProfileService', () => {
    let db: FakeFirestore;
    let service: ProfileService;

    beforeEach(async () => {
        db = new FakeFirestore();
        holder.db = db;
        await db.doc('users/u1').set(baseUser);
        service = new ProfileService({ clock: () => NOW });
    });

    it('returns an empty profile for a new user', async () => {
        expect(await service.getProfile('u1')).toEqual({
            userId: 'u1',
            email: 'a@example.com',
            birthData: null,
            bloodType: 'UNKNOWN',
            mbti: null,
            gender: null,
        });
    });

    it('throws NotFound for a user that does not exist', async () => {
        await expect(service.getProfile('nobody')).rejects.toThrow('User not found');
    });

    it('stores birth data and blood type', async () => {
        const profile = await service.updateProfile('u1', input);

        expect(profile.birthData).toEqual({
            birthDate: '1995-03-25',
            zodiac: 'aries',
            birthTime: '08:30',
            birthPlace: 'tw-taipei',
        });
        expect(profile.bloodType).toBe('A');
    });

    it('stores the gender when given and clears it when the next save leaves it out', async () => {
        const saved = await service.updateProfile('u1', {
            ...input, gender: 'FEMALE',
        });

        expect(saved.gender).toBe('FEMALE');
        expect((await service.getProfile('u1')).gender).toBe('FEMALE');

        const cleared = await service.updateProfile('u1', input);

        expect(cleared.gender).toBeNull();
    });

    it('reads a user saved before the gender field existed as not provided', async () => {
        const legacy: Partial<UserDoc> = { ...baseUser };

        delete legacy.gender;
        await db.doc('users/u2').set(legacy);

        expect((await service.getProfile('u2')).gender).toBeNull();
    });

    it('sets mbti with a 3-month expiry', async () => {
        await service.updateProfile('u1', {
            ...input, mbti: 'INTJ',
        });

        const stored = (await db.doc('users/u1').get()).data();
        expect(stored?.mbti).toBe('INTJ');
        expect(stored?.mbtiExpiresAt).toBe(addMonths(NOW, 3));
    });

    it('keeps the stored mbti when the request omits it', async () => {
        await service.updateProfile('u1', {
            ...input, mbti: 'INTJ',
        });
        await service.updateProfile('u1', input);

        expect((await db.doc('users/u1').get()).data()?.mbti).toBe('INTJ');
    });

    it('clears mbti and its expiry when set to null', async () => {
        await service.updateProfile('u1', {
            ...input, mbti: 'INTJ',
        });
        await service.updateProfile('u1', {
            ...input, mbti: null,
        });

        const stored = (await db.doc('users/u1').get()).data();
        expect(stored?.mbti).toBeNull();
        expect(stored?.mbtiExpiresAt).toBeNull();
    });

    it('does not extend the expiry when the same mbti is resubmitted', async () => {
        const later = new ProfileService({ clock: () => addMonths(NOW, 1) });

        await service.updateProfile('u1', {
            ...input, mbti: 'INTJ',
        });
        await later.updateProfile('u1', {
            ...input, mbti: 'INTJ',
        });

        expect((await db.doc('users/u1').get()).data()?.mbtiExpiresAt).toBe(addMonths(NOW, 3));
    });

    it('restarts the expiry when the mbti changes', async () => {
        const later = new ProfileService({ clock: () => addMonths(NOW, 1) });

        await service.updateProfile('u1', {
            ...input, mbti: 'INTJ',
        });
        await later.updateProfile('u1', {
            ...input, mbti: 'ENFP',
        });

        expect((await db.doc('users/u1').get()).data()?.mbtiExpiresAt).toBe(addMonths(NOW, 4));
    });
});
