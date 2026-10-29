/**
 * The overall reading of a result opens with its verdict in a few words: "深入專注的洞察者：你對事物的本質…". The words
 * before the first colon are the verdict, which the banner shows under the headline; the rest is the reading.
 */
export function splitLead(text: string): { tagline: string; rest: string } {
    const colon = text.indexOf('：');

    return colon <= 0
        ? {
            tagline: '', rest: text,
        }
        : {
            tagline: text.slice(0, colon).trim(), rest: text.slice(colon + 1).trim(),
        };
}
