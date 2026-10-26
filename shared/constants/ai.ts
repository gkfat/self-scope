/**
 * Detailed-report generation settings (CTX-CON-014, NFR-008, NFR-009).
 * They are plain constants so they can be tuned in one place after launch.
 */
export const DEFAULT_OPENAI_MODEL = 'gpt-5-mini';

/** List price (USD per million tokens) of the default model at the time of writing. */
export const DEFAULT_AI_PRICE_INPUT_PER_MTOK = 0.25;
export const DEFAULT_AI_PRICE_OUTPUT_PER_MTOK = 2;

/** Upper bound for one report's output (decision: standard length). */
export const REPORT_MAX_OUTPUT_TOKENS = 4000;

/** One generation attempt is abandoned after this long and counts as a failure (NFR-009). */
export const REPORT_TIMEOUT_MS = 120_000;

/**
 * A report still GENERATING this long after it was created lost its worker
 * (the function was killed): it is failed and refunded the next time it is read.
 */
export const REPORT_STALE_AFTER_MS = REPORT_TIMEOUT_MS + 60_000;

/** Per member: at most 3 generations an hour and 10 a day, regeneration included. */
export const REPORT_LIMIT_PER_HOUR = 3;
export const REPORT_LIMIT_PER_DAY = 10;

export const REPORT_RETENTION_MONTHS = 6;

export const REPORT_DISCLAIMER = '本報告為娛樂與自我探索用途，由 AI 依你提供的資料產生，不代表心理評估、診斷或專業建議，也不應作為重要決策的唯一依據。';
