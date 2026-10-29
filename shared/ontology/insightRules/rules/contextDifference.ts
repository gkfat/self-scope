import type { InsightRuleInput } from '../schema';

/** The same tendency shows differently in different parts of life; the rule names the parts it is about. */
export const CONTEXT_DIFFERENCE_RULES: readonly InsightRuleInput[] = [
    {
        id: 'context-direct-work-stress',
        type: 'context-difference',
        when: {
            all: [
                {
                    end: 'C3.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['domain:work', 'domain:stress'],
        template: '你的直率在工作上可能被看成清楚有效率，在壓力大的時候，同樣的直接可能顯得比平常更尖銳。',
        hypothesis: '同樣直接的一句話，平常和忙亂時，對方的反應有沒有不同？',
    },
    {
        id: 'context-order-work-leisure',
        type: 'context-difference',
        when: {
            all: [
                {
                    end: 'B5.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['domain:work', 'domain:leisure'],
        template: '你對條理的重視在工作上很有幫助，在休閒時，同樣的習慣可能讓你放不下計畫，不容易真正放鬆。',
        hypothesis: '度假時你是照著行程走，還是留了隨興的空間？',
    },
    {
        id: 'context-sensitive-decision-stress',
        type: 'context-difference',
        when: {
            all: [
                {
                    end: 'C1.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['domain:decision', 'domain:stress'],
        template: '你的感受很細膩，這讓你做決定時多一層考量；壓力大的時候，這份敏感也可能讓你比平常更容易被情緒左右。',
        hypothesis: '心情不好的時候做的決定，事後你會不會有不同的看法？',
    },
    {
        id: 'context-explore-learning-interest',
        type: 'context-difference',
        when: {
            all: [
                {
                    end: 'A4.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['domain:learning', 'domain:interest'],
        template: '你的好奇心在學習上可能讓你吸收得快、涉獵得廣，在興趣上則容易一個接一個地嘗試，不一定每一個都走得很深。',
        hypothesis: '你學一樣新東西的方式，和你經營一個興趣的方式，有沒有不同？',
    },
    {
        id: 'context-persistence-growth-stress',
        type: 'context-difference',
        when: {
            all: [
                {
                    end: 'B4.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['domain:growth', 'domain:stress'],
        template: '你的堅持在個人成長上可能是持續前進的動力，在壓力下則可能變成不肯停下來，甚至不太願意承認自己需要休息。',
        hypothesis: '你累的時候，是比較容易繼續撐著，還是會讓自己停一下？',
    },
    {
        id: 'context-self-judgment-decision-learning',
        type: 'context-difference',
        when: {
            all: [
                {
                    end: 'A2.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['domain:decision', 'domain:learning'],
        template: '你習慣自己判斷，在做決定時很有主見；在學習新東西時，同樣的習慣可能讓你比較少請教別人，繞了一些路。',
        hypothesis: '學新東西時，你多久會想到去問有經驗的人？',
    },
];
