import * as Astronomy from 'astronomy-engine';
import { activationFromLongitude } from '../../shared/utils/humanDesignChart';
import type {
    HumanDesignActivation, HumanDesignBody,
} from '../../shared/schemas/firestore/humanDesign.schema';

/** The Design chart is cast for the moment the Sun was this many degrees earlier on the ecliptic. */
export const DESIGN_SOLAR_ARC_DEGREES = 88;

/** Safe window to find that moment: 88° of solar arc is about 88–92 days. */
const DESIGN_SEARCH_WINDOW_DAYS = 120;

const normalizeDegrees = (degrees: number): number => ((degrees % 360) + 360) % 360;

const PLANETS: ReadonlyArray<readonly [HumanDesignBody, Astronomy.Body]> = [
    ['MERCURY', Astronomy.Body.Mercury],
    ['VENUS', Astronomy.Body.Venus],
    ['MARS', Astronomy.Body.Mars],
    ['JUPITER', Astronomy.Body.Jupiter],
    ['SATURN', Astronomy.Body.Saturn],
    ['URANUS', Astronomy.Body.Uranus],
    ['NEPTUNE', Astronomy.Body.Neptune],
    ['PLUTO', Astronomy.Body.Pluto],
];

/** Geocentric apparent longitude of a planet in the true ecliptic of date. */
export function planetLongitude(body: Astronomy.Body, time: Astronomy.AstroTime): number {
    const equatorial = Astronomy.GeoVector(body, time, true);
    const ecliptic = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(time), equatorial);

    return normalizeDegrees(Math.atan2(ecliptic.y, ecliptic.x) * 180 / Math.PI);
}

/**
 * True (osculating) lunar node: where the plane of the Moon's instantaneous orbit crosses the ecliptic,
 * taken from the Moon's position and velocity. Astronomy Engine has no node longitude of its own.
 */
function trueNorthNodeLongitude(time: Astronomy.AstroTime): number {
    const state = Astronomy.GeoMoonState(time);
    const rotation = Astronomy.Rotation_EQJ_ECT(time);
    const position = Astronomy.RotateVector(rotation, new Astronomy.Vector(state.x, state.y, state.z, time));
    const velocity = Astronomy.RotateVector(rotation, new Astronomy.Vector(state.vx, state.vy, state.vz, time));

    // Orbit normal = position × velocity; the ascending node lies at atan2(hx, -hy).
    const normalX = position.y * velocity.z - position.z * velocity.y;
    const normalY = position.z * velocity.x - position.x * velocity.z;

    return normalizeDegrees(Math.atan2(normalX, -normalY) * 180 / Math.PI);
}

/** The 13 activations (Sun, Earth, Moon, both nodes and eight planets) for one moment. */
export function activationsAt(time: Astronomy.AstroTime): HumanDesignActivation[] {
    const sun = Astronomy.SunPosition(time).elon;
    const moon = Astronomy.EclipticGeoMoon(time).lon;
    const northNode = trueNorthNodeLongitude(time);

    return [
        activationFromLongitude('SUN', sun),
        activationFromLongitude('EARTH', sun + 180),
        activationFromLongitude('MOON', moon),
        activationFromLongitude('NORTH_NODE', northNode),
        activationFromLongitude('SOUTH_NODE', northNode + 180),
        ...PLANETS.map(([name, body]) => activationFromLongitude(name, planetLongitude(body, time))),
    ];
}

/** The moment 88° of solar arc before birth. */
export function designTime(birth: Astronomy.AstroTime): Astronomy.AstroTime {
    const target = normalizeDegrees(Astronomy.SunPosition(birth).elon - DESIGN_SOLAR_ARC_DEGREES);
    const found = Astronomy.SearchSunLongitude(target, birth.AddDays(-DESIGN_SEARCH_WINDOW_DAYS), DESIGN_SEARCH_WINDOW_DAYS);

    if (!found) throw new Error('Could not find the Design moment');

    return found;
}

export function castCharts(birthUtc: Date): { personality: HumanDesignActivation[]; design: HumanDesignActivation[] } {
    const birth = Astronomy.MakeTime(birthUtc);

    return {
        personality: activationsAt(birth),
        design: activationsAt(designTime(birth)),
    };
}
