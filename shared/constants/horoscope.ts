import type { NatalBody } from './natal';

/** The twelve houses: a sign is one house, counted from the member's own sign as the first. */
export const HOUSE_COUNT = 12;

/** The bodies a sign horoscope reads, and what each stands for; the slow ones barely move in a day. */
export const HOROSCOPE_BODIES = [
    'MOON',
    'SUN',
    'MERCURY',
    'VENUS',
    'MARS',
] as const satisfies readonly NatalBody[];

export type HoroscopeBody = typeof HOROSCOPE_BODIES[number];

/** The part of life each body is read for, in the order they are shown (the Moon first: it changes every day). */
export const HOROSCOPE_AREAS: Readonly<Record<HoroscopeBody, { name: string; area: string }>> = {
    MOON: {
        name: '月亮', area: '今日心情與節奏',
    },
    SUN: {
        name: '太陽', area: '這段時間的主題',
    },
    MERCURY: {
        name: '水星', area: '溝通與思考',
    },
    VENUS: {
        name: '金星', area: '感情與人際',
    },
    MARS: {
        name: '火星', area: '行動與精力',
    },
};

/** Key of the written content of a body in a house: `<BODY>_<1 to 12>`. */
export function horoscopeContentKey(body: HoroscopeBody, house: number): string {
    return `${body}_${house}`;
}

/** Every key the content can have: five bodies in twelve houses, 60 in all. */
export function horoscopeContentKeys(): string[] {
    return HOROSCOPE_BODIES.flatMap((body) => Array.from({ length: HOUSE_COUNT }, (_, index) => horoscopeContentKey(body, index + 1)));
}

/**
 * Whether the sign horoscope is shown on the fortune page and the home page. Off until the 60 texts are reviewed
 * and imported, since the horoscope answers 404 ("準備中") without them.
 */
export const HOROSCOPE_ENTRY_ENABLED = true;
