import type { InsightRuleInput } from '../schema';

/**
 * A tendency looked at along time. The past is only ever a guess to check against one's own life, and the future only a
 * tendency or something to prepare, never a prediction.
 */
export const TIME_EXTENSION_RULES: readonly InsightRuleInput[] = [
    {
        id: 'time-planning-future',
        type: 'time-extension',
        when: {
            all: [
                {
                    end: 'B1.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['time:future'],
        template: '你習慣為之後做打算，之後的日子裡可以傾向把大目標拆成幾個階段；若計畫被打亂，若能預留一些彈性，會比較不費力。',
        hypothesis: '你的下一個階段目標是什麼？預留彈性了嗎？',
    },
    {
        id: 'time-change-future',
        type: 'time-extension',
        when: {
            all: [
                {
                    end: 'E1.B', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['time:future'],
        template: '你嚮往變化，之後可能傾向不斷尋找新的環境與嘗試；也可以替自己留一個穩定的根據地，讓變化不必每次都從零開始。',
        hypothesis: '如果要換一個新方向，你有什麼是想先留下來的？',
    },
    {
        id: 'time-growth-future-present',
        type: 'time-extension',
        when: {
            all: [
                {
                    end: 'E4.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['time:present', 'time:future'],
        template: '你在意成長，現在的日常裡可能傾向替自己找下一個可以進步的地方；之後也可以定期回頭看看已經走了多遠，不只盯著還沒到的地方。',
        hypothesis: '最近你有沒有停下來，看一看自己已經進步了什麼？',
    },
    {
        id: 'time-persistence-past',
        type: 'time-extension',
        when: {
            all: [
                {
                    end: 'B4.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['time:past'],
        template: '回頭看，你可能曾經在某件別人早就放棄的事上堅持了很久，也許那段經歷成了你相信自己的依據。這只是依傾向的猜測，請對照自己的經驗。',
        hypothesis: '你過去有沒有哪一件事，是靠堅持才走到最後的？',
    },
    {
        id: 'time-sensitive-past',
        type: 'time-extension',
        when: {
            all: [
                {
                    end: 'C1.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['time:past'],
        template: '你的感受細膩，成長過程中可能很早就學會察言觀色，也許因此特別在意身邊人的情緒。這只是依傾向的猜測，請對照自己的經驗。',
        hypothesis: '小時候你是不是很容易察覺到家裡或班上的氣氛變化？',
    },
    {
        id: 'time-self-reliance-past',
        type: 'time-extension',
        when: {
            all: [
                {
                    end: 'E3.A', minGroups: 2, 
                },
            ], 
        },
        requiresIndependentSources: true,
        contexts: ['time:past'],
        template: '你重視自主，也許過去曾有一段時間，需要自己撐起一些事、慢慢養成凡事靠自己的習慣。這只是依傾向的猜測，請對照自己的經驗。',
        hypothesis: '你過去有沒有一段時間，必須自己想辦法解決大部分的事？',
    },
];
