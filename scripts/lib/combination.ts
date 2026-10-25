import { parseSummaryKey } from '../../shared/utils/fixedContentKeys.ts';

/** Stored next to summary documents so they can be queried by combination. */
export function summaryKeyToCombination(key: string) {
    return parseSummaryKey(key);
}
