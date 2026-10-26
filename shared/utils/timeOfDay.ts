export type DayPeriod = 'AM' | 'PM';

export type TimeParts = {
    period: DayPeriod;
    /** 1 to 12 */
    hour: number;
    /** 0 to 59 */
    minute: number;
};

const pad = (value: number): string => String(value).padStart(2, '0');

/** 12-hour clock parts to "HH:mm" (24h): 12 AM is 00:xx and 12 PM is 12:xx. */
export function toTimeOfDay(parts: TimeParts): string {
    const hour24 = (parts.hour % 12) + (parts.period === 'PM' ? 12 : 0);

    return `${pad(hour24)}:${pad(parts.minute)}`;
}

/** "HH:mm" (24h) to 12-hour clock parts; null when the text is not a valid time. */
export function fromTimeOfDay(value: string): TimeParts | null {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

    if (!match) return null;

    const hour24 = Number(match[1]);

    return {
        period: hour24 >= 12 ? 'PM' : 'AM',
        hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
        minute: Number(match[2]),
    };
}
