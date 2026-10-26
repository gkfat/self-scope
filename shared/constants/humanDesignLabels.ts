import type {
    HumanDesignBody, HumanDesignResult, IncarnationCross,
} from '../schemas/firestore/humanDesign.schema';
import type { Center } from './humanDesign';

/** Traditional Chinese names shown to members and used on share cards. */
export const HUMAN_DESIGN_TYPE_LABELS: Record<HumanDesignResult['type'], string> = {
    MANIFESTOR: '顯示者',
    GENERATOR: '生產者',
    MANIFESTING_GENERATOR: '顯示生產者',
    PROJECTOR: '投射者',
    REFLECTOR: '反映者',
};

export const HUMAN_DESIGN_STRATEGY_LABELS: Record<HumanDesignResult['strategy'], string> = {
    INFORM: '行動前先告知',
    RESPOND: '等待回應',
    WAIT_FOR_INVITATION: '等待邀請',
    WAIT_A_LUNAR_CYCLE: '等待一個月亮週期',
};

export const HUMAN_DESIGN_AUTHORITY_LABELS: Record<HumanDesignResult['authority'], string> = {
    EMOTIONAL: '情緒權威',
    SACRAL: '薦骨權威',
    SPLENIC: '直覺（脾）權威',
    EGO: '意志力（心）權威',
    SELF_PROJECTED: '自我投射權威',
    MENTAL: '外在權威（以討論與環境輔助決定）',
    LUNAR: '月亮週期權威',
};

export const HUMAN_DESIGN_DEFINITION_LABELS: Record<HumanDesignResult['definition'], string> = {
    NONE: '無定義',
    SINGLE: '單一定義',
    SPLIT: '二分定義',
    TRIPLE_SPLIT: '三分定義',
    QUADRUPLE_SPLIT: '四分定義',
};

export const HUMAN_DESIGN_CROSS_ANGLE_LABELS: Record<IncarnationCross['angle'], string> = {
    RIGHT_ANGLE: '右角度',
    JUXTAPOSITION: '並置',
    LEFT_ANGLE: '左角度',
};

export const HUMAN_DESIGN_CENTER_LABELS: Record<Center, string> = {
    HEAD: '頭腦中心',
    AJNA: '邏輯中心',
    THROAT: '喉嚨中心',
    G: 'G 中心',
    HEART: '意志力中心',
    SACRAL: '薦骨中心',
    SPLEEN: '脾中心',
    SOLAR_PLEXUS: '情緒中心',
    ROOT: '根部中心',
};

/** The 13 celestial bodies that each land on a gate and line. */
export const HUMAN_DESIGN_BODY_LABELS: Record<HumanDesignBody, string> = {
    SUN: '太陽',
    EARTH: '地球',
    MOON: '月亮',
    NORTH_NODE: '北交點',
    SOUTH_NODE: '南交點',
    MERCURY: '水星',
    VENUS: '金星',
    MARS: '火星',
    JUPITER: '木星',
    SATURN: '土星',
    URANUS: '天王星',
    NEPTUNE: '海王星',
    PLUTO: '冥王星',
};
