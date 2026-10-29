import type { InsightRuleInput } from '../schema';

/** Ends of two different axes that meet in one person; what comes of the pairing is worth saying, tentatively. */
export const INTERACTION_RULES: readonly InsightRuleInput[] = [
    {
        id: 'interaction-adventure-quick',
        type: 'interaction',
        when: { all: [{ end: 'B2.A' }, { end: 'B3.A' }] },
        requiresIndependentSources: true,
        template: '開創冒險加上快速決斷：你可能傾向很快就把想法付諸行動，起步快是優勢，也容易在還沒看清風險時就已經出發。',
        hypothesis: '你最近一次很快就決定去做的事，事後有沒有發現漏想了什麼？',
    },
    {
        id: 'interaction-logic-detached-relations',
        type: 'interaction',
        when: { all: [{ end: 'A1.A' }, { end: 'D1.B' }] },
        requiresIndependentSources: true,
        template: '分析邏輯加上理性客觀的相處方式：你可能傾向用講道理來處理問題，對方有時會覺得你把情緒放在後面。',
        hypothesis: '對方跟你訴說煩惱時，你比較常先給分析，還是先陪著聽？',
    },
    {
        id: 'interaction-sensitive-reserved',
        type: 'interaction',
        when: { all: [{ end: 'C1.A' }, { end: 'C2.B' }] },
        requiresIndependentSources: true,
        template: '情緒細膩易感加上內斂含蓄：你可能心裡感受很多，卻不一定說出口，身邊的人不見得知道你在意什麼。',
        hypothesis: '上一次你心裡有感受卻沒說出來，後來是怎麼消化的？',
    },
    {
        id: 'interaction-giving-independent',
        type: 'interaction',
        when: { all: [{ end: 'D2.A' }, { end: 'E3.A' }] },
        requiresIndependentSources: true,
        template: '付出照顧加上自主獨立：你可能傾向照顧別人，卻不太習慣開口請別人幫忙，也容易自己默默扛著。',
        hypothesis: '你上一次主動請別人幫忙是什麼時候？',
    },
    {
        id: 'interaction-lead-standards',
        type: 'interaction',
        when: { all: [{ end: 'D5.A' }, { end: 'D6.B' }] },
        requiresIndependentSources: true,
        template: '領導主導加上堅守標準：你可能傾向帶著大家朝高標準前進，團隊容易有方向，也可能讓身邊的人覺得壓力不小。',
        hypothesis: '你對團隊的標準，別人是否都清楚？有沒有人曾說過壓力很大？',
    },
    {
        id: 'interaction-growth-persistence',
        type: 'interaction',
        when: { all: [{ end: 'E4.A' }, { end: 'B4.A' }] },
        requiresIndependentSources: true,
        template: '成長進取加上堅持不懈：你可能傾向替自己訂下長期的進步目標並持續努力，也容易對停下來休息感到不安。',
        hypothesis: '你上次完全不為任何目標、單純休息，是什麼時候？',
    },
    {
        id: 'interaction-optimistic-adventure',
        type: 'interaction',
        when: { all: [{ end: 'C4.A' }, { end: 'B2.A' }] },
        requiresIndependentSources: true,
        template: '樂觀正向加上開創冒險：你可能傾向相信事情會有出路，因此敢開始新的嘗試，也容易低估過程中會遇到的阻礙。',
        hypothesis: '最近一次開始新嘗試前，你有沒有認真想過最糟的情況？',
    },
    {
        id: 'interaction-explore-persistence',
        type: 'interaction',
        when: { all: [{ end: 'A4.A' }, { end: 'B4.A' }] },
        requiresIndependentSources: true,
        template: '廣泛探索加上堅持不懈：你可能同時對很多事有興趣，又不輕易放棄已經開始的事，結果是手上的事情可能越來越多。',
        hypothesis: '你現在手上同時進行的事有幾件？哪一件其實可以先放下？',
    },
];
