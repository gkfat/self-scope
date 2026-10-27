/**
 * End-to-end smoke test of the whole member flow against the REAL Firebase project
 * (guest test, login, claim, points, summaries, purchase + webhook, share, delete, re-register).
 *
 * It creates a throw-away Auth user, a test point package and a few fixed-content
 * documents, and removes all of them (and everything the run created) at the end.
 *
 * Usage (needs a dev server using the dev payment provider):
 *   export PAYMENT_PROVIDER=dev PAYMENT_DEV_WEBHOOK_SECRET=$(openssl rand -hex 24)
 *   pnpm exec nuxt dev --port 3111        # in another terminal, same env
 *   pnpm e2e:smoke
 */
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getScriptFirestore } from './lib/admin.ts';
import { DIGITAL_CONTENT_TERMS_VERSION } from '../shared/constants/terms.ts';

const BASE = 'http://localhost:3111/api';
const UID = 'e2e-test-user';
const EMAIL = 'e2e-test@example.com';
const DEV_SECRET = process.env.PAYMENT_DEV_WEBHOOK_SECRET as string;

const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n')
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]));

const db = getScriptFirestore();
const auth = getAuth(getApps()[0]);
const results: Array<{ ok: boolean; label: string; detail: string }> = [];
const guestIds: string[] = [];

function check(label: string, ok: boolean, detail = '') {
    results.push({
        ok, label, detail,
    });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  -> ${detail}`}`);
}

type Reply = { status: number; body: unknown };

/** Read a nested value from a JSON response by dot path ("batches.0.expiresAt"); undefined when absent. */
function val(body: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
        if (typeof current === 'string' && key === 'length') return current.length;
        if (current === null || typeof current !== 'object') return undefined;

        return (current as Record<string, unknown>)[key];
    }, body);
}

/** A JSON response (or field) as an array; empty when it is not one. */
function list(value: unknown): Array<Record<string, unknown>> {
    return Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
}

async function call(method: string, path: string, options: { token?: string; guest?: string; body?: unknown; raw?: string; headers?: Record<string, string> } = {}): Promise<Reply> {
    const headers: Record<string, string> = { ...options.headers };

    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.guest) headers['X-Guest-Session-Id'] = options.guest;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: options.raw ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    });
    const text = await response.text();
    let body: unknown = text;

    try {
        body = JSON.parse(text);
    } catch { /* non-JSON body is kept as text */ }

    return {
        status: response.status, body,
    };
}

async function idTokenFor(uid: string): Promise<string> {
    const custom = await auth.createCustomToken(uid);
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${env.NUXT_PUBLIC_FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token: custom, returnSecureToken: true,
        }),
    });

    if (!response.ok) {
        throw new Error(`sign-in with custom token failed: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
    }

    return (await response.json()).idToken;
}

const content = (type: string, key: string) => ({
    contentType: type,
    key,
    body: {
        title: `E2E ${key}`, summary: `E2E 摘要 ${key}`, strengths: [], blindSpots: [], loveStyle: '', workStyle: '', communicationStyle: '', growthAdvice: '', disclaimer: '僅供娛樂與自我探索',
    },
    contentVersion: '1',
    status: 'PUBLISHED',
    updatedAt: Date.now(),
    publishedAt: Date.now(),
});

const seededContent = [
    'MBTI_ESTJ',
    'SUMMARY_aries_ESTJ',
    'SUMMARY_aries_A',
    'SUMMARY_aries_B',
    'SUMMARY_ESTJ_A',
    'SUMMARY_aries_ESTJ_B',
];

async function cleanup() {
    console.log('\n--- cleanup');
    for (const user of [UID]) {
        try {
            await auth.deleteUser(user);
        } catch { /* already gone */ }
        await db.recursiveDelete(db.collection('users').doc(user));
    }
    for (const id of seededContent) await db.collection('fixedContents').doc(id).delete();
    await db.collection('pointPackages').doc('e2e-small').delete();
    for (const id of guestIds) await db.collection('guestSessions').doc(id).delete();
    const key = env.WELCOME_GRANT_HMAC_KEY as string;
    await db.collection('welcomeGrants').doc(createHmac('sha256', key).update(UID).digest('hex')).delete();
    const limits = await db.collection('rateLimits').get();
    for (const doc of limits.docs) await doc.ref.delete();
    const unmatched = await db.collection('unmatchedPaymentEvents').get();
    for (const doc of unmatched.docs) await doc.ref.delete();
    console.log('cleanup done');
}

const answers = JSON.parse(readFileSync('content/tests/personality16-v1.json', 'utf8')).questions
    .map((q: { questionId: string; direction: string }) => ({
        questionId: q.questionId, value: q.direction === 'first' ? 5 : 1,
    }));

try {
    // ---- seed
    try {
        await auth.deleteUser(UID);
    } catch { /* not there */ }
    await db.recursiveDelete(db.collection('users').doc(UID));
    await db.collection('welcomeGrants').doc(createHmac('sha256', env.WELCOME_GRANT_HMAC_KEY as string).update(UID).digest('hex')).delete();

    for (const id of seededContent) {
        const [type, ...rest] = id.split('_');
        await db.collection('fixedContents').doc(id).set(content(type as string, rest.join('_')));
    }
    await db.collection('pointPackages').doc('e2e-small').set({
        points: 5, price: {
            amount: 100, currency: 'TWD', 
        }, validityDays: null, active: true,
    });
    await auth.createUser({
        uid: UID, email: EMAIL, emailVerified: true,
    });

    // ---- guest
    const session = await call('POST', '/guest-sessions');
    check('guest: session created', session.status === 200 && val(session.body, 'sessionId.length') === 32, JSON.stringify(session.body).slice(0, 100));
    const sid = val(session.body, 'sessionId') as string;
    guestIds.push(sid);

    const guestResult = await call('POST', '/tests/personality16/submissions', {
        guest: sid, body: {
            testVersion: '1', answers,
        },
    });
    check('guest: test scored on the server (ESTJ), not saved', guestResult.status === 200 && val(guestResult.body, 'result') === 'ESTJ' && val(guestResult.body, 'persisted') === false, JSON.stringify(guestResult.body).slice(0, 160));
    check('guest: result carries the disclaimer', val(guestResult.body, 'content.disclaimer') === '僅供娛樂與自我探索');
    const guestSummary = await call('POST', '/summaries');
    check('guest: cannot get a summary (401)', guestSummary.status === 401);

    // ---- login
    const token = await idTokenFor(UID);
    const login = await call('POST', '/auth/login', { body: { idToken: token } });
    check('login: new account gets 3 welcome points', login.status === 200 && val(login.body, 'isNewUser') === true && val(login.body, 'welcomePointsGranted') === 3, JSON.stringify(login.body));
    const again = await call('POST', '/auth/login', { body: { idToken: token } });
    check('login: second login is not new and grants nothing', val(again.body, 'isNewUser') === false && val(again.body, 'welcomePointsGranted') === 0, JSON.stringify(again.body));
    const badLogin = await call('POST', '/auth/login', { body: { idToken: 'garbage' } });
    check('login: invalid token rejected (401)', badLogin.status === 401);

    // ---- claim guest result
    const claim = await call('POST', `/guest-sessions/${sid}/claim`, { token });
    check('claim: guest result saved to the account', claim.status === 200 && val(claim.body, 'savedAttempts') === 1, JSON.stringify(claim.body));
    const claimAgain = await call('POST', `/guest-sessions/${sid}/claim`, { token });
    check('claim: repeating it is idempotent', claimAgain.status === 200 && val(claimAgain.body, 'savedAttempts') === 1);
    const attempts1 = await call('GET', '/test-attempts', { token });
    check('claim: attempt visible in history (3-month expiry)', val(attempts1.body, 'length') === 1 && val(attempts1.body, '0.result') === 'ESTJ', JSON.stringify(attempts1.body).slice(0, 160));

    // ---- profile
    const profile = {
        birthData: {
            birthDate: '1995-03-25', zodiac: 'aries', birthTime: '08:30', birthPlace: 'tw-taipei', 
        }, bloodType: 'O', 
    };
    const put = await call('PUT', '/profile', {
        token, body: profile, 
    });
    check('profile: saved, mbti from the claimed test kept', put.status === 200 && val(put.body, 'mbti') === 'ESTJ' && val(put.body, 'bloodType') === 'O', JSON.stringify(put.body).slice(0, 160));
    const badProfile = await call('PUT', '/profile', {
        token, body: {
            birthData: {
                birthDate: '1995-03-25', zodiac: 'leo', 
            }, 
        }, 
    });
    check('profile: zodiac/date mismatch rejected (400)', badProfile.status === 400);

    // ---- points + summaries
    const points0 = await call('GET', '/points', { token });
    check('points: balance 3, welcome batch expires in ~90 days', val(points0.body, 'availableBalance') === 3 && Math.round((val(points0.body, 'batches.0.expiresAt') - Date.now()) / 86400000) >= 89, JSON.stringify(points0.body).slice(0, 200));

    // Written-content analyses: 1 point for two dimensions, 3 for three (the welcome grant is 3)
    const s1 = await call('POST', '/summaries', {
        token, body: { dimensions: ['ZODIAC', 'MBTI'] },
    });
    check('summary: a pair costs 1 point (201)', s1.status === 201 && val(s1.body, 'pointsDeducted') === 1 && val(s1.body, 'summaryId') === 'aries_ESTJ', JSON.stringify(s1.body).slice(0, 160));
    const s1b = await call('POST', '/summaries', {
        token, body: { dimensions: ['MBTI', 'ZODIAC'] },
    });
    check('summary: asking again is free (200)', s1b.status === 200 && val(s1b.body, 'pointsDeducted') === 0);
    const race = await Promise.all(Array.from({ length: 5 }, () => call('POST', '/summaries', {
        token, body: { dimensions: ['ZODIAC', 'MBTI'] },
    })));
    check('summary: concurrent repeats never charge again', race.every((r) => val(r.body, 'pointsDeducted') === 0));
    check('points: 2 left after one summary', val((await call('GET', '/points', { token })).body, 'availableBalance') === 2);
    check('summary: listed and readable', val((await call('GET', '/summaries', { token })).body, 'length') === 1 && (await call('GET', '/summaries/aries_ESTJ', { token })).status === 200);
    check('summary: other ids are 404', (await call('GET', '/summaries/aries_ESTJ_B', { token })).status === 404);
    const withHumanDesign = await call('POST', '/summaries', {
        token, body: { dimensions: ['ZODIAC', 'HUMAN_DESIGN'] },
    });
    check('summary: the human design is not offered here (400)', withHumanDesign.status === 400, JSON.stringify(withHumanDesign.body).slice(0, 120));

    await call('PUT', '/profile', {
        token, body: {
            ...profile, bloodType: 'AB',
        },
    });
    const noContent = await call('POST', '/summaries', {
        token, body: {
            dimensions: [
                'ZODIAC',
                'MBTI',
                'BLOOD',
            ], 
        },
    });
    check('summary: unpublished combination -> 404 and no charge', noContent.status === 404 && val((await call('GET', '/points', { token })).body, 'availableBalance') === 2);

    await call('PUT', '/profile', {
        token, body: {
            ...profile, bloodType: 'A',
        },
    });
    const zodiacBlood = await call('POST', '/summaries', {
        token, body: { dimensions: ['ZODIAC', 'BLOOD'] },
    });
    check('summary: zodiac x blood costs 1 point', zodiacBlood.status === 201 && val(zodiacBlood.body, 'summaryId') === 'aries_A');
    const bloodMbti = await call('POST', '/summaries', {
        token, body: { dimensions: ['BLOOD', 'MBTI'] },
    });
    check('summary: blood x MBTI costs the last point', bloodMbti.status === 201 && val(bloodMbti.body, 'summaryId') === 'ESTJ_A' && val((await call('GET', '/points', { token })).body, 'availableBalance') === 0);
    await call('PUT', '/profile', {
        token, body: {
            ...profile, bloodType: 'B',
        },
    });
    const broke = await call('POST', '/summaries', {
        token, body: { dimensions: ['ZODIAC', 'BLOOD'] },
    });
    check('summary: no points -> 402, nothing created', broke.status === 402 && val((await call('GET', '/summaries', { token })).body, 'length') === 3, JSON.stringify(broke.body).slice(0, 120));

    // ---- logged-in test submission
    const saved = await call('POST', '/tests/personality16/submissions', {
        token, body: {
            testVersion: '1', answers, 
        }, 
    });
    check('test: logged-in result is saved', saved.status === 200 && val(saved.body, 'persisted') === true && !!val(saved.body, 'attemptId'), JSON.stringify(saved.body).slice(0, 140));
    check('test: history has both attempts', val((await call('GET', '/test-attempts', { token })).body, 'length') === 2);
    const incomplete = await call('POST', '/tests/personality16/submissions', {
        token, body: {
            testVersion: '1', answers: answers.slice(1), 
        }, 
    });
    check('test: incomplete answers rejected (400)', incomplete.status === 400);

    // ---- purchase (dev payment provider)
    const packages = await call('GET', '/point-packages');
    check('payments: package listed', list(packages.body).some((item) => item.packageId === 'e2e-small'), JSON.stringify(packages.body).slice(0, 120));
    const noConsent = await call('POST', '/payments', {
        token, body: {
            packageId: 'e2e-small', acceptDigitalContentTerms: false, termsVersion: DIGITAL_CONTENT_TERMS_VERSION, 
        }, 
    });
    check('payments: no consent -> 400', noConsent.status === 400);
    const oldTerms = await call('POST', '/payments', {
        token, body: {
            packageId: 'e2e-small', acceptDigitalContentTerms: true, termsVersion: 'old', 
        }, 
    });
    check('payments: outdated terms -> 400', oldTerms.status === 400);
    const pay = await call('POST', '/payments', {
        token, body: {
            packageId: 'e2e-small', acceptDigitalContentTerms: true, termsVersion: DIGITAL_CONTENT_TERMS_VERSION, 
        }, 
    });
    check('payments: checkout created with the no-refund notice (201)', pay.status === 201 && String(val(pay.body, 'noRefundNotice')).includes('不退款'), JSON.stringify(pay.body).slice(0, 140));
    const paymentId = val(pay.body, 'paymentId') as string;

    const event = (eventId: string, type: string) => JSON.stringify({
        eventId, type, paymentId, userId: UID, providerSessionId: `dev_${paymentId}`, 
    });
    const sign = (raw: string) => createHmac('sha256', DEV_SECRET).update(raw).digest('hex');
    const unsigned = await call('POST', '/payments/webhook', {
        raw: event('evt-1', 'PAYMENT_SUCCEEDED'), headers: { 'Content-Type': 'application/json' }, 
    });
    check('webhook: unsigned -> 401', unsigned.status === 401, `status ${unsigned.status}`);
    const forged = await call('POST', '/payments/webhook', {
        raw: event('evt-1', 'PAYMENT_SUCCEEDED'), headers: {
            'Content-Type': 'application/json', 'x-dev-signature': sign('something else'), 
        }, 
    });
    check('webhook: wrong signature -> 401', forged.status === 401);
    check('webhook: nothing credited yet', val((await call('GET', '/points', { token })).body, 'availableBalance') === 0);

    const raw1 = event('evt-1', 'PAYMENT_SUCCEEDED');
    const hook1 = await call('POST', '/payments/webhook', {
        raw: raw1, headers: {
            'Content-Type': 'application/json', 'x-dev-signature': sign(raw1), 
        }, 
    });
    check('webhook: signed success accepted', hook1.status === 200 && val(hook1.body, 'received') === true, JSON.stringify(hook1.body).slice(0, 100));
    const hook2 = await call('POST', '/payments/webhook', {
        raw: raw1, headers: {
            'Content-Type': 'application/json', 'x-dev-signature': sign(raw1), 
        }, 
    });
    const raw3 = event('evt-2', 'PAYMENT_SUCCEEDED');
    await call('POST', '/payments/webhook', {
        raw: raw3, headers: {
            'Content-Type': 'application/json', 'x-dev-signature': sign(raw3), 
        }, 
    });
    const points5 = await call('GET', '/points', { token });
    check('webhook: points credited exactly once (5), repeats ignored', hook2.status === 200 && val(points5.body, 'availableBalance') === 5 && val(points5.body, 'batches.0.expiresAt') === null, JSON.stringify(points5.body).slice(0, 160));
    const payments = await call('GET', '/payments', { token });
    check('payments: history shows COMPLETED', val(payments.body, '0.status') === 'COMPLETED' && val(payments.body, '0.pointsPurchased') === 5);

    const spend = await call('POST', '/summaries', {
        token, body: {
            dimensions: [
                'ZODIAC',
                'MBTI',
                'BLOOD',
            ], 
        },
    });
    check('summary: bought points can be spent (3 for three dimensions)', spend.status === 201 && val(spend.body, 'pointsDeducted') === 3 && val((await call('GET', '/points', { token })).body, 'availableBalance') === 2);

    const txs = await call('GET', '/points/transactions', {
        token, headers: {}, 
    });
    const types = list(val(txs.body, 'items')).map((item) => String(item.type)).sort().join(',');
    check('transactions: GRANT + PURCHASE + 4 DEDUCT recorded', types === 'DEDUCT,DEDUCT,DEDUCT,DEDUCT,GRANT,PURCHASE', types);
    const page = await call('GET', '/points/transactions?limit=2', { token });
    check('transactions: pagination returns a cursor', val(page.body, 'items.length') === 2 && !!val(page.body, 'nextCursor'));

    // ---- share cards
    const card = await call('POST', '/share-cards', {
        token, body: {
            source: 'SUMMARY', referenceId: 'aries_ESTJ', 
        }, 
    });
    check('share: card for own summary has no personal data', card.status === 200 && !JSON.stringify(card.body).includes('1995') && !JSON.stringify(card.body).includes(EMAIL), JSON.stringify(card.body).slice(0, 120));
    check('share: summary card needs sign-in (401)', (await call('POST', '/share-cards', {
        body: {
            source: 'SUMMARY', referenceId: 'aries_ESTJ', 
        }, 
    })).status === 401);
    check('share: single result card works for guests', (await call('POST', '/share-cards', {
        body: {
            source: 'SINGLE_RESULT', referenceId: 'MBTI:ESTJ', 
        }, 
    })).status === 200);

    // ---- human design
    const guestChart = await call('POST', '/human-design/calculations', {
        body: {
            birthDate: '1990-06-15', birthTime: '12:00', birthPlace: 'es-madrid',
        },
    });
    check('human design: a guest gets the chart without saving it', guestChart.status === 200 && val(guestChart.body, 'type') === 'MANIFESTING_GENERATOR' && val(guestChart.body, 'saved') === false, JSON.stringify(guestChart.body).slice(0, 120));
    check('human design: missing birth time asks for it (422)', (await call('POST', '/human-design/calculations', {
        body: {
            birthDate: '1990-06-15', birthPlace: 'es-madrid',
        },
    })).status === 422);
    check('human design: a city outside the list is rejected (400)', (await call('POST', '/human-design/calculations', {
        body: {
            birthDate: '1990-06-15', birthTime: '12:00', birthPlace: 'nowhere',
        },
    })).status === 400);
    check('human design: nothing saved yet for the member (404)', (await call('GET', '/human-design', { token })).status === 404);
    const memberChart = await call('POST', '/human-design/calculations', {
        token, body: {
            birthDate: '1996-10-27', birthTime: '01:30', birthPlace: 'gb-london',
        },
    });
    check('human design: a member gets the chart saved for 3 months', memberChart.status === 200 && val(memberChart.body, 'profile') === '2/5' && val(memberChart.body, 'saved') === true && typeof val(memberChart.body, 'expiresAt') === 'number', JSON.stringify(memberChart.body).slice(0, 120));
    const savedChart = await call('GET', '/human-design', { token });
    check('human design: the saved chart can be read back', savedChart.status === 200 && val(savedChart.body, 'profile') === '2/5');
    const hdCard = await call('POST', '/share-cards', {
        token, body: {
            source: 'HUMAN_DESIGN', referenceId: 'main',
        },
    });
    check('human design: share card has the type and no birth data', hdCard.status === 200 && String(val(hdCard.body, 'title')).includes('顯示生產者') && !JSON.stringify(hdCard.body).includes('1996'), JSON.stringify(hdCard.body).slice(0, 120));
    check('human design: share card needs sign-in (401)', (await call('POST', '/share-cards', {
        body: {
            source: 'HUMAN_DESIGN', referenceId: 'main',
        },
    })).status === 401);

    // ---- cron
    const cron = await call('GET', '/cron/data-expiry', { headers: { Authorization: `Bearer ${env.CRON_SECRET}` } });
    check('cron: runs with the secret', cron.status === 200, JSON.stringify(cron.body).slice(0, 200));
    console.log(`      cron failed steps: ${JSON.stringify(val(cron.body, 'failed'))}`);

    // ---- deletion
    const noScope = await call('DELETE', '/account/data', {
        token, body: { scopes: [] }, 
    });
    check('delete data: empty scope rejected (400)', noScope.status === 400);
    const delSummaries = await call('DELETE', '/account/data', {
        token, body: { scopes: ['SUMMARIES'] }, 
    });
    check('delete data: summaries removed, points untouched', delSummaries.status === 200 && val((await call('GET', '/summaries', { token })).body, 'length') === 0 && val((await call('GET', '/points', { token })).body, 'availableBalance') === 2);

    const delAccount = await call('DELETE', '/account', { token });
    check('delete account: accepted', delAccount.status === 200, JSON.stringify(delAccount.body).slice(0, 120));
    const left = (await db.collection('users').doc(UID).listCollections()).length;
    check('delete account: user document and every sub-collection are gone', !(await db.collection('users').doc(UID).get()).exists && left === 0, `${left} sub-collections left`);
    let authGone = false;
    try {
        await auth.getUser(UID);
    } catch {
        authGone = true;
    }
    check('delete account: Firebase Auth user removed', authGone);
    const grantHash = createHmac('sha256', env.WELCOME_GRANT_HMAC_KEY as string).update(UID).digest('hex');
    check('delete account: only the hashed welcome-grant record remains', (await db.collection('welcomeGrants').doc(grantHash).get()).exists);

    // ---- re-register within 3 months
    await auth.createUser({
        uid: UID, email: EMAIL, emailVerified: true, 
    });
    const token2 = await idTokenFor(UID);
    const relogin = await call('POST', '/auth/login', { body: { idToken: token2 } });
    check('re-register: treated as a brand-new account', val(relogin.body, 'isNewUser') === true, JSON.stringify(relogin.body));
    check('re-register: no second welcome grant within 3 months', val(relogin.body, 'welcomePointsGranted') === 0, JSON.stringify(relogin.body));
    check('re-register: no history carried over', val((await call('GET', '/test-attempts', { token: token2 })).body, 'length') === 0 && val((await call('GET', '/points', { token: token2 })).body, 'availableBalance') === 0);
} catch (error) {
    check('script ran to the end', false, error instanceof Error ? error.message : String(error));
} finally {
    await cleanup();
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    if (failed.length > 0) process.exitCode = 1;
}
