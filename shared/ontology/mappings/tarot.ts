import {
    TAROT_CARD_COUNT, TAROT_ORIENTATIONS,
} from '../../constants/tarot';
import type { MappingEntry } from '../schema';
import { stateRule } from './stateRule';

/** Every card the day can bring, upright and reversed: "tarot:<card>:<orientation>". */
export const TAROT_TERMS: readonly string[] = Array.from({ length: TAROT_CARD_COUNT }, (_, card) => TAROT_ORIENTATIONS.map((orientation) => `tarot:${card}:${orientation}`)).flat();

export const tarotTermsOf = (card: number, orientation: string): string[] => [`tarot:${card}:${orientation}`];

const rule = stateRule('TAROT');

/**
 * Where today leans, by the keywords of the reviewed card readings. A reversed card points at the end being overdone or
 * at the end it moves toward, as its reading says. Cards whose keywords name no axis end stay unmapped (reversed Fool,
 * reversed Magician, reversed Chariot, Devil, reversed Temperance, Judgement and the others).
 */
export const TAROT_MAPPINGS: readonly MappingEntry[] = [
    ...rule('tarot:0:upright', 'B1.B', 'A4.A'), // a light, open day; curiosity, no need to think it all through
    ...rule('tarot:1:upright', 'B2.A'), // the conditions to turn an idea into action are forming
    ...rule('tarot:2:upright', 'A1.B', 'D4.B'), // quiet, inward; intuition is clearer
    ...rule('tarot:2:reversed', 'A2.B', 'C2.B'), // led by outside voices; keeps words to oneself
    ...rule('tarot:3:upright', 'D2.A'), // warm, caring for oneself and others
    ...rule('tarot:3:reversed', 'D2.A'), // giving too much
    ...rule('tarot:4:upright', 'B5.A', 'E6.A'), // order, rules, responsibility
    ...rule('tarot:4:reversed', 'B5.A'), // rigid
    ...rule('tarot:5:upright', 'A3.B', 'A2.B'), // proven methods, asks those with experience
    ...rule('tarot:5:reversed', 'A3.A', 'A2.A'), // wants to break the routine, one's own way
    ...rule('tarot:6:upright', 'D1.A'), // cares about the relationship and shared values
    ...rule('tarot:6:reversed', 'B3.B'), // hesitates over a choice
    ...rule('tarot:7:upright', 'B4.A'), // resolve, steady advance
    ...rule('tarot:8:upright', 'B4.A'), // patience and a firm, gentle way
    ...rule('tarot:8:reversed', 'C1.A'), // doubt of oneself, feelings up and down
    ...rule('tarot:9:upright', 'D4.B'), // wants to be alone and think
    ...rule('tarot:9:reversed', 'D4.B'), // too isolated
    ...rule('tarot:10:upright', 'B4.B', 'E1.B'), // flow and change; adjusts with it
    ...rule('tarot:10:reversed', 'E1.A'), // resists change
    ...rule('tarot:11:upright', 'D1.B', 'E6.A'), // fair, objective, answers for one's choices
    ...rule('tarot:11:reversed', 'E6.B'), // avoids responsibility
    ...rule('tarot:12:upright', 'B3.B'), // slows down, waits
    ...rule('tarot:12:reversed', 'B4.A'), // will not let go
    ...rule('tarot:13:upright', 'E1.B'), // an ending, a change
    ...rule('tarot:13:reversed', 'E1.A', 'E5.A'), // resists change, clings to the past
    ...rule('tarot:14:upright', 'B3.B'), // slowly, with measure
    ...rule('tarot:16:upright', 'E1.B'), // sudden change, rebuilding
    ...rule('tarot:16:reversed', 'C4.B'), // tense for fear of change
    ...rule('tarot:17:upright', 'C4.A'), // hope and calm
    ...rule('tarot:17:reversed', 'C4.B'), // loss of confidence about the future
    ...rule('tarot:18:upright', 'C1.A'), // sensitive, fine feeling
    ...rule('tarot:18:reversed', 'C4.B'), // anxiety
    ...rule('tarot:19:upright', 'C4.A', 'C3.A', 'C2.A'), // lively, joyful, frank
    ...rule('tarot:19:reversed', 'C2.B'), // holds back
    ...rule('tarot:21:upright', 'B6.A'), // completion
];
