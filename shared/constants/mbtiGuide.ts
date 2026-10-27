import type { MbtiType } from '../schemas/common';

/** The four letter pairs a type is made of */
export const MBTI_AXES = [
    {
        key: 'EI',
        title: '能量來源',
        first: {
            letter: 'E', label: '外向', text: '從與人互動、行動中獲得能量', 
        },
        second: {
            letter: 'I', label: '內向', text: '從獨處、安靜思考中恢復能量', 
        },
    },
    {
        key: 'SN',
        title: '接收資訊',
        first: {
            letter: 'S', label: '實感', text: '相信具體的事實、經驗與細節', 
        },
        second: {
            letter: 'N', label: '直覺', text: '留意整體模式、關聯與可能性', 
        },
    },
    {
        key: 'TF',
        title: '做決定的依據',
        first: {
            letter: 'T', label: '思考', text: '以邏輯、客觀標準為先', 
        },
        second: {
            letter: 'F', label: '情感', text: '以價值觀與人的感受為先', 
        },
    },
    {
        key: 'JP',
        title: '面對生活的方式',
        first: {
            letter: 'J', label: '判斷', text: '偏好計畫、定案與有條理', 
        },
        second: {
            letter: 'P', label: '感知', text: '偏好彈性、保持選項與隨機應變', 
        },
    },
] as const;

type MbtiGroup = {
    key: string;
    /** The two middle letters that define the group */
    letters: string;
    title: string;
    description: string;
    tone: string;
    types: ReadonlyArray<{ type: MbtiType; name: string }>;
};

/** The sixteen types in four groups, by what they pay attention to and decide by */
export const MBTI_GROUPS: readonly MbtiGroup[] = [
    {
        key: 'NT',
        letters: 'NT',
        title: '分析家',
        description: '重視邏輯、策略與可能性，愛拆解問題，追求更好的做法。',
        tone: '#2f5d8a',
        types: [
            {
                type: 'INTJ', name: '建築師', 
            },
            {
                type: 'INTP', name: '邏輯學家', 
            },
            {
                type: 'ENTJ', name: '指揮官', 
            },
            {
                type: 'ENTP', name: '辯論家', 
            },
        ],
    },
    {
        key: 'NF',
        letters: 'NF',
        title: '外交家',
        description: '重視意義、價值與人，關心他人的成長與感受。',
        tone: '#2e7d5b',
        types: [
            {
                type: 'INFJ', name: '提倡者', 
            },
            {
                type: 'INFP', name: '調停者', 
            },
            {
                type: 'ENFJ', name: '主人公', 
            },
            {
                type: 'ENFP', name: '競選者', 
            },
        ],
    },
    {
        key: 'SJ',
        letters: 'SJ',
        title: '守護者',
        description: '重視責任、秩序與可靠，穩定地把事做好，照顧身邊的人。',
        tone: '#b7791f',
        types: [
            {
                type: 'ISTJ', name: '物流師', 
            },
            {
                type: 'ISFJ', name: '守衛者', 
            },
            {
                type: 'ESTJ', name: '總經理', 
            },
            {
                type: 'ESFJ', name: '執政官', 
            },
        ],
    },
    {
        key: 'SP',
        letters: 'SP',
        title: '探險家',
        description: '重視當下與實際體驗，靠動手與感受行動，彈性高、反應快。',
        tone: '#c94f4f',
        types: [
            {
                type: 'ISTP', name: '鑑賞家', 
            },
            {
                type: 'ISFP', name: '探險家', 
            },
            {
                type: 'ESTP', name: '企業家', 
            },
            {
                type: 'ESFP', name: '表演者', 
            },
        ],
    },
];
