import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import { buildBirthMoment } from '../bazi/birthMoment';
import {
    DEFAULT_BAZI_TIME_ZONE,
    TEN_GOD_GROUP_LABELS,
    type Branch,
} from '../../shared/constants/bazi';
import { findCity } from '../../shared/constants/cities';
import type {
    BaziRequest, BaziResponse,
} from '../../shared/schemas/api/bazi.schema';
import type { FixedResultResponse } from '../../shared/schemas/api/fixedResult.schema';
import { ValidationError } from '../../shared/types/errors';
import {
    analyzeChart,
    dominantElement,
    dominantGroup,
    missingElements,
} from '../../shared/utils/bazi/analysis';
import { calculateBoneWeight } from '../../shared/utils/bazi/bone';
import { computeFacts } from '../../shared/utils/bazi/facts';
import {
    calculateFlowYears,
    calculateLuckCycle,
    flowYearsOfStep,
} from '../../shared/utils/bazi/luck';
import { calculatePillars } from '../../shared/utils/bazi/pillars';
import { analyzeStrength } from '../../shared/utils/bazi/strength';

type BaziServiceOptions = {
    content?: FixedContentService;
    clock?: () => number;
};

/**
 * The BaZi chart for a birth moment: four pillars, day master, elements, ten gods, chart facts, strength,
 * stone weight, luck cycles and the written interpretation. A fixed calculation: nothing is stored and no
 * AI is involved (RULE-017). Every interpretation text the chart needs must be published, otherwise the whole
 * request is a 404 rather than a half-empty chart.
 */
export class BaziService extends BaseService {
    protected serviceName = 'bazi';

    private readonly content: FixedContentService;
    private readonly clock: () => number;

    constructor(options: BaziServiceOptions = {}) {
        super();
        this.content = options.content ?? new FixedContentService();
        this.clock = options.clock ?? Date.now;
    }

    async calculate(request: BaziRequest): Promise<BaziResponse> {
        const city = request.birthPlace ? findCity(request.birthPlace) : undefined;

        if (request.birthPlace && !city) {
            throw new ValidationError('birthPlace is not in the preset city list');
        }

        const timeZone = city?.timeZone ?? DEFAULT_BAZI_TIME_ZONE;
        const birthTime = request.birthTime ?? null;
        const gender = request.gender ?? null;
        const now = new Date(this.clock());

        const moment = buildBirthMoment({
            birthDate: request.birthDate,
            birthTime,
            timeZone,
        });
        const pillars = calculatePillars(moment);
        const analysis = analyzeChart(pillars);
        const facts = computeFacts(pillars, moment.instant);
        const strength = analyzeStrength(pillars);
        const bone = pillars.hour ? calculateBoneWeight(moment.birthDate, pillars.hour.branch) : null;
        const luck = gender
            ? calculateLuckCycle(pillars, moment.instant, gender, now, moment.standardOffsetMinutes)
            : null;
        const flowYears = gender ? calculateFlowYears(pillars.day.stem, now) : null;
        const currentStep = luck?.steps.find((step) => step.order === luck.currentOrder) ?? null;

        const strongElement = dominantElement(analysis.elementCounts);
        const missing = missingElements(analysis.elementCounts);
        const dominant = dominantGroup(analysis.groupCounts);
        const monthBranch: Branch = pillars.month.branch;
        const usefulSide = strength.side === 'STRONG' ? 'strong' : 'weak';

        const interpretation = await this.fetchInterpretation({
            dayMaster: `daymaster_${pillars.day.stem}`,
            strongElement: strongElement ? `element_strong_${strongElement}` : null,
            missingElements: missing.map((element) => `element_missing_${element}`),
            dominantGroup: dominant ? `group_dominant_${dominant}` : null,
            month: `month_${monthBranch}`,
            strength: `strength_${strength.level}`,
            pattern: `pattern_${strength.pattern.key}`,
            usefulGods: strength.side === 'BALANCED'
                ? null
                : `useful_${usefulSide}_${TEN_GOD_GROUP_LABELS[strength.pattern.group]}`,
            bone: bone ? bone.contentKey : null,
            currentLuck: currentStep ? `luck_${currentStep.tenGod}` : null,
        });

        return {
            timeZone,
            timeZoneAssumed: city === undefined,
            hasTime: pillars.hour !== null,
            baziYear: pillars.baziYear,
            pillars: {
                year: pillars.year,
                month: pillars.month,
                day: pillars.day,
                hour: pillars.hour,
            },
            dayMaster: analysis.dayMaster,
            chart: analysis.pillars,
            elementCounts: analysis.elementCounts,
            tenGodCounts: analysis.tenGodCounts,
            groupCounts: analysis.groupCounts,
            facts,
            strength: {
                score: strength.score,
                level: strength.level,
                side: strength.side,
                phases: strength.phases,
                pattern: strength.pattern,
                useful: strength.useful
                    ? {
                        ...strength.useful, avoid: [...strength.useful.avoid],
                    }
                    : null,
            },
            bone: bone
                ? {
                    lunarYear: bone.lunarYear,
                    lunarMonth: bone.lunarMonth,
                    lunarDay: bone.lunarDay,
                    leapMonth: bone.leapMonth,
                    totalQian: bone.totalQian,
                    liang: bone.liang,
                    qian: bone.qian,
                    label: bone.label,
                }
                : null,
            lateZi: pillars.lateZi,
            borderline: pillars.borderline,
            termDay: pillars.termDay,
            luckStatus: this.luckStatus(gender !== null, pillars.hour !== null),
            luck: luck
                ? {
                    direction: luck.direction,
                    measuredToTerm: luck.measuredToTerm,
                    startAge: luck.startAge,
                    startsAt: luck.startsAt.toISOString(),
                    steps: luck.steps.map((step) => ({
                        order: step.order,
                        pillar: step.pillar,
                        tenGod: step.tenGod,
                        startAge: step.startAge,
                        endAge: step.endAge,
                        startYear: step.startYear,
                        endYear: step.endYear,
                        startsAt: step.startsAt.toISOString(),
                    })),
                    currentOrder: luck.currentOrder,
                    stepYears: Object.fromEntries(luck.steps.map((step) => [String(step.order), flowYearsOfStep(step, pillars.day.stem)])),
                }
                : null,
            flowYears,
            interpretation,
        };
    }

    private luckStatus(hasGender: boolean, hasTime: boolean): BaziResponse['luckStatus'] {
        if (!hasGender) return 'NEEDS_GENDER';
        if (!hasTime) return 'NEEDS_TIME';

        return 'OK';
    }

    /** Fetch every text the chart needs; the first one that is not published fails the whole request with a 404. */
    private async fetchInterpretation(keys: {
        dayMaster: string;
        strongElement: string | null;
        missingElements: string[];
        dominantGroup: string | null;
        month: string;
        strength: string;
        pattern: string;
        usefulGods: string | null;
        bone: string | null;
        currentLuck: string | null;
    }): Promise<BaziResponse['interpretation']> {
        const optional = async (key: string | null): Promise<FixedResultResponse | null> => (
            key === null ? null : this.content.getPublished('BAZI', key)
        );
        const [
            dayMaster,
            strongElement,
            missingElements,
            dominantGroup,
            month,
            strength,
            pattern,
            usefulGods,
            bone,
            currentLuck,
        ] = await Promise.all([
            this.content.getPublished('BAZI', keys.dayMaster),
            optional(keys.strongElement),
            Promise.all(keys.missingElements.map((key) => this.content.getPublished('BAZI', key))),
            optional(keys.dominantGroup),
            this.content.getPublished('BAZI', keys.month),
            this.content.getPublished('BAZI', keys.strength),
            this.content.getPublished('BAZI', keys.pattern),
            optional(keys.usefulGods),
            optional(keys.bone),
            optional(keys.currentLuck),
        ]);

        return {
            dayMaster,
            strongElement,
            missingElements,
            dominantGroup,
            month,
            strength,
            pattern,
            usefulGods,
            bone,
            currentLuck,
        };
    }
}
