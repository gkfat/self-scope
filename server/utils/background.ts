import { waitUntil } from '@vercel/functions';

/**
 * Run work after the HTTP response has been sent.
 *
 * On Vercel, `waitUntil` keeps the function alive until the promise settles (bounded by the
 * function's maxDuration). Outside Vercel it does nothing and the promise simply keeps running
 * in the long-lived dev server. The returned promise never rejects: failures go to `onError`.
 */
export function runInBackground(task: () => Promise<void>, onError: (error: unknown) => void): Promise<void> {
    const promise = task().catch(onError);

    waitUntil(promise);

    return promise;
}
