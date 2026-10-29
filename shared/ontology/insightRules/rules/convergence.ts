import type { InsightRuleInput } from '../schema';

/** One end that sources of different traditions point at: said by more than one voice, so it is worth a closer look. */
export const CONVERGENCE_RULES: readonly InsightRuleInput[] = [
    {
        id: 'convergence-long-term-planning',
        type: 'convergence',
        when: {
            all: [
                {
                    end: 'B1.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        template: '不同傳統不約而同地描述你習慣為之後做打算：你可能傾向先想好方向與步驟，再動手。這個傾向在需要持續經營的事上特別有用。',
        hypothesis: '最近一件你提前安排的事，有沒有因此少了不少臨時的慌亂？',
    },
    {
        id: 'convergence-order',
        type: 'convergence',
        when: {
            all: [
                {
                    end: 'B5.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        template: '多個來源都提到你重視條理與秩序，你可能傾向把東西、時間與流程排得清楚，也容易在雜亂的環境裡感到不自在。',
        hypothesis: '環境或行程一亂，你是不是會先想把它整理好才能靜下心？',
    },
    {
        id: 'convergence-giving',
        type: 'convergence',
        when: {
            all: [
                {
                    end: 'D2.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        template: '不同來源都把你描述成會照顧身邊人的人，你可能傾向先看見別人的需要，也容易在不知不覺中把自己的需要往後放。',
        hypothesis: '最近有沒有哪一次，你為了照顧別人而延後了自己想做的事？',
    },
    {
        id: 'convergence-persistence',
        type: 'convergence',
        when: {
            all: [
                {
                    end: 'B4.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        template: '多個傳統都指向你的堅持：你可能傾向把決定的事做到底，遇到阻礙時也不輕易放手，這份韌性在長期的目標上很可貴。',
        hypothesis: '你有沒有一件事，即使過程不順，仍然默默做了很久？',
    },
    {
        id: 'convergence-broad-exploring',
        type: 'convergence',
        when: {
            all: [
                {
                    end: 'A4.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        template: '不同來源都說你對很多事情感到好奇，你可能傾向多看、多嘗試，也容易同時擁有好幾個興趣。',
        hypothesis: '你手邊現在是不是同時有好幾件想了解或想試的事？',
    },
    {
        id: 'convergence-self-judgment',
        type: 'convergence',
        when: {
            all: [
                {
                    end: 'A2.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        template: '多個傳統都描述你習慣自己下判斷：你可能傾向先用自己的標準衡量，再參考別人的意見，而不是照著別人的說法走。',
        hypothesis: '遇到要決定的事，你是不是通常先有了自己的答案，才去問別人？',
    },
    {
        id: 'convergence-sensitive',
        type: 'convergence',
        when: {
            all: [
                {
                    end: 'C1.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        template: '不同來源都提到你的感受很細膩：你可能傾向很快察覺氣氛與情緒的變化，這讓你體貼，也可能讓你容易被周遭的情緒牽動。',
        hypothesis: '進到一個陌生的場合時，你是不是很快就感覺得出氣氛是輕鬆還是緊繃？',
    },
];
