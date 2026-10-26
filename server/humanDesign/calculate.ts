import { castCharts } from './ephemeris';
import { localTimeToUtc } from './localTime';
import { deriveChart } from '../../shared/utils/humanDesignChart';
import type { HumanDesignResult } from '../../shared/schemas/firestore/humanDesign.schema';

/** Birth date, wall-clock time and the place's IANA time zone in; a full chart out. No AI involved (RULE-013). */
export function calculateHumanDesign(isoDate: string, time: string, timeZone: string): HumanDesignResult {
    const {
        personality, design, 
    } = castCharts(localTimeToUtc(isoDate, time, timeZone));

    return deriveChart(personality, design);
}
