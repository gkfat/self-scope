import type { InsightRuleInput } from '../schema';

/**
 * A blind spot here means a gap in what the sources look at, not a weakness of the member: when one end shows up and
 * the end opposite to it is not mentioned by any source, the report says that nothing was seen, not that it is absent.
 */
export const BLINDSPOT_RULES: readonly InsightRuleInput[] = [
    {
        id: 'blindspot-persistence-without-pivot',
        type: 'blindspot',
        when: {
            all: [{ end: 'B4.A' }], absent: ['B4.B'],
        },
        requiresIndependentSources: false,
        template: '你選的系統都談到你的堅持，沒有一個談到見機轉向。這不代表你不會轉彎，只是這份報告沒看到這一面；堅持過頭時，可能值得留意是否需要調整方向。',
        hypothesis: '你有沒有一件做了很久、其實可以換個方式的事？',
    },
    {
        id: 'blindspot-order-without-freedom',
        type: 'blindspot',
        when: {
            all: [{ end: 'B5.A' }], absent: ['B5.B'],
        },
        requiresIndependentSources: false,
        template: '你選的系統都談到你重視條理，沒有一個談到自由隨性。這不代表你不能放鬆，只是這份報告沒看到這一面；你可能需要留一點不被安排的空間。',
        hypothesis: '你的行程裡有沒有一段完全不安排的時間？',
    },
    {
        id: 'blindspot-direct-without-tactful',
        type: 'blindspot',
        when: {
            all: [{ end: 'C3.A' }], absent: ['C3.B'],
        },
        requiresIndependentSources: false,
        template: '你選的系統都談到你的直率，沒有一個談到委婉圓融。這不代表你不會顧及對方，只是這份報告沒看到這一面；話說得直接時，可能值得想一想對方怎麼接收。',
        hypothesis: '最近有沒有哪句直接的話，對方的反應和你預期的不太一樣？',
    },
    {
        id: 'blindspot-expressive-without-reserved',
        type: 'blindspot',
        when: {
            all: [{ end: 'C2.A' }], absent: ['C2.B'],
        },
        requiresIndependentSources: false,
        template: '你選的系統都談到你外放表達，沒有一個談到內斂含蓄。這不代表你沒有安靜的時候，只是這份報告沒看到這一面；你可能需要留意自己的沉澱與傾聽。',
        hypothesis: '你最近有沒有一次是聽別人說完、自己沒有急著回應的？',
    },
    {
        id: 'blindspot-explore-without-focus',
        type: 'blindspot',
        when: {
            all: [{ end: 'A4.A' }], absent: ['A4.B'],
        },
        requiresIndependentSources: false,
        template: '你選的系統都談到你廣泛探索，沒有一個談到專注深耕。這不代表你無法深入，只是這份報告沒看到這一面；興趣多的時候，可能需要挑一兩件深入下去。',
        hypothesis: '你有沒有哪一件事，是你願意投入很長一段時間鑽研的？',
    },
    {
        id: 'blindspot-stable-without-change',
        type: 'blindspot',
        when: {
            all: [{ end: 'E1.A' }], absent: ['E1.B'],
        },
        requiresIndependentSources: false,
        template: '你選的系統都談到你追求穩定，沒有一個談到嚮往變化。這不代表你不想嘗試新事物，只是這份報告沒看到這一面；安穩久了，可能值得留意是否有想試的新方向。',
        hypothesis: '有沒有一件你一直想試、卻因為怕不穩定而擱著的事？',
    },
];
