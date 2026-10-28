import {
    HOROSCOPE_BODIES, HOUSE_COUNT,
} from '../../constants/horoscope';
import type { MappingEntry } from '../schema';
import { stateRule } from './stateRule';

/** A body in a house of the sign horoscope: "horoscope:<BODY>:<house>". */
export const HOROSCOPE_TERMS: readonly string[] = HOROSCOPE_BODIES.flatMap((body) => Array.from({ length: HOUSE_COUNT }, (_, index) => `horoscope:${body}:${index + 1}`));

export const horoscopeTermsOf = (body: string, house: number): string[] => [`horoscope:${body}:${house}`];

const rule = stateRule('HOROSCOPE');

/**
 * Where the day (or the stretch of days, for the Sun) leans, by the keywords of the reviewed readings of each body in
 * each house. Entries left out name no axis end.
 */
export const HOROSCOPE_MAPPINGS: readonly MappingEntry[] = [
    // Moon: today's mood and rhythm
    ...rule('horoscope:MOON:1', 'B1.B', 'A1.B'), // acts on the feeling of the moment
    ...rule('horoscope:MOON:2', 'E1.A'), // security from what one has
    ...rule('horoscope:MOON:3', 'C2.A', 'A4.A'), // wants to talk, curious
    ...rule('horoscope:MOON:4', 'E3.B'), // wants home, belonging
    ...rule('horoscope:MOON:5', 'C2.A'), // wants to express and be seen
    ...rule('horoscope:MOON:6', 'B5.A'), // settles by tidying and doing
    ...rule('horoscope:MOON:7', 'D1.A', 'D3.A'), // wants to be understood, in step with others
    ...rule('horoscope:MOON:8', 'D1.A'), // deeper feeling, trust and closeness
    ...rule('horoscope:MOON:9', 'A4.A'), // wants to go out and see further
    ...rule('horoscope:MOON:10', 'B6.A', 'E6.A'), // wants results, responsibility
    ...rule('horoscope:MOON:11', 'D3.A', 'E3.B'), // wants like-minded company
    ...rule('horoscope:MOON:12', 'D4.B'), // needs quiet and time alone

    // Sun: the theme of this stretch
    ...rule('horoscope:SUN:1', 'B2.A'), // starts something new
    ...rule('horoscope:SUN:2', 'E1.A'), // lays a steady base
    ...rule('horoscope:SUN:3', 'A4.A'), // learns and exchanges
    ...rule('horoscope:SUN:4', 'E3.B'), // roots, family
    ...rule('horoscope:SUN:5', 'C2.A'), // creates and shows
    ...rule('horoscope:SUN:6', 'B5.A'), // sets the day-to-day in order
    ...rule('horoscope:SUN:7', 'D3.A'), // sees oneself through others, cooperation
    ...rule('horoscope:SUN:9', 'A4.A', 'E2.A'), // wants to learn, go far, ask big questions
    ...rule('horoscope:SUN:10', 'B6.A', 'E6.A'), // goals, career, others' expectations
    ...rule('horoscope:SUN:11', 'D3.A'), // works with like-minded partners
    ...rule('horoscope:SUN:12', 'D4.B'), // reflects in quiet

    // Mercury: how thinking and talking go
    ...rule('horoscope:MERCURY:1', 'C3.A'), // direct in thought and speech
    ...rule('horoscope:MERCURY:2', 'E2.B', 'A1.A'), // practical, works things out
    ...rule('horoscope:MERCURY:3', 'A4.A', 'C2.A'), // quick, gathers information, talks
    ...rule('horoscope:MERCURY:4', 'D4.B'), // goes deep and quiet inside
    ...rule('horoscope:MERCURY:5', 'A3.A', 'C2.A'), // creative, playful in expression
    ...rule('horoscope:MERCURY:6', 'A5.A', 'B5.A'), // fine, practical, orderly
    ...rule('horoscope:MERCURY:7', 'D3.A', 'A2.B'), // thoughts take shape in conversation
    ...rule('horoscope:MERCURY:8', 'A4.B', 'C3.A'), // digs deep, speaks frankly
    ...rule('horoscope:MERCURY:9', 'A5.B', 'A4.A'), // looks far, interested in new views
    ...rule('horoscope:MERCURY:10', 'B5.A', 'D5.A'), // goal-centred, orderly, persuasive
    ...rule('horoscope:MERCURY:11', 'A3.A', 'D3.A'), // ideas grow among partners
    ...rule('horoscope:MERCURY:12', 'D4.B'), // inward, quiet thinking

    // Venus: feeling and getting along
    ...rule('horoscope:VENUS:1', 'C3.A'), // meets people as the person one is
    ...rule('horoscope:VENUS:2', 'E5.A'), // values someone dependable and steady
    ...rule('horoscope:VENUS:3', 'C2.A'), // closeness through chat and small exchanges
    ...rule('horoscope:VENUS:4', 'E3.B', 'D2.A'), // family and warmth
    ...rule('horoscope:VENUS:6', 'D2.A', 'A5.A'), // care shown by practical help and detail
    ...rule('horoscope:VENUS:7', 'D3.A'), // balance and reciprocity
    ...rule('horoscope:VENUS:8', 'D1.A'), // deep, focused, trust and closeness
    ...rule('horoscope:VENUS:9', 'D6.A'), // drawn to people of other backgrounds
    ...rule('horoscope:VENUS:10', 'E5.A'), // values lasting, dependable ties
    ...rule('horoscope:VENUS:11', 'D3.A'), // at ease among friends, equal footing
    ...rule('horoscope:VENUS:12', 'C2.B', 'D4.B'), // quiet and reserved

    // Mars: action and energy
    ...rule('horoscope:MARS:1', 'B2.A', 'B3.A'), // acts at once
    ...rule('horoscope:MARS:2', 'B4.A'), // works steadily toward results
    ...rule('horoscope:MARS:5', 'D3.B'), // passion and competition
    ...rule('horoscope:MARS:6', 'B6.A', 'B5.A'), // efficiency, finishes the list
    ...rule('horoscope:MARS:8', 'B4.A', 'A4.B'), // deep, focused, persistent
    ...rule('horoscope:MARS:9', 'B2.A', 'A4.A'), // goes out to take on something new
    ...rule('horoscope:MARS:10', 'B6.A', 'E4.A'), // ambitious, goal-driven
    ...rule('horoscope:MARS:11', 'D3.A', 'E2.A'), // acts with partners for a shared goal
];
