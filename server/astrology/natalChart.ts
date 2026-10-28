import * as Astronomy from 'astronomy-engine';
import { planetLongitude } from '../humanDesign/ephemeris';
import {
    NATAL_BODIES, type NatalBody,
} from '../../shared/constants/natal';
import { ZODIACS } from '../../shared/schemas/common';
import type { Zodiac } from '../../shared/schemas/common';

export type Placement = {
    sign: Zodiac;
    /** Whole degrees into the sign, 0 to 29 */
    degree: number;
};

export type NatalChart = {
    ascendant: Placement;
    bodies: Record<NatalBody, Placement>;
};

const normalizeDegrees = (degrees: number): number => ((degrees % 360) + 360) % 360;
const toRadians = (degrees: number): number => degrees * Math.PI / 180;

/** Tropical zodiac: 30° per sign, starting with Aries at 0°. */
export function placementFromLongitude(longitude: number): Placement {
    const normalized = normalizeDegrees(longitude);
    const index = Math.min(11, Math.floor(normalized / 30));

    return {
        sign: ZODIACS[index] as Zodiac,
        degree: Math.min(29, Math.floor(normalized - index * 30)),
    };
}

const BODY_OF: Record<Exclude<NatalBody, 'SUN' | 'MOON'>, Astronomy.Body> = {
    MERCURY: Astronomy.Body.Mercury,
    VENUS: Astronomy.Body.Venus,
    MARS: Astronomy.Body.Mars,
    JUPITER: Astronomy.Body.Jupiter,
    SATURN: Astronomy.Body.Saturn,
    URANUS: Astronomy.Body.Uranus,
    NEPTUNE: Astronomy.Body.Neptune,
    PLUTO: Astronomy.Body.Pluto,
};

/** Ecliptic longitude in degrees of a body at a moment. */
export function bodyLongitude(body: NatalBody, time: Astronomy.AstroTime): number {
    if (body === 'SUN') return Astronomy.SunPosition(time).elon;
    if (body === 'MOON') return Astronomy.EclipticGeoMoon(time).lon;

    return planetLongitude(BODY_OF[body], time);
}

/** Ecliptic longitude of the point rising on the eastern horizon (the ascendant). */
export function ascendantLongitude(time: Astronomy.AstroTime, latitude: number, longitude: number): number {
    // Local sidereal time as an angle (the right ascension of the meridian)
    const theta = toRadians(normalizeDegrees(Astronomy.SiderealTime(time) * 15 + longitude));
    // Mean obliquity of the ecliptic, with T in Julian centuries from J2000 (accurate to well under an arcminute)
    const obliquity = toRadians(23.439291 - 0.0130042 * (time.tt / 36525));
    const phi = toRadians(latitude);

    const east = Math.atan2(
        Math.cos(theta),
        -(Math.sin(theta) * Math.cos(obliquity) + Math.tan(phi) * Math.sin(obliquity)),
    );

    return normalizeDegrees(east * 180 / Math.PI);
}

/** Signs of the seven classical bodies and the ascendant for a moment and a place. */
export function computeNatalChart(birthUtc: Date, latitude: number, longitude: number): NatalChart {
    const time = Astronomy.MakeTime(birthUtc);

    return {
        ascendant: placementFromLongitude(ascendantLongitude(time, latitude, longitude)),
        bodies: Object.fromEntries(
            NATAL_BODIES.map((body) => [body, placementFromLongitude(bodyLongitude(body, time))]),
        ) as Record<NatalBody, Placement>,
    };
}

/** The exact ecliptic longitudes behind a natal chart, for work that needs more than whole degrees (aspects). */
export type NatalLongitudes = {
    ascendant: number;
    bodies: Record<NatalBody, number>;
};

/** Exact longitudes of the ten bodies and the ascendant. `computeNatalChart` is these, cut into signs and degrees. */
export function computeNatalLongitudes(birthUtc: Date, latitude: number, longitude: number): NatalLongitudes {
    const time = Astronomy.MakeTime(birthUtc);

    return {
        ascendant: normalizeDegrees(ascendantLongitude(time, latitude, longitude)),
        bodies: Object.fromEntries(
            NATAL_BODIES.map((body) => [body, normalizeDegrees(bodyLongitude(body, time))]),
        ) as Record<NatalBody, number>,
    };
}
