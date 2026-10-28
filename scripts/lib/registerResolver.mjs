import { register } from 'node:module';

// Most of shared/ is written for the bundler and leaves the extension off its relative imports; Node needs it.
register('./resolveExtensionless.mjs', import.meta.url);
