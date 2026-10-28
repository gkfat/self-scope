import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { FakeFirestore } from '../test-utils/fakeFirestore';
import { ReportSnapshotService } from './reportSnapshot.service';
import {
    reportSnapshotDocSchema, type ReportSnapshotContent,
} from '../../shared/schemas/firestore/reportSnapshot.schema';
import {
    reportSnapshotDetailSchema, reportSnapshotItemSchema,
} from '../../shared/schemas/api/reportSnapshot.schema';
import {
    MAX_SNAPSHOTS_PER_USER, SNAPSHOT_RETENTION_MONTHS,
} from '../../shared/utils/reportSnapshot';
import { addMonths } from '../../shared/utils/time';
import {
    NotFoundError, ValidationError,
} from '../../shared/types/errors';

const holder = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('../utils/firebaseAdmin', () => ({ getAdminFirestore: () => holder.db }));

const NOW = Date.UTC(2026, 9, 28, 12);

const content = (overrides: Partial<ReportSnapshotContent> = {}): ReportSnapshotContent => ({
    kind: 'SINGLE',
    systems: ['ZODIAC'],
    position: '太陽天蠍座',
    blocks: [
        {
            key: 'position',
            title: '位置結論',
            segments: [
                {
                    text: '你的太陽在天蠍座。',
                    kind: 'FACT',
                    sources: [
                        {
                            system: 'ZODIAC', term: 'zodiac:scorpio',
                        },
                    ],
                    timeSensitive: false,
                    asOf: null,
                },
            ],
        },
    ],
    versions: {
        ontology: 'ontology-v1', mapping: 'mapping-v1', fragments: 'fragments-v1', templates: 'templates-v1', prompt: null,
    },
    basis: [],
    aiAugmented: false,
    ...overrides,
});

describe('ReportSnapshotService', () => {
    let db: FakeFirestore;
    let clock: { now: number };
    let service: ReportSnapshotService;

    beforeEach(() => {
        db = new FakeFirestore();
        holder.db = db;
        clock = { now: NOW };
        service = new ReportSnapshotService({ clock: () => clock.now });
    });

    describe('save and get', () => {
        it('keeps the full text with the versions, the basis and the time it was made', async () => {
            const { id } = await service.save('u1', content({
                basis: [
                    {
                        system: 'ZODIAC', method: 'sun-sign-from-birth-date', ruleVersion: 'zodiac-v1', inputs: { birthDate: '1989-10-27' },
                    },
                ],
            }));
            const detail = await service.get('u1', id);

            expect(reportSnapshotDetailSchema.safeParse(detail).success).toBe(true);
            expect(detail.blocks[0]?.segments[0]?.text).toBe('你的太陽在天蠍座。');
            expect(detail.versions).toMatchObject({
                ontology: 'ontology-v1', mapping: 'mapping-v1', fragments: 'fragments-v1', templates: 'templates-v1',
            });
            expect(detail.basis[0]).toMatchObject({
                system: 'ZODIAC', ruleVersion: 'zodiac-v1',
            });
            expect(detail.generatedAt).toBe(NOW);
        });

        it('is read as it was made even when what it was made from changes afterwards', async () => {
            await db.doc('fixedContents/ZODIAC_scorpio').set({ body: { summary: '舊的說法' } });

            const { id } = await service.save('u1', content());

            // The fixed content is rewritten later; the stored report holds the words themselves, not a reference
            await db.doc('fixedContents/ZODIAC_scorpio').set({ body: { summary: '改過的說法' } });

            const detail = await service.get('u1', id);

            expect(detail.blocks[0]?.segments[0]?.text).toBe('你的太陽在天蠍座。');
            expect(JSON.stringify(detail)).not.toContain('改過的說法');
        });

        it('expires 6 months after it was made', async () => {
            const {
                id, expiresAt, 
            } = await service.save('u1', content());

            expect(expiresAt).toBe(addMonths(NOW, SNAPSHOT_RETENTION_MONTHS));
            expect(reportSnapshotDocSchema.parse((await db.doc(`users/u1/reportSnapshots/${id}`).get()).data()).expiresAt).toBe(expiresAt);
        });

        it('keeps the sentences of a time-sensitive report with the date they were made for', async () => {
            const { id } = await service.save('u1', content({
                blocks: [
                    {
                        key: 'time',
                        title: '時間',
                        segments: [
                            {
                                text: '依八字大運，這一步運主題偏向穩定累積。',
                                kind: 'SYSTEM_INTERPRETATION',
                                sources: [
                                    {
                                        system: 'BAZI', term: 'bazi:strength:strong',
                                    },
                                ],
                                timeSensitive: true,
                                asOf: '2026-10-28',
                            },
                        ],
                    },
                ],
            }));

            expect((await service.get('u1', id)).blocks[0]?.segments[0]).toMatchObject({
                timeSensitive: true, asOf: '2026-10-28',
            });
        });
    });

    describe('what is turned away', () => {
        const rejected = async (value: unknown) => {
            await expect(service.save('u1', value as ReportSnapshotContent)).rejects.toBeInstanceOf(ValidationError);
            expect(db.paths().filter((p) => p.includes('reportSnapshots'))).toEqual([]);
        };

        it('a sentence without a kind', async () => {
            const base = content();
            const segment = { ...base.blocks[0]?.segments[0] } as Record<string, unknown>;

            delete segment.kind;
            await rejected({
                ...base, blocks: [
                    {
                        ...base.blocks[0], segments: [segment],
                    },
                ],
            });
        });

        it('a sentence without a source', async () => {
            const base = content();

            await rejected({
                ...base, blocks: [
                    {
                        ...base.blocks[0], segments: [
                            {
                                ...base.blocks[0]?.segments[0], sources: [],
                            },
                        ],
                    },
                ],
            });
        });

        it('a time-sensitive sentence without the date it was made for', async () => {
            const base = content();

            await rejected({
                ...base, blocks: [
                    {
                        ...base.blocks[0], segments: [
                            {
                                ...base.blocks[0]?.segments[0], timeSensitive: true, asOf: null,
                            },
                        ],
                    },
                ],
            });
        });

        it('a single report about two systems and a multi report about one', async () => {
            await rejected(content({ systems: ['ZODIAC', 'BAZI'] }));
            await rejected(content({
                kind: 'MULTI', systems: ['ZODIAC'],
            }));
        });
    });

    describe('who can read it', () => {
        it('only the member: another member gets not found, the same as for an id that does not exist', async () => {
            const { id } = await service.save('u1', content());

            await expect(service.get('u2', id)).rejects.toBeInstanceOf(NotFoundError);
            await expect(service.get('u1', 'nope')).rejects.toBeInstanceOf(NotFoundError);
            expect(await service.list('u2')).toEqual([]);
        });

        it('not after it has expired, in a list or on its own', async () => {
            const { id } = await service.save('u1', content());

            clock.now = addMonths(NOW, SNAPSHOT_RETENTION_MONTHS) + 1000;

            await expect(service.get('u1', id)).rejects.toBeInstanceOf(NotFoundError);
            expect(await service.list('u1')).toEqual([]);
        });
    });

    describe('list', () => {
        it('gives the newest first, without the text of the report', async () => {
            const first = await service.save('u1', content({ position: '第一份' }));

            clock.now += 1000;

            const second = await service.save('u1', content({ position: '第二份' }));
            const items = await service.list('u1');

            expect(items.map((item) => item.id)).toEqual([second.id, first.id]);
            expect(items.every((item) => reportSnapshotItemSchema.safeParse(item).success)).toBe(true);
            expect(JSON.stringify(items)).not.toContain('你的太陽在天蠍座');
        });
    });

    describe('the limit', () => {
        it('removes the oldest report when a member at the limit makes another, and only that one', async () => {
            const ids: string[] = [];

            for (let n = 0; n < MAX_SNAPSHOTS_PER_USER; n += 1) {
                clock.now += 1000;
                ids.push((await service.save('u1', content({ position: `報告 ${n}` }))).id);
            }

            await db.doc('users/u2/reportSnapshots/other').set({ position: 'x' });
            clock.now += 1000;

            const newest = await service.save('u1', content({ position: '最新' }));
            const remaining = db.paths().filter((p) => p.startsWith('users/u1/reportSnapshots/'));

            expect(remaining).toHaveLength(MAX_SNAPSHOTS_PER_USER);
            expect(remaining).not.toContain(`users/u1/reportSnapshots/${ids[0]}`);
            expect(remaining).toContain(`users/u1/reportSnapshots/${ids[1]}`);
            expect(remaining).toContain(`users/u1/reportSnapshots/${newest.id}`);
            expect(db.paths()).toContain('users/u2/reportSnapshots/other');
        });

        it('removes nothing while the member is below the limit', async () => {
            await service.save('u1', content());
            clock.now += 1000;
            await service.save('u1', content());

            expect(db.paths().filter((p) => p.startsWith('users/u1/reportSnapshots/'))).toHaveLength(2);
        });
    });
});
