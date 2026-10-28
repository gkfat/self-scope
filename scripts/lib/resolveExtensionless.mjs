const RELATIVE = /^\.{1,2}\//;
const MISSING = new Set(['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT']);

/**
 * Lets a script import the project's own TypeScript when the import names no extension: `./schema` is tried as
 * `./schema.ts`, then as `./schema/index.ts`. Anything else still fails exactly as Node would, with the original error.
 */
export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (error) {
        if (!RELATIVE.test(specifier) || !MISSING.has(error.code)) throw error;

        for (const suffix of ['.ts', '/index.ts']) {
            try {
                return await nextResolve(`${specifier}${suffix}`, context);
            } catch (retryError) {
                // Not this suffix: try the next, and report the original failure if none fits.
                if (!MISSING.has(retryError.code)) throw retryError;
            }
        }

        throw error;
    }
}
