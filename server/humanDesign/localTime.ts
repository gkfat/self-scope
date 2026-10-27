const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
    const cached = formatters.get(timeZone);

    if (cached) return cached;

    const created = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    formatters.set(timeZone, created);

    return created;
}

/** Offset (ms) of the zone from UTC at the given instant, including daylight saving of that date. */
export function offsetAt(utcMs: number, timeZone: string): number {
    const parts = Object.fromEntries(
        formatterFor(timeZone).formatToParts(new Date(utcMs)).map((part) => [part.type, part.value]),
    );
    const asUtc = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
    );

    return asUtc - Math.floor(utcMs / 1000) * 1000;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Every UTC instant at which the clock at that place shows this wall time, earliest first.
 * Usually one; two when the clocks go back over it, none when they go forward over it.
 */
function validInstants(wallAsUtc: number, timeZone: string): number[] {
    // Offsets in force a day before and after cover every switch around the wall time.
    const offsets = [...new Set([offsetAt(wallAsUtc - DAY_MS, timeZone), offsetAt(wallAsUtc + DAY_MS, timeZone)])];

    return offsets
        .map((offset) => wallAsUtc - offset)
        .filter((instant) => offsetAt(instant, timeZone) === wallAsUtc - instant)
        .sort((a, b) => a - b);
}

function wallTimeAsUtc(isoDate: string, time: string): number {
    const [
        year,
        month,
        day,
    ] = isoDate.split('-').map(Number) as [number, number, number];
    const [hour, minute] = time.split(':').map(Number) as [number, number];

    return Date.UTC(year, month - 1, day, hour, minute);
}

/**
 * Convert a wall-clock time at a place into a UTC instant, using the tz database's historical offsets.
 * When the clock time happens twice (clocks going back), the first occurrence wins, as common chart software does;
 * when it never happens (clocks going forward), the offset in force before the switch is used.
 */
export function localTimeToUtc(isoDate: string, time: string, timeZone: string): Date {
    const wallAsUtc = wallTimeAsUtc(isoDate, time);
    const [first] = validInstants(wallAsUtc, timeZone);

    return new Date(first ?? wallAsUtc - offsetAt(wallAsUtc - DAY_MS, timeZone));
}

export type LocalTimeNote = 'AMBIGUOUS' | 'NONEXISTENT';

/** Says when a daylight-saving switch makes the entered time happen twice or not at all. */
export function describeLocalTime(isoDate: string, time: string, timeZone: string): LocalTimeNote | null {
    const count = validInstants(wallTimeAsUtc(isoDate, time), timeZone).length;

    if (count > 1) return 'AMBIGUOUS';
    if (count === 0) return 'NONEXISTENT';

    return null;
}
