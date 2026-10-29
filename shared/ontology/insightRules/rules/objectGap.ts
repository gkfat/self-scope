import type { InsightRuleInput } from '../schema';

/** The same tendency toward different people: where it is easy and where it may be harder. */
export const OBJECT_GAP_RULES: readonly InsightRuleInput[] = [
    {
        id: 'object-giving-self-family',
        type: 'object-gap',
        when: {
            all: [
                {
                    end: 'D2.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['object:self', 'object:family'],
        template: '你對家人可能很願意付出，對自己卻不一定同樣體貼；給別人的關心和給自己的關心之間，也許有一段落差。',
        hypothesis: '你對家人的體貼，有多少也給了自己？',
    },
    {
        id: 'object-direct-superior-friend',
        type: 'object-gap',
        when: {
            all: [
                {
                    end: 'C3.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['object:superior', 'object:friend'],
        template: '你的直率對朋友可能被當成真誠，對上司則可能需要多一點拿捏；同樣的話，對不同的人分量不同。',
        hypothesis: '你對朋友說得出口的話，對上司也說得出口嗎？',
    },
    {
        id: 'object-lead-colleague-subordinate',
        type: 'object-gap',
        when: {
            all: [
                {
                    end: 'D5.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['object:colleague', 'object:subordinate'],
        template: '你習慣站在前面帶方向，對同事可能是主動協調，對部屬則可能被看成要求；身分不同，同樣的主導感受不一樣。',
        hypothesis: '你的主導，對平輩和對下屬的感覺是不是不太一樣？',
    },
    {
        id: 'object-reserved-stranger-friend',
        type: 'object-gap',
        when: {
            all: [
                {
                    end: 'C2.B', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['object:stranger', 'object:friend'],
        template: '你的內斂在陌生人面前可能顯得安靜、需要時間暖身，在熟識的朋友面前則可能放鬆許多；別人眼中的你和熟人眼中的你可能不太一樣。',
        hypothesis: '朋友眼中的你，和第一次見面的人眼中的你，差別大嗎？',
    },
    {
        id: 'object-harmony-group-partner',
        type: 'object-gap',
        when: {
            all: [
                {
                    end: 'D3.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['object:group', 'object:partner'],
        template: '你重視合作與和諧，在團體裡可能習慣配合大家；在最親近的伴侶面前，這份遷就未必每次都適合，偶爾說出自己的想法也很重要。',
        hypothesis: '在團體裡你會配合的事，在伴侶面前你也會一樣配合嗎？',
    },
    {
        id: 'object-standards-child-colleague',
        type: 'object-gap',
        when: {
            all: [
                {
                    end: 'D6.B', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['object:child', 'object:colleague'],
        template: '你重視自己的標準，對同事可能是專業的要求，對孩子或晚輩則可能需要換成更有耐心的方式去說明。',
        hypothesis: '你對同事的要求，和對晚輩的要求，是不是用同一套標準？',
    },
];
