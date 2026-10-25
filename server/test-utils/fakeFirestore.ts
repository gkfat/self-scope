/**
 * Minimal in-memory Firestore fake for unit tests.
 *
 * Supports the subset the services use: documents, sub-collections, simple
 * queries, collection-group queries, recursiveDelete and transactions with
 * optimistic concurrency (a transaction retries when a document it read was
 * changed by another writer before commit), which is what the idempotency and
 * concurrency tests rely on.
 */

type Data = Record<string, unknown>;

type StoredDoc = {
    data: Data;
    version: number;
};

type Filter = {
    field: string;
    op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains';
    value: unknown;
};

type Order = {
    field: string;
    direction: 'asc' | 'desc';
};

type PendingWrite =
    | { kind: 'set'; path: string; data: Data }
    | { kind: 'update'; path: string; data: Data }
    | { kind: 'create'; path: string; data: Data }
    | { kind: 'delete'; path: string };

class FakeStoreError extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.code = code;
    }
}

function clone<T>(value: T): T {
    return structuredClone(value);
}

function comparable(value: unknown): number | string | boolean | null {
    if (value instanceof Date) return value.getTime();
    if (value === undefined || value === null) return null;
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
    return JSON.stringify(value);
}

function getField(data: Data, field: string): unknown {
    return field.split('.').reduce<unknown>((acc, key) => {
        if (acc && typeof acc === 'object') return (acc as Data)[key];
        return undefined;
    }, data);
}

function matches(data: Data, filter: Filter): boolean {
    const actual = getField(data, filter.field);
    const a = comparable(actual);
    const b = comparable(filter.value);

    switch (filter.op) {
    case '==': return a === b;
    case '!=': return a !== b;
    case '<': return a !== null && b !== null && a < b;
    case '<=': return a !== null && b !== null && a <= b;
    case '>': return a !== null && b !== null && a > b;
    case '>=': return a !== null && b !== null && a >= b;
    case 'in': return Array.isArray(filter.value) && filter.value.some((v) => comparable(v) === a);
    case 'array-contains': return Array.isArray(actual) && actual.some((v) => comparable(v) === b);
    }
}

export class FakeDocumentSnapshot {
    constructor(
        readonly ref: FakeDocumentReference,
        private readonly stored: StoredDoc | undefined,
    ) {}

    get id() {
        return this.ref.id;
    }

    get exists() {
        return this.stored !== undefined;
    }

    data(): Data | undefined {
        return this.stored ? clone(this.stored.data) : undefined;
    }
}

export class FakeQuerySnapshot {
    constructor(readonly docs: FakeDocumentSnapshot[]) {}

    get empty() {
        return this.docs.length === 0;
    }

    get size() {
        return this.docs.length;
    }
}

export class FakeQuery {
    constructor(
        protected readonly db: FakeFirestore,
        protected readonly scope: { collectionPath?: string; collectionId?: string },
        protected readonly filters: Filter[] = [],
        protected readonly orders: Order[] = [],
        protected readonly limitCount?: number,
    ) {}

    where(field: string, op: Filter['op'], value: unknown): FakeQuery {
        return new FakeQuery(this.db, this.scope, [
            ...this.filters, {
                field, op, value,
            },
        ], this.orders, this.limitCount);
    }

    orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): FakeQuery {
        return new FakeQuery(this.db, this.scope, this.filters, [
            ...this.orders, {
                field, direction,
            },
        ], this.limitCount);
    }

    limit(count: number): FakeQuery {
        return new FakeQuery(this.db, this.scope, this.filters, this.orders, count);
    }

    /** Resolve matching documents (used by get() and transactions). */
    resolve(): FakeDocumentSnapshot[] {
        const entries = [...this.db.entries()].filter(([path]) => this.inScope(path));
        let rows = entries
            .filter(([, stored]) => this.filters.every((f) => matches(stored.data, f)));

        for (const order of [...this.orders].reverse()) {
            rows = rows.sort(([, x], [, y]) => {
                const a = comparable(getField(x.data, order.field));
                const b = comparable(getField(y.data, order.field));
                if (a === b) return 0;
                if (a === null) return -1;
                if (b === null) return 1;
                const result = a < b ? -1 : 1;
                return order.direction === 'asc' ? result : -result;
            });
        }

        if (this.limitCount !== undefined) rows = rows.slice(0, this.limitCount);

        return rows.map(([path, stored]) => new FakeDocumentSnapshot(this.db.doc(path), stored));
    }

    async get(): Promise<FakeQuerySnapshot> {
        return new FakeQuerySnapshot(this.resolve());
    }

    private inScope(path: string): boolean {
        const segments = path.split('/');
        const parentSegments = segments.slice(0, -1);

        if (this.scope.collectionPath) {
            return parentSegments.join('/') === this.scope.collectionPath;
        }

        return parentSegments[parentSegments.length - 1] === this.scope.collectionId;
    }
}

export class FakeCollectionReference extends FakeQuery {
    constructor(db: FakeFirestore, readonly path: string) {
        super(db, { collectionPath: path });
    }

    get id() {
        return this.path.split('/').pop() as string;
    }

    doc(id?: string): FakeDocumentReference {
        return this.db.doc(`${this.path}/${id ?? this.db.autoId()}`);
    }
}

export class FakeDocumentReference {
    constructor(private readonly db: FakeFirestore, readonly path: string) {}

    get id() {
        return this.path.split('/').pop() as string;
    }

    collection(name: string): FakeCollectionReference {
        return new FakeCollectionReference(this.db, `${this.path}/${name}`);
    }

    async get(): Promise<FakeDocumentSnapshot> {
        return new FakeDocumentSnapshot(this, this.db.read(this.path));
    }

    async set(data: Data): Promise<void> {
        this.db.apply([
            {
                kind: 'set', path: this.path, data,
            },
        ]);
    }

    async create(data: Data): Promise<void> {
        this.db.apply([
            {
                kind: 'create', path: this.path, data,
            },
        ]);
    }

    async update(data: Data): Promise<void> {
        this.db.apply([
            {
                kind: 'update', path: this.path, data,
            },
        ]);
    }

    async delete(): Promise<void> {
        this.db.apply([
            {
                kind: 'delete', path: this.path,
            },
        ]);
    }
}

export class FakeTransaction {
    private readonly reads = new Map<string, number>();
    private readonly writes: PendingWrite[] = [];

    constructor(private readonly db: FakeFirestore) {}

    async get(target: FakeDocumentReference): Promise<FakeDocumentSnapshot>;
    async get(target: FakeQuery): Promise<FakeQuerySnapshot>;
    async get(target: FakeDocumentReference | FakeQuery) {
        if (target instanceof FakeDocumentReference) {
            this.reads.set(target.path, this.db.read(target.path)?.version ?? 0);
            return new FakeDocumentSnapshot(target, this.db.read(target.path));
        }

        const docs = target.resolve();
        for (const doc of docs) {
            this.reads.set(doc.ref.path, this.db.read(doc.ref.path)?.version ?? 0);
        }
        return new FakeQuerySnapshot(docs);
    }

    set(ref: FakeDocumentReference, data: Data) {
        this.writes.push({
            kind: 'set', path: ref.path, data,
        });
        return this;
    }

    create(ref: FakeDocumentReference, data: Data) {
        this.writes.push({
            kind: 'create', path: ref.path, data,
        });
        return this;
    }

    update(ref: FakeDocumentReference, data: Data) {
        this.writes.push({
            kind: 'update', path: ref.path, data,
        });
        return this;
    }

    delete(ref: FakeDocumentReference) {
        this.writes.push({
            kind: 'delete', path: ref.path,
        });
        return this;
    }

    /** True when nothing this transaction read has changed. */
    isConsistent(): boolean {
        return [...this.reads].every(([path, version]) => (this.db.read(path)?.version ?? 0) === version);
    }

    commit() {
        this.db.apply(this.writes);
    }
}

export class FakeFirestore {
    private readonly store = new Map<string, StoredDoc>();
    private versionCounter = 0;
    private idCounter = 0;

    autoId(): string {
        this.idCounter += 1;
        return `auto-${this.idCounter}`;
    }

    entries() {
        return this.store.entries();
    }

    read(path: string): StoredDoc | undefined {
        return this.store.get(path);
    }

    collection(path: string): FakeCollectionReference {
        return new FakeCollectionReference(this, path);
    }

    doc(path: string): FakeDocumentReference {
        return new FakeDocumentReference(this, path);
    }

    collectionGroup(id: string): FakeQuery {
        return new FakeQuery(this, { collectionId: id });
    }

    /** Apply writes atomically; validates create/update preconditions first. */
    apply(writes: PendingWrite[]) {
        for (const write of writes) {
            const existing = this.store.get(write.path);

            if (write.kind === 'create' && existing) {
                throw new FakeStoreError(`ALREADY_EXISTS: ${write.path}`, 6);
            }

            if (write.kind === 'update' && !existing) {
                throw new FakeStoreError(`NOT_FOUND: ${write.path}`, 5);
            }
        }

        for (const write of writes) {
            this.versionCounter += 1;

            if (write.kind === 'delete') {
                this.store.delete(write.path);
                continue;
            }

            if (write.kind === 'update') {
                const existing = this.store.get(write.path) as StoredDoc;
                this.store.set(write.path, {
                    data: {
                        ...existing.data, ...clone(write.data),
                    },
                    version: this.versionCounter,
                });
                continue;
            }

            this.store.set(write.path, {
                data: clone(write.data),
                version: this.versionCounter,
            });
        }
    }

    async runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T>): Promise<T> {
        const maxAttempts = 10;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            const tx = new FakeTransaction(this);
            const result = await fn(tx);

            if (tx.isConsistent()) {
                tx.commit();
                return result;
            }
        }

        throw new FakeStoreError('ABORTED: too much contention', 10);
    }

    async recursiveDelete(ref: FakeDocumentReference | FakeCollectionReference): Promise<void> {
        const prefix = `${ref.path}/`;
        const targets = [...this.store.keys()]
            .filter((path) => path === ref.path || path.startsWith(prefix))
            .map((path) => ({
                kind: 'delete' as const, path,
            }));

        this.apply(targets);
    }

    batch() {
        const writes: PendingWrite[] = [];
        const batch = {
            set: (ref: FakeDocumentReference, data: Data) => {
                writes.push({
                    kind: 'set', path: ref.path, data,
                });
                return batch;
            },
            update: (ref: FakeDocumentReference, data: Data) => {
                writes.push({
                    kind: 'update', path: ref.path, data,
                });
                return batch;
            },
            delete: (ref: FakeDocumentReference) => {
                writes.push({
                    kind: 'delete', path: ref.path,
                });
                return batch;
            },
            commit: async () => this.apply(writes),
        };
        return batch;
    }

    /** Test helper: all stored paths. */
    paths(): string[] {
        return [...this.store.keys()].sort();
    }
}
