import type { ContextValue } from './schema';

/**
 * The context axes: when (time), toward whom (object) and in what part of life (domain) a trait end shows. They are not
 * bipolar. "Interpersonal relations" is not a domain on purpose: who the other person is belongs to the object axis, and
 * the domain only covers how one communicates and gets along.
 */
export const CONTEXT_VALUES: readonly ContextValue[] = [
    {
        id: 'time:past',
        kind: 'time',
        name: '過去',
        description: '這個傾向可能怎麼形塑你一路走來的樣子（只寫成假設，不斷言經歷）',
    },
    {
        id: 'time:present',
        kind: 'time',
        name: '現在',
        description: '這個傾向在日常裡怎麼出現',
    },
    {
        id: 'time:future',
        kind: 'time',
        name: '未來',
        description: '這個傾向之後可能帶來的方向與可以準備的事（只談傾向，不預測事件）',
    },
    {
        id: 'object:self',
        kind: 'object',
        name: '自己',
        description: '對自己的要求與看待自己的方式',
    },
    {
        id: 'object:partner',
        kind: 'object',
        name: '伴侶',
        description: '在親密關係中的表現',
    },
    {
        id: 'object:family',
        kind: 'object',
        name: '家人',
        description: '與父母、手足等家人相處時',
    },
    {
        id: 'object:friend',
        kind: 'object',
        name: '朋友',
        description: '與朋友相處時',
    },
    {
        id: 'object:colleague',
        kind: 'object',
        name: '工作夥伴',
        description: '與平輩同事、合作夥伴相處時',
    },
    {
        id: 'object:group',
        kind: 'object',
        name: '群體',
        description: '在社群、團體與多數人之中',
    },
    {
        id: 'object:superior',
        kind: 'object',
        name: '上司',
        description: '面對上司或長輩、權威時',
    },
    {
        id: 'object:subordinate',
        kind: 'object',
        name: '下屬',
        description: '帶領或指導下屬、晚輩時',
    },
    {
        id: 'object:child',
        kind: 'object',
        name: '孩子',
        description: '與孩子相處時',
    },
    {
        id: 'object:stranger',
        kind: 'object',
        name: '陌生人',
        description: '與初次見面的人、陌生人相處時',
    },
    {
        id: 'domain:interaction',
        kind: 'domain',
        name: '人際互動',
        description: '溝通、表達與相處的風格',
    },
    {
        id: 'domain:growth',
        kind: 'domain',
        name: '自我成長',
        description: '學習、反思與改變自己的方式',
    },
    {
        id: 'domain:work',
        kind: 'domain',
        name: '工作',
        description: '做事、分工與面對職場的方式',
    },
    {
        id: 'domain:leisure',
        kind: 'domain',
        name: '娛樂',
        description: '放鬆、玩樂與休閒的選擇',
    },
    {
        id: 'domain:interest',
        kind: 'domain',
        name: '興趣發展',
        description: '投入與深化興趣的方式',
    },
    {
        id: 'domain:conduct',
        kind: 'domain',
        name: '待人處事',
        description: '面對人與事的原則和態度',
    },
    {
        id: 'domain:decision',
        kind: 'domain',
        name: '決策與選擇',
        description: '做決定與取捨的方式',
    },
    {
        id: 'domain:stress',
        kind: 'domain',
        name: '情緒與壓力',
        description: '面對情緒起伏與壓力時',
    },
    {
        id: 'domain:rhythm',
        kind: 'domain',
        name: '生活節奏',
        description: '安排時間、精力與日常步調的方式',
    },
    {
        id: 'domain:learning',
        kind: 'domain',
        name: '學習',
        description: '吸收新知與練習技能的方式',
    },
];
